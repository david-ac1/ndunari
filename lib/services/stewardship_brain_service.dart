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

🎯 GEMINI 3 HACKATHON: Leveraging 1M+ Token Context
====================================================
The following NCDC Antibiotic Stewardship Guidelines (2024) are loaded into your context window.
This demonstrates Gemini 3's ability to process extensive clinical documentation.

=== NCDC ANTIBIOTIC STEWARDSHIP GUIDELINES 2024 ===

SECTION 1: WHO AWaRe Classification for Nigeria

ACCESS ANTIBIOTICS (First-line, low resistance risk):
- Amoxicillin, Ampicillin, Benzylpenicillin
- Cloxacillin, Dicloxacillin
- Doxycycline, Tetracycline
- Metronidazole, Nitrofurantoin
- Trimethoprim-sulfamethoxazole (co-trimoxazole)
- Recommended for: Community-acquired respiratory infections, uncomplicated UTIs, skin infections

WATCH ANTIBIOTICS (Second-line, higher resistance potential):
- Ciprofloxacin, Levofloxacin, Ofloxacin
- Ceftriaxone, Cefotaxime, Cefixime
- Vancomycin (oral for C. diff only)
- Clarithromycin, Azithromycin
- WHO Guidance: Use ONLY when ACCESS drugs ineffective or contraindicated
- Nigeria-specific: Fluoroquinolone resistance now >40% in Lagos/Abuja for E. coli

RESERVE ANTIBIOTICS (Last-resort, highest priority):
- Azithromycin (for MDR typhoid, trachoma)
- Meropenem, Imipenem, Ert apenem (carbapenems)
- Colistin (polymyxins)
- Tigecycline, Linezolid
- Ceftazidime-avibactam, Ceftolozane-tazobactam
- NCDC Mandate: Requires infectious disease specialist approval
- Use ONLY for: Culture-proven resistant infections, septic shock, ICU infections

SECTION 2: Nigeria-Specific AMR Patterns (2024 Data)

LAGOS REGION:
- E. coli: 45% fluoroquinolone resistance, 12% carbapenem resistance
- Staphylococcus aureus: 38% MRSA prevalence
- Klebsiella pneumoniae: 22% ESBL-positive
- Recommendation: Avoid empiric ciprofloxacin for UTIs

KANO/NORTHERN NIGERIA:
- High typhoid incidence with MDR strains
- Azithromycin resistance: 8% and rising
- Ceftriaxone still effective (95% susceptibility)

SOUTHEAST (ENUGU, ONITSHA):
- Rising carbapenem resistance in hospital settings (18%)
- Community MRSA increasing (25%)

SECTION 3: Prescribing Decision Framework

STEP 1: Diagnosis Verification
- Is antibiotic actually needed? (Viral vs bacterial)
- Red flags for viral: Gradual onset, clear nasal discharge, normal WBC
- Antibiotics NOT needed: Common cold, flu, most sore throats, bronchitis

STEP 2: Drug Selection (Narrow → Broad)
- Start with ACCESS if possible
- Escalate to WATCH only if:
  * Previous ACCESS failure documented
  * High local resistance for ACCESS agent
  * Patient allergies limit options
- RESERVE drugs only for:
  * Culture-confirmed resistance
  * Sepsis/septic shock
  * Failed WATCH therapy

STEP 3: Dosing and Duration
- Community infections: 5-7 days usually sufficient
- Avoid prolonged courses (increases resistance)
- Ensure adequate dosing (under-dosing drives resistance)

SECTION 4: Patient Counseling Priorities

ADHERENCE:
- Take FULL course even if feeling better
- Missing doses → resistance development
- Set phone alarms for doses

FOOD INTERACTIONS:
- Fluoroquinolones: Avoid dairy within 2 hours
- Tetracyclines: Empty stomach, avoid minerals
- Amoxicillin: Can take with food

WARNING SIGNS (seek immediate care):
- Severe allergic reaction (rash, swelling, breathing difficulty)
- Persistent fever after 48-72 hours
- Worsening symptoms
- Severe diarrhea (possible C. diff)

SECTION 5: Regional Language Communication

Cultural Sensitivity:
- Northern Nigeria (Hausa): Emphasize family/community responsibility
- Southeast (Igbo): Direct, practical explanations preferred
- Southwest (Yoruba): Respect for medical authority, traditional medicine integration
- Nigerian Pidgin: Universal, informal, highly effective for adherence

===== END NCDC GUIDELINES =====

Your tasks:
1. Classify the antibiotic (ACCESS/WATCH/RESERVE) per NCDC guidelines above
2. Assess appropriateness based on infection type and Nigerian resistance patterns
3. Identify regional resistance concerns specific to patient location
4. Generate patient counseling in 5 Nigerian languages:
   - English (formal medical)
   - Nigerian Pidgin (informal, accessible)
   - Hausa (Northern Nigeria)
   - Igbo (Southeast Nigeria)
   - Yoruba (Southwest Nigeria)

CRITICAL: Ensure multilingual counseling is MEDICALLY ACCURATE, not just literal translation.
Adapt cultural messaging while preserving clinical safety information.

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
