import 'dart:typed_data';
import '../models/forensic_analysis_result.dart';
import '../models/stewardship_assessment.dart';
import '../services/forensic_eye_service.dart';
import '../services/stewardship_brain_service.dart';
import '../services/nafdac_registry_service.dart';

/// Agent Coordinator - Implements tiered thinking logic
/// 
/// Orchestrates between Forensic Eye (Flash) and Stewardship Brain (Pro)
/// to optimize API costs while maintaining accuracy.
///
/// Tiered Logic:
/// - Use Flash (cheap) for initial screening
/// - Hand off to Pro (expensive) only when:
///   1. Counterfeit probability < 95%
///   2. Reserve class antibiotic detected
///   3. Complex medical reasoning required
class AgentCoordinator {
  final ForensicEyeService _forensicEye = ForensicEyeService();
  final StewardshipBrainService _stewardshipBrain = StewardshipBrainService();
  final NAFDACRegistryService _nafdacService = NAFDACRegistryService();

  /// Scan drug package with tiered logic
  /// 
  /// Returns forensic analysis, potentially escalating to Pro for deep analysis
  Future<ForensicAnalysisResult> scanDrugPackage(
    Uint8List imageBytes,
    String location,
  ) async {
    // Step 1: Use Flash for initial forensic scan (fast, cheap)
    final flashResult = await _forensicEye.scanBatch(imageBytes, location);

    // Step 2: Check NAFDAC registry
    if (flashResult.batchNumber != null) {
      final nafdacResult =
          await _nafdacService.validateBatchNumber(flashResult.batchNumber);

      // Step 3: Decide if Pro analysis needed
      final needsProAnalysis = flashResult.authenticityScore < 95 ||
          !nafdacResult.isValid ||
          _nafdacService.isReserveDrug(nafdacResult.drugName);

      if (needsProAnalysis) {
        // 🚀 ACTIVE PRO ESCALATION - Grand Prize Feature!
        // Escalate to Gemini 3 Pro Thinking for deep forensic analysis
        print('⚠️ Suspicious drug detected. Escalating to Pro Thinking...');
        print('   - Authenticity: ${flashResult.authenticityScore}%');
        print('   - NAFDAC Valid: ${nafdacResult.isValid}');
        print('   - Drug Class: ${nafdacResult.classification}');
        
        final proResult = await _forensicEye.deepAnalysis(
          imageBytes,
          location,
          flashResult,
          nafdacResult,
        );
        
        // Pro analysis complete - return enhanced result
        return proResult;
      }

      // Authentication confident, return Flash result
      return ForensicAnalysisResult(
        authenticityScore: flashResult.authenticityScore,
        isAuthentic: flashResult.isAuthentic && nafdacResult.isValid,
        findings: [
          ...flashResult.findings,
          'NAFDAC verified: ${nafdacResult.drugName}',
        ],
        batchNumber: flashResult.batchNumber,
        nafdacVerified: nafdacResult.isValid,
        location: location,
        scannedAt: DateTime.now(),
        thoughtSignature: flashResult.thoughtSignature,
      );
    }

    return flashResult;
  }

  /// Assess prescription with automatic Reserve drug escalation
  /// 
  /// Uses Pro model for all stewardship assessments
  /// Pro is justified here due to medical complexity and multilingual requirements
  Future<StewardshipAssessment> assessPrescription(
    String prescriptionText,
    String location,
  ) async {
    // Always use Pro for stewardship (medical reasoning complexity)
    return await _stewardshipBrain.assessStewardship(
      prescriptionText,
      location,
    );
  }

  /// Get estimated API cost for operation
  Map<String, dynamic> estimateCost(
    {bool isForensicScan = false, bool needsProEscalation = false}) {
    if (isForensicScan) {
      if (needsProEscalation) {
        return {
          'model': 'Flash + Pro',
          'estimated_cost_usd': 0.016, // ~$0.001 + $0.015
          'reason': 'Suspicious scan requires deep analysis',
        };
      }
      return {
        'model': 'Flash only',
        'estimated_cost_usd': 0.001,
        'reason': 'Standard forensic scan',
      };
    } else {
      return {
        'model': 'Pro only',
        'estimated_cost_usd': 0.014,
        'reason': 'Stewardship requires complex medical reasoning',
      };
    }
  }
}
