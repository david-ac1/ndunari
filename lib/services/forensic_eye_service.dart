import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../models/forensic_analysis_result.dart';

/// Forensic Eye Service - Gemini 3 Flash for drug authentication
class ForensicEyeService {
  late final GenerativeModel _model;
  String? _lastThoughtSignature;

  ForensicEyeService() {
    _initializeModel();
  }

  void _initializeModel() {
    final apiKey = dotenv.env['GEMINI_API_KEY'];
    if (apiKey == null || apiKey.isEmpty) {
      throw Exception('GEMINI_API_KEY not found in .env file');
    }

    // Initialize Gemini 3 Flash with minimal thinking
    _model = GenerativeModel(
      model: 'gemini-2.0-flash-exp',
      apiKey: apiKey,
      generationConfig: GenerationConfig(
        temperature: 1.0, // Critical: Must be 1.0 per manifest
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      ),
      systemInstruction: Content.text('''
You are a forensic drug authentication assistant for Nigeria.
Analyze pharmaceutical package images to detect counterfeit medications.

Check for:
1. Typography errors (brand name misspellings, font inconsistencies)
2. Hologram reflection patterns and quality
3. NAFDAC registration number visibility and format
4. Packaging quality indicators (printing quality, color accuracy, seal integrity)
5. Expiry date format and legibility

Return JSON format:
{
  "authenticity_score": 0-100,
  "is_authentic": boolean,
  "findings": ["finding1", "finding2"],
  "batch_number": "NAF-YYYY-XXXXXX or null",
  "warnings": ["warning1", "warning2"]
}

Score guidelines:
- 95-100: Authentic
- 70-94: Suspicious, needs verification
- 0-69: Likely counterfeit

Be thorough and specific in findings.
'''),
    );
  }

  /// Scan drug package batch for authenticity
  Future<ForensicAnalysisResult> scanBatch(
    Uint8List imageBytes,
    String gpsCoord,
  ) async {
    try {
      // Prepare image content
      final imagePart = DataPart('image/jpeg', imageBytes);

      // Create prompt with location context
      final prompt = '''
Analyze this pharmaceutical package image for authenticity.
Scanned location: $gpsCoord

Provide detailed forensic analysis checking typography, holograms, NAFDAC number, and packaging quality.
Return results in JSON format as specified.
''';

      final content = [
        Content.multi([
          TextPart(prompt),
          imagePart,
        ]),
      ];

      // Add thought signature if available (for multi-turn conversations)
      // Note: This is a placeholder for proper thought signature handling
      // which requires tracking conversation context

      // Generate response
      final response = await _model.generateContent(content);

      // Extract thought signature for future turns
      // TODO: Implement proper thought signature extraction from response metadata

      // Parse JSON response
      final responseText = response.text ?? '';
      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);

      if (jsonMatch == null) {
        throw Exception('No JSON found in response');
      }

      final jsonData = json.decode(jsonMatch.group(0)!);

      // Create result
      return ForensicAnalysisResult(
        authenticityScore:
            (jsonData['authenticity_score'] as num?)?.toDouble() ?? 0.0,
        isAuthentic: jsonData['is_authentic'] ?? false,
        findings: (jsonData['findings'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        batchNumber: jsonData['batch_number'],
        nafdacVerified: false, // Will be updated by NAFDAC service
        location: gpsCoord,
        scannedAt: DateTime.now(),
        thoughtSignature: _lastThoughtSignature,
      );
    } catch (e) {
      throw Exception('Forensic analysis failed: $e');
    }
  }

  /// Verify with NAFDAC registry (mock for now)
  Future<bool> verifyNAFDAC(String? batchNumber) async {
    if (batchNumber == null || batchNumber.isEmpty) {
      return false;
    }

    // TODO: Implement real NAFDAC API integration
    // Mock implementation: verify format
    final nafdacPattern = RegExp(r'NAF-\d{4}-\d{6}');
    return nafdacPattern.hasMatch(batchNumber);
  }

  /// Deep forensic analysis using Pro model (for suspicious cases)
  Future<ForensicAnalysisResult> deepAnalysis(
    Uint8List imageBytes,
    String gpsCoord,
    ForensicAnalysisResult flashResult,
  ) async {
    // TODO: Implement Gemini Pro deep analysis
    // This would be called when authenticityScore < 95
    // Uses thinking_level="high" for complex reasoning
    throw UnimplementedError('Pro deep analysis coming in Phase 2');
  }
}
