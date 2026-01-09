/// NAFDAC validation result model
class NAFDACValidationResult {
  final bool isValid;
  final bool isRegistered;
  final String? registrationNumber;
  final String? productCategory;
  final String? expiryDate;
  final List<String> validationErrors;

  const NAFDACValidationResult({
    required this.isValid,
    this.isRegistered = false,
    this.registrationNumber,
    this.productCategory,
    this.expiryDate,
    this.validationErrors = const [],
  });

  factory NAFDACValidationResult.invalid({
    List<String> errors = const ['NAFDAC number not found or invalid format'],
  }) {
    return NAFDACValidationResult(
      isValid: false,
      validationErrors: errors,
    );
  }

  factory NAFDACValidationResult.valid({
    required String registrationNumber,
    String? productCategory,
    String? expiryDate,
  }) {
    return NAFDACValidationResult(
      isValid: true,
      isRegistered: true,
      registrationNumber: registrationNumber,
      productCategory: productCategory,
      expiryDate: expiryDate,
    );
  }

  Map<String, dynamic> toJson() => {
        'isValid': isValid,
        'isRegistered': isRegistered,
        'registrationNumber': registrationNumber,
        'productCategory': productCategory,
        'expiryDate': expiryDate,
        'validationErrors': validationErrors,
      };

  factory NAFDACValidationResult.fromJson(Map<String, dynamic> json) {
    return NAFDACValidationResult(
      isValid: json['isValid'] as bool,
      isRegistered: json['isRegistered'] as bool? ?? false,
      registrationNumber: json['registrationNumber'] as String?,
      productCategory: json['productCategory'] as String?,
      expiryDate: json['expiryDate'] as String?,
      validationErrors: (json['validationErrors'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }
}
