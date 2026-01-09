import 'nafdac_validation_result.dart';

/// Result of forensic analysis from Gemini models
class ForensicAnalysisResult {
  // Core identification
  final String drugName;
  final String manufacturer;
  final String? nafdacNumber;
  
  // Authenticity assessment
  final double authenticityScore; // 0-100
  final bool isAuthentic; // true if score >= 95.0
  
  // Detailed findings
  final List<String> findings; // Positive indicators
  final List<String> warnings; // Concerns
  final List<String> suspiciousFeatures; // Red flags
  
  // Model information
  final String modelUsed; // "gemini-2.0-flash-exp" or "gemini-2.0-pro-exp"
  final bool wasEscalated; // true if escalated to Pro
  final String? escalationReason;
  final double confidence; // 0-100
  
  // NAFDAC validation
  final NAFDACValidationResult nafdacValidation;
  
  // Pro-specific analysis (only if escalated)
  final ProAnalysisDetails? proAnalysis;
  
  // Metadata
  final DateTime scannedAt;
  final String? location;
  final String imageHash;

  const ForensicAnalysisResult({
    required this.drugName,
    required this.manufacturer,
    this.nafdacNumber,
    required this.authenticityScore,
    required this.isAuthentic,
    required this.findings,
    required this.warnings,
    required this.suspiciousFeatures,
    required this.modelUsed,
    required this.wasEscalated,
    this.escalationReason,
    required this.confidence,
    required this.nafdacValidation,
    this.proAnalysis,
    required this.scannedAt,
    this.location,
    required this.imageHash,
  });

  /// Get risk level based on score
  String get riskLevel {
    if (authenticityScore >= 95.0) return 'SAFE';
    if (authenticityScore >= 80.0) return 'LOW RISK';
    if (authenticityScore >= 60.0) return 'MODERATE RISK';
    if (authenticityScore >= 40.0) return 'HIGH RISK';
    return 'CRITICAL RISK';
  }

  Map<String, dynamic> toJson() => {
        'drugName': drugName,
        'manufacturer': manufacturer,
        'nafdacNumber': nafdacNumber,
        'authenticityScore': authenticityScore,
        'isAuthentic': isAuthentic,
        'findings': findings,
        'warnings': warnings,
        'suspiciousFeatures': suspiciousFeatures,
        'modelUsed': modelUsed,
        'wasEscalated': wasEscalated,
        'escalationReason': escalationReason,
        'confidence': confidence,
        'nafdacValidation': nafdacValidation.toJson(),
        'proAnalysis': proAnalysis?.toJson(),
        'scannedAt': scannedAt.toIso8601String(),
        'location': location,
        'imageHash': imageHash,
      };

  factory ForensicAnalysisResult.fromJson(Map<String, dynamic> json) {
    return ForensicAnalysisResult(
      drugName: json['drugName'] as String,
      manufacturer: json['manufacturer'] as String,
      nafdacNumber: json['nafdacNumber'] as String?,
      authenticityScore: (json['authenticityScore'] as num).toDouble(),
      isAuthentic: json['isAuthentic'] as bool,
      findings: (json['findings'] as List<dynamic>).map((e) => e as String).toList(),
      warnings: (json['warnings'] as List<dynamic>).map((e) => e as String).toList(),
      suspiciousFeatures: (json['suspiciousFeatures'] as List<dynamic>).map((e) => e as String).toList(),
      modelUsed: json['modelUsed'] as String,
      wasEscalated: json['wasEscalated'] as bool,
      escalationReason: json['escalationReason'] as String?,
      confidence: (json['confidence'] as num).toDouble(),
      nafdacValidation: NAFDACValidationResult.fromJson(json['nafdacValidation'] as Map<String, dynamic>),
      proAnalysis: json['proAnalysis'] != null
          ? ProAnalysisDetails.fromJson(json['proAnalysis'] as Map<String, dynamic>)
          : null,
      scannedAt: DateTime.parse(json['scannedAt'] as String),
      location: json['location'] as String?,
      imageHash: json['imageHash'] as String,
    );
  }
}

/// Detailed analysis from Pro model
class ProAnalysisDetails {
  final String hologramRefraction;
  final String typographyKerning;
  final String nafdacSyntax;
  final String printingQuality;
  final String overallAssessment;

  const ProAnalysisDetails({
    required this.hologramRefraction,
    required this.typographyKerning,
    required this.nafdacSyntax,
    required this.printingQuality,
    required this.overallAssessment,
  });

  Map<String, dynamic> toJson() => {
        'hologramRefraction': hologramRefraction,
        'typographyKerning': typographyKerning,
        'nafdacSyntax': nafdacSyntax,
        'printingQuality': printingQuality,
        'overallAssessment': overallAssessment,
      };

  factory ProAnalysisDetails.fromJson(Map<String, dynamic> json) {
    return ProAnalysisDetails(
      hologramRefraction: json['hologramRefraction'] as String,
      typographyKerning: json['typographyKerning'] as String,
      nafdacSyntax: json['nafdacSyntax'] as String,
      printingQuality: json['printingQuality'] as String,
      overallAssessment: json['overallAssessment'] as String,
    );
  }
}
