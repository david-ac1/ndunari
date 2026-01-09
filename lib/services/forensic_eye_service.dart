import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../core/constants/app_constants.dart';
import '../models/forensic_analysis_result.dart';
import '../models/nafdac_validation_result.dart';
import 'nafdac_registry_service.dart';

/// Forensic Eye Service - Gemini-powered drug authentication
/// Implements tiered analysis: Flash → Pro escalation
class ForensicEyeService {
  final String _apiKey;
  late final GenerativeModel _flashModel;
  late final GenerativeModel _proModel;
  final NAFDACRegistryService _nafdacService;
  
  // Cache for recent scans (avoid duplicate processing)
  final Map<String, ForensicAnalysisResult> _cache = {};

  ForensicEyeService({
    required String apiKey,
    NAFDACRegistryService? nafdacService,
  })  : _apiKey = apiKey,
        _nafdacService = nafdacService ?? NAFDACRegistryService() {
    _initializeModels();
  }

  void _initializeModels() {
    // Gemini Flash - Fast triage
    _flashModel = GenerativeModel(
      model: AppConstants.geminiFlashModel,
      apiKey: _apiKey,
      generationConfig: GenerationConfig(
        temperature: AppConstants.geminiTemperature,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      ),
      systemInstruction: Content.system(_forensicFlashPrompt),
    );

    // Gemini Pro - Deep forensic analysis
    _proModel = GenerativeModel(
      model: AppConstants.geminiProModel,
      apiKey: _apiKey,
      generationConfig: GenerationConfig(
        temperature: 1.0,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      ),
      systemInstruction: Content.system(_forensicProPrompt),
    );
  }

  /// Main entry point: Scan drug package with tiered analysis
  Future<ForensicAnalysisResult> scanDrugPackage(
    Uint8List imageBytes,
    String? location,
  ) async {
    // Generate image hash for deduplication
    final imageHash = sha256.convert(imageBytes).toString().substring(0, 16);

    // Check cache (within last 5 minutes)
    if (_cache.containsKey(imageHash)) {
      final cached = _cache[imageHash]!;
      if (DateTime.now().difference(cached.scannedAt).inMinutes < 5) {
        return cached;
      }
    }

    // Step 1: Flash analysis
    final flashResult = await _analyzeWithFlash(imageBytes);

    // Step 2: Check escalation criteria
    final shouldEscalate = _shouldEscalate(flashResult);

    ForensicAnalysisResult result;

    if (shouldEscalate) {
      // Step 3a: Escalate to Pro
      result = await _analyzeWithPro(imageBytes, flashResult, location, imageHash);
    } else {
      // Step 3b: Build result from Flash
      final nafdacValidation = flashResult['nafdacNumber'] != null
          ? await _nafdacService.validateNumber(flashResult['nafdacNumber'] as String?)
          : NAFDACValidationResult.invalid();

      result = _buildResult(flashResult, nafdacValidation, location, imageHash, false);
    }

    // Cache result
    _cache[imageHash] = result;
    _cleanupCache();

    return result;
  }

  /// Analyze with Flash model (initial scan)
  Future<Map<String, dynamic>> _analyzeWithFlash(Uint8List imageBytes) async {
    try {
      final content = [
        Content.multi([
          TextPart(_flashUserPrompt),
          DataPart('image/jpeg', imageBytes),
        ])
      ];

      final response = await _flashModel.generateContent(
        content,
        generationConfig: GenerationConfig(
          temperature: AppConstants.geminiTemperature,
          maxOutputTokens: 2048,
        ),
      );

      final jsonText = response.text ?? '{}';
      return json.decode(jsonText) as Map<String, dynamic>;
    } catch (e) {
      throw ForensicEyeException(
        'Flash analysis failed: $e',
        code: 'FLASH_ERROR',
        originalError: e,
      );
    }
  }

  /// Analyze with Pro model (escalated scan)
  Future<ForensicAnalysisResult> _analyzeWithPro(
    Uint8List imageBytes,
    Map<String, dynamic> flashResult,
    String? location,
    String imageHash,
  ) async {
    try {
      // Build Pro prompt with Flash context
      final proUserPrompt = _buildProPrompt(flashResult);

      final content = [
        Content.multi([
          TextPart(proUserPrompt),
          DataPart('image/jpeg', imageBytes),
        ])
      ];

      final response = await _proModel.generateContent(content);

      final jsonText = response.text ?? '{}';
      final proResult = json.decode(jsonText) as Map<String, dynamic>;

      // Validate NAFDAC
      final nafdacValidation = proResult['nafdacNumber'] != null
          ? await _nafdacService.validateNumber(proResult['nafdacNumber'] as String?)
          : NAFDACValidationResult.invalid();

      return _buildResult(
        proResult,
        nafdacValidation,
        location,
        imageHash,
        true,
        escalationReason: 'Low confidence from Flash scan (${flashResult['confidence']}%)',
      );
    } catch (e) {
      throw ForensicEyeException(
        'Pro analysis failed: $e',
        code: 'PRO_ERROR',
        originalError: e,
      );
    }
  }

  /// Check if escalation to Pro is needed
  bool _shouldEscalate(Map<String, dynamic> flashResult) {
    final confidence = (flashResult['confidence'] as num?)?.toDouble() ?? 0.0;
    final authenticityScore = (flashResult['authenticityScore'] as num?)?.toDouble() ?? 0.0;
    final recommendEscalation = flashResult['recommendEscalation'] as bool? ?? false;
    final nafdacNumber = flashResult['nafdacNumber'] as String?;
    final suspiciousFeatures = flashResult['suspiciousFeatures'] as List? ?? [];

    return confidence < 95.0 ||
        authenticityScore < 95.0 ||
        recommendEscalation ||
        nafdacNumber == null ||
        suspiciousFeatures.isNotEmpty;
  }

  /// Build Pro prompt with Flash context
  String _buildProPrompt(Map<String, dynamic> flashResult) {
    return '''
ESCALATION CONTEXT:
The Flash model analyzed this package and found:
- Confidence: ${flashResult['confidence']}%
- Authenticity Score: ${flashResult['authenticityScore']}/100
- Findings: ${flashResult['findings']}
- Warnings: ${flashResult['warnings']}
- Suspicious Features: ${flashResult['suspiciousFeatures']}

Please perform an EXPERT-LEVEL forensic analysis with your superior reasoning capabilities.

$_proUserPrompt
''';
  }

  /// Build ForensicAnalysisResult from model output
  ForensicAnalysisResult _buildResult(
    Map<String, dynamic> modelResult,
    NAFDACValidationResult nafdacValidation,
    String? location,
    String imageHash,
    bool wasEscalated, {
    String? escalationReason,
  }) {
    final authenticityScore = (modelResult['authenticityScore'] as num?)?.toDouble() ?? 0.0;

    return ForensicAnalysisResult(
      drugName: modelResult['drugName'] as String? ?? 'Unknown',
      manufacturer: modelResult['manufacturer'] as String? ?? 'Unknown',
      nafdacNumber: modelResult['nafdacNumber'] as String?,
      authenticityScore: authenticityScore,
      isAuthentic: authenticityScore >= 95.0,
      findings: (modelResult['findings'] as List?)?.map((e) => e.toString()).toList() ?? [],
      warnings: (modelResult['warnings'] as List?)?.map((e) => e.toString()).toList() ?? [],
      suspiciousFeatures:
          (modelResult['suspiciousFeatures'] as List?)?.map((e) => e.toString()).toList() ?? [],
      modelUsed: wasEscalated ? AppConstants.geminiProModel : AppConstants.geminiFlashModel,
      wasEscalated: wasEscalated,
      escalationReason: escalationReason,
      confidence: (modelResult['confidence'] as num?)?.toDouble() ?? authenticityScore,
      nafdacValidation: nafdacValidation,
      proAnalysis: modelResult['proAnalysis'] != null
          ? ProAnalysisDetails.fromJson(modelResult['proAnalysis'] as Map<String, dynamic>)
          : null,
      scannedAt: DateTime.now(),
      location: location,
      imageHash: imageHash,
    );
  }

  /// Cleanup old cache entries
  void _cleanupCache() {
    if (_cache.length > 50) {
      final sortedEntries = _cache.entries.toList()
        ..sort((a, b) => b.value.scannedAt.compareTo(a.value.scannedAt));
      _cache.clear();
      _cache.addAll(Map.fromEntries(sortedEntries.take(25)));
    }
  }

  // Prompts
  static const _forensicFlashPrompt = '''
You are the Forensic Eye agent for Ndunari, a pharmaceutical authentication system in Nigeria.

MISSION: Analyze drug package images for authenticity indicators with MICROSCOPIC precision.

ANALYSIS CHECKLIST:
1. NAFDAC Registration Number
   - Format: Must be "NAFDAC NO: XX-XXXX" or "A4-XXXX" pattern
   - Typography: Check for font consistency, spacing, kerning errors
   - Placement: Should be on specific locations per drug type
   
2. Hologram/Security Features
   - Presence: Is there a hologram or security seal?
   - Refraction: Does it show rainbow/prismatic effects? (Fakes often use flat silver)
   - 3D Depth: Genuine holograms have depth layers
   
3. Typography & Printing Quality
   - Kerning: Letter spacing should be uniform
   - Alignment: Text should be perfectly straight
   - Print Quality: Genuine drugs have sharp, clear printing (no blurriness)
   - Color Consistency: Uniform ink distribution
   
4. Packaging Structure
   - Seal Quality: Crisp, tamper-evident seals
   - Material: Quality of cardboard/plastic
   - Barcode: Must be scannable, correct format
   
5. Batch Number & Expiry
   - Format: Check date format consistency
   - Embossing: Should be pressed/stamped, not just printed
   - Logic: Expiry should be 2-5 years from manufacture

OUTPUT FORMAT (JSON):
{
  "drugName": "string",
  "manufacturer": "string",
  "nafdacNumber": "string_or_null",
  "authenticityScore": 0-100,
  "findings": ["list of positive indicators"],
  "warnings": ["list of suspicious elements"],
  "suspiciousFeatures": ["critical red flags"],
  "confidence": 0-100,
  "recommendEscalation": boolean
}

CRITICAL RULES:
- If confidence < 95%, set recommendEscalation: true
- If NAFDAC number is missing/malformed, score ≤ 60
- If multiple suspicious features, score ≤ 70
- Be CAUTIOUS: When in doubt, escalate to Pro model
- Focus on MICROSCOPIC details fakes often miss
''';

  static const _flashUserPrompt = '''
Analyze this drug package image for authenticity. Look for:
1. NAFDAC registration number (format and quality)
2. Hologram/security features
3. Typography and printing quality
4. Packaging integrity
5. Batch number and expiry date

Return your analysis as JSON matching the specified format.
''';

  static const _forensicProPrompt = '''
You are the Forensic Eye PRO agent for Ndunari. A drug package has been escalated for EXPERT-LEVEL analysis.

You have superior reasoning capabilities. Use them to detect sophisticated counterfeits.

ADVANCED ANALYSIS:
1. Hologram Refraction Physics
   - Analyze light diffraction patterns
   - Check for multi-layer depth (genuine = 3+ layers)
   - Identify foil vs genuine hologram
   
2. Typography Forensics
   - Measure kerning precision (± 0.5px tolerance)
   - Detect font substitution (counterfeiters use Arial instead of Helvetica)
   - Check baseline alignment across entire text
   - Analyze ink bleed patterns
   
3. NAFDAC Number Deep Validation
   - Syntax: Must match regex /NAFDAC\\s*(NO:?)?\\s*[A-Z0-9]{2}-[0-9]{4}/i
   - Checksum: Apply Luhn algorithm if applicable
   - Historical: Cross-reference against known valid ranges
   
4. Microscopic Printing Analysis
   - Dot pattern: Genuine uses offset printing (uniform dots)
   - Color separation: Check CMYK registration
   - Microtext: Genuine drugs often have micro-printed security text
   
5. Packaging Material Science
   - Cardboard fiber quality
   - UV ink presence (genuine drugs often use UV-reactive inks)
   - Lamination quality
   
6. Supply Chain Logic
   - Does expiry date make sense for product lifecycle?
   - Is batch number format consistent with manufacturer standards?
   - Location plausibility (e.g., cold-chain drugs in hot regions)

OUTPUT FORMAT (JSON):
{
  "drugName": "string",
  "manufacturer": "string",
  "nafdacNumber": "string_or_null",
  "authenticityScore": 0-100,
  "findings": ["detailed positive indicators with measurements"],
  "warnings": ["nuanced concerns with reasoning"],
  "suspiciousFeatures": ["critical red flags with forensic evidence"],
  "confidence": 0-100,
  "proAnalysis": {
    "hologramRefraction": "detailed analysis",
    "typographyKerning": "measurements and deviations",
    "nafdacSyntax": "validation result",
    "printingQuality": "microscopic assessment",
    "overallAssessment": "clinical-grade conclusion"
  }
}

REASONING APPROACH:
- Think step-by-step through each indicator
- Weigh evidence (strong vs weak signals)
- Provide FORENSIC-LEVEL confidence
- If still uncertain after deep analysis, score conservatively
''';

  static const _proUserPrompt = '''
Perform an EXPERT-LEVEL forensic analysis of this drug package. Use your advanced reasoning to detect microscopic counterfeits.

Focus on:
1. Hologram refraction physics (multi-layer depth, diffraction patterns)
2. Typography kerning forensics (sub-pixel precision)
3. NAFDAC number deep validation (syntax, checksum, patterns)
4. Microscopic printing quality (dot patterns, CMYK registration)
5. Packaging material science

Return your analysis as JSON with the proAnalysis section included.
''';
}

/// Forensic Eye exceptions
class ForensicEyeException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const ForensicEyeException(
    this.message, {
    this.code,
    this.originalError,
  });

  @override
  String toString() => 'ForensicEyeException: $message ${code != null ? '($code)' : ''}';
}
