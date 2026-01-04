/// Stewardship assessment result from Gemini 3 Pro
class StewardshipAssessment {
  final String drugClass; // "ACCESS", "WATCH", "RESERVE", "UNKNOWN"
  final String riskLevel; // "LOW", "MEDIUM", "HIGH"
  final bool isAppropriate;
  final List<String> recommendations;
  final Map<String, String> counseling; // language -> counseling text
  final List<String> resistanceConcerns;
  final String? thoughtSignature;

  StewardshipAssessment({
    required this.drugClass,
    required this.riskLevel,
    required this.isAppropriate,
    required this.recommendations,
    required this.counseling,
    required this.resistanceConcerns,
    this.thoughtSignature,
  });

  factory StewardshipAssessment.fromJson(Map<String, dynamic> json) {
    return StewardshipAssessment(
      drugClass: json['drug_class'] ?? 'UNKNOWN',
      riskLevel: json['risk_level'] ?? 'UNKNOWN',
      isAppropriate: json['is_appropriate'] ?? false,
      recommendations: (json['recommendations'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      counseling: (json['counseling'] as Map<String, dynamic>?)
              ?.map((k, v) => MapEntry(k, v.toString())) ??
          {},
      resistanceConcerns: (json['resistance_concerns'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      thoughtSignature: json['thought_signature'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'drug_class': drugClass,
      'risk_level': riskLevel,
      'is_appropriate': isAppropriate,
      'recommendations': recommendations,
      'counseling': counseling,
      'resistance_concerns': resistanceConcerns,
      'thought_signature': thoughtSignature,
    };
  }

  /// Get color for risk level badge
  String get riskLevelColor {
    switch (riskLevel) {
      case 'HIGH':
        return 'red';
      case 'MEDIUM':
        return 'orange';
      case 'LOW':
        return 'green';
      default:
        return 'gray';
    }
  }
}
