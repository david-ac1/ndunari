import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../models/stewardship_assessment.dart';

/// Stewardship Brain Service - Gemini 3 Pro for antibiotic stewardship
/// 
/// Uses high thinking level for complex medical reasoning and multilingual counseling
class StewardshipBrainService {
  late final GenerativeModel _model;
  String? _lastThoughtSignature;

  StewardshipBrainService() {
    _initializeModel();
  }

  void _initializeModel() {
    final apiKey = dotenv.env['GEMINI_API_KEY'];
    if (apiKey == null || apiKey.isEmpty) {
      throw Exception('GEMINI_API_KEY not found in .env file');
    }

    // Initialize Gemini 3 Pro with HIGH thinking for medical reasoning
    _model = GenerativeModel(
      model: 'gemini-2.0-flash-thinking-exp-1219',
      apiKey: apiKey,
      generationConfig: GenerationConfig(
        temperature: 1.0, // Critical: Must be 1.0 per manifest
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // More tokens for detailed counseling
      ),
      systemInstruction: Content.text('''
You are a medical stewardship advisor for Nigeria's National Centre for Disease Control (NCDC).

Your role is to evaluate antibiotic prescriptions and provide guidance to prevent antimicrobial resistance (AMR).

Context - WHO AWaRe Classification:
- ACCESS: First-choice antibiotics (low resistance risk)
- WATCH: Second-choice antibiotics (higher resistance risk, use with caution)
- RESERVE: Last-resort antibiotics (highest priority, only for severe infections)

Nigeria-specific concerns:
- High rates of fluoroquinolone resistance in Lagos and Kano
- Rising carbapenem resistance in hospital settings
- Community-acquired MRSA increasing in urban areas
- Limited access to culture and sensitivity testing

Your tasks:
1. Classify the antibiotic (ACCESS/WATCH/RESERVE)
2. Assess appropriateness based on infection type and severity
3. Identify regional resistance concerns
4. Generate patient counseling in 5 Nigerian languages:
   - English (formal medical)
   - Nigerian Pidgin (informal, accessible)
   - Hausa (Northern Nigeria)
   - Igbo (Southeast Nigeria)
   - Yoruba (Southwest Nigeria)

Return JSON format:
{
  "drug_class": "ACCESS|WATCH|RESERVE",
  "risk_level": "LOW|MEDIUM|HIGH",
  "is_appropriate": boolean,
  "recommendations": ["recommendation1", "recommendation2"],
  "counseling": {
    "english": "formal counseling text",
    "pidgin": "pidgin counseling text",
    "hausa": "hausa counseling text",
    "igbo": "igbo counseling text",
    "yoruba": "yoruba counseling text"
  },
  "resistance_concerns": ["concern1", "concern2"]
}

Be thorough, culturally sensitive, and prioritize patient safety.
'''),
    );
  }

  /// Assess antibiotic stewardship for a prescription
  Future<StewardshipAssessment> assessStewardship(
    String prescriptionText,
    String location,
  ) async {
    try {
      final prompt = '''
Analyze this prescription for antibiotic stewardship:

Prescription: $prescriptionText
Location: $location (Nigeria)

Evaluate:
1. Is this an ACCESS, WATCH, or RESERVE class antibiotic?
2. Is the prescription appropriate for the indicated condition?
3. What are the regional antimicrobial resistance concerns for this location?
4. Generate patient counseling explaining:
   - Why this specific antibiotic was chosen
   - How to take it correctly (dosage, duration, with/without food)
   - Warning signs to watch for
   - Why completing the full course is critical

Provide counseling in all 5 Nigerian languages.
Return the result in JSON format as specified.
''';

      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);

      // Extract thought signature for future multi-turn conversations
      // TODO: Implement proper thought signature extraction

      // Parse JSON response
      final responseText = response.text ?? '';
      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);

      if (jsonMatch == null) {
        throw Exception('No JSON found in response');
      }

      final jsonData = json.decode(jsonMatch.group(0)!);

      return StewardshipAssessment.fromJson(jsonData);
    } catch (e) {
      throw Exception('Stewardship assessment failed: $e');
    }
  }

  /// Check if prescription requires intervention (Reserve drugs or high risk)
  bool requiresIntervention(StewardshipAssessment assessment) {
    return assessment.drugClass == 'RESERVE' ||
        assessment.riskLevel == 'HIGH' ||
        !assessment.isAppropriate;
  }
}
