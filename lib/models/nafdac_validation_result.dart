/// NAFDAC validation result
class NAFDACValidationResult {
  final bool isValid;
  final String? drugName;
  final String? manufacturer;
  final DateTime? expiryDate;
  final String registrationStatus; // "VERIFIED", "INVALID", "EXPIRED", "UNKNOWN"
  final String? registrationNumber;
  final String classification; // WHO AWaRe: ACCESS, WATCH, RESERVE

  NAFDACValidationResult({
    required this.isValid,
    this.drugName,
    this.manufacturer,
    this.expiryDate,
    required this.registrationStatus,
    this.registrationNumber,
    this.classification = 'UNKNOWN',
  });

  factory NAFDACValidationResult.fromJson(Map<String, dynamic> json) {
    return NAFDACValidationResult(
      isValid: json['is_valid'] ?? false,
      drugName: json['drug_name'],
      manufacturer: json['manufacturer'],
      expiryDate: json['expiry_date'] != null
          ? DateTime.parse(json['expiry_date'])
          : null,
      registrationStatus: json['registration_status'] ?? 'UNKNOWN',
      registrationNumber: json['registration_number'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'is_valid': isValid,
      'drug_name': drugName,
      'manufacturer': manufacturer,
      'expiry_date': expiryDate?.toIso8601String(),
      'registration_status': registrationStatus,
      'registration_number': registrationNumber,
    };
  }
}
