import '../models/nafdac_validation_result.dart';

/// Service for NAFDAC registry validation
class NAFDACRegistryService {
  // Common NAFDAC number patterns
  static final _nafdacRegex = RegExp(
    r'NAFDAC\s*(?:NO:?)?\s*([A-Z0-9]{2}-[0-9]{4})',
    caseSensitive: false,
  );

  static final _alternateRegex = RegExp(
    r'([A-Z]{1,2}[0-9]{1,2}-[0-9]{4})',
    caseSensitive: false,
  );

  /// Validate a NAFDAC number for syntax correctness
  Future<NAFDACValidationResult> validateNumber(String? input) async {
    if (input == null || input.trim().isEmpty) {
      return NAFDACValidationResult.invalid(
        errors: ['NAFDAC number is required'],
      );
    }

    // Try primary pattern
    final primaryMatch = _nafdacRegex.firstMatch(input);
    if (primaryMatch != null) {
      final number = primaryMatch.group(1)!;
      return await _performDetailedValidation(number);
    }

    // Try alternate pattern
    final alternateMatch = _alternateRegex.firstMatch(input);
    if (alternateMatch != null) {
      final number = alternateMatch.group(1)!;
      return await _performDetailedValidation(number);
    }

    return NAFDACValidationResult.invalid(
      errors: [
        'Invalid NAFDAC number format',
        'Expected format: "NAFDAC NO: XX-XXXX" or "A4-XXXX"',
      ],
    );
  }

  Future<NAFDACValidationResult> _performDetailedValidation(String number) async {
    final errors = <String>[];

    // Validate format components
    final parts = number.split('-');
    if (parts.length != 2) {
      errors.add('NAFDAC number must have prefix and suffix separated by hyphen');
      return NAFDACValidationResult.invalid(errors: errors);
    }

    final prefix = parts[0];
    final suffix = parts[1];

    // Validate prefix (1-2 letters/numbers)
    if (prefix.length < 1 || prefix.length > 2) {
      errors.add('Prefix must be 1-2 characters');
    }

    // Validate suffix (4 digits)
    if (suffix.length != 4 || !RegExp(r'^\d{4}$').hasMatch(suffix)) {
      errors.add('Suffix must be exactly 4 digits');
    }

    if (errors.isNotEmpty) {
      return NAFDACValidationResult.invalid(errors: errors);
    }

    // TODO: Future enhancement - check against EMDEX API or local database
    // For now, return valid if syntax is correct
    return NAFDACValidationResult.valid(
      registrationNumber: number,
      productCategory: _inferCategory(prefix),
    );
  }

  /// Infer product category from prefix (heuristic)
  String? _inferCategory(String prefix) {
    // Common NAFDAC prefixes (indicative only)
    if (prefix.startsWith('A')) return 'Pharmaceuticals';
    if (prefix.startsWith('B')) return 'Food Products';
    if (prefix.startsWith('C')) return 'Cosmetics';
    if (prefix.startsWith('D')) return 'Medical Devices';
    return 'Unknown';
  }

  /// Check if a drug is in the WHO Reserve category
  bool isReserveDrug(String drugName) {
    final reserveDrugs = [
      'colistin',
      'tigecycline',
      'fosfomycin',
      'polymyxin',
      'linezolid',
      'daptomycin',
    ];

    return reserveDrugs.any((drug) => 
      drugName.toLowerCase().contains(drug)
    );
  }

  /// Check if a drug is in the WHO Watch category
  bool isWatchDrug(String drugName) {
    final watchDrugs = [
      'ciprofloxacin',
      'azithromycin',
      'clarithromycin',
      'cephalosporin',
      'fluoroquinolone',
      'macrolide',
    ];

    return watchDrugs.any((drug) => 
      drugName.toLowerCase().contains(drug)
    );
  }

  /// Extract NAFDAC number from OCR text
  String? extractNAFDACNumber(String text) {
    final match = _nafdacRegex.firstMatch(text);
    if (match != null) {
      return match.group(1);
    }

    final alternateMatch = _alternateRegex.firstMatch(text);
    if (alternateMatch != null) {
      return alternateMatch.group(1);
    }

    return null;
  }
}
