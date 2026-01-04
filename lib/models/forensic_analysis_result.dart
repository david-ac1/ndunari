/// Forensic analysis result from Gemini 3 Flash
class ForensicAnalysisResult {
  final double authenticityScore; // 0-100
  final bool isAuthentic; // true if score >= 95
  final List<String> findings; // Detected issues
  final String? batchNumber; // Extracted NAFDAC number
  final bool nafdacVerified; // From registry lookup
  final String location; // GPS coordinates
  final DateTime scannedAt;
  final String? thoughtSignature; // For multi-turn context

  ForensicAnalysisResult({
    required this.authenticityScore,
    required this.isAuthentic,
    required this.findings,
    this.batchNumber,
    required this.nafdacVerified,
    required this.location,
    required this.scannedAt,
    this.thoughtSignature,
  });

  factory ForensicAnalysisResult.fromJson(Map<String, dynamic> json) {
    return ForensicAnalysisResult(
      authenticityScore: (json['authenticity_score'] as num?)?.toDouble() ?? 0.0,
      isAuthentic: json['is_authentic'] ?? false,
      findings: (json['findings'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      batchNumber: json['batch_number'],
      nafdacVerified: json['nafdac_verified'] ?? false,
      location: json['location'] ?? '',
      scannedAt: json['scanned_at'] != null
          ? DateTime.parse(json['scanned_at'])
          : DateTime.now(),
      thoughtSignature: json['thought_signature'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'authenticity_score': authenticityScore,
      'is_authentic': isAuthentic,
      'findings': findings,
      'batch_number': batchNumber,
      'nafdac_verified': nafdacVerified,
      'location': location,
      'scanned_at': scannedAt.toIso8601String(),
      'thought_signature': thoughtSignature,
    };
  }

  /// Get color for authenticity badge based on score
  String get authenticityColor {
    if (authenticityScore >= 95) return 'green';
    if (authenticityScore >= 70) return 'orange';
    return 'red';
  }

  /// Get status text
  String get statusText {
    if (isAuthentic) return 'AUTHENTIC';
    if (authenticityScore >= 70) return 'SUSPICIOUS';
    return 'COUNTERFEIT WARNING';
  }
}
