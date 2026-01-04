import 'dart:async';
import '../models/nafdac_validation_result.dart';

/// NAFDAC Registry Service for batch number validation
/// 
/// This is a MOCK implementation that simulates NAFDAC API responses.
/// In production, this should connect to the real NAFDAC registry API.
class NAFDACRegistryService {
  // Mock database of valid batch numbers
  static final Map<String, Map<String, dynamic>> _mockRegistry = {
    'NAF-2026-001234': {
      'drug_name': 'Paracetamol 500mg',
      'manufacturer': 'Emzor Pharmaceutical Industries',
      'expiry_date': '2027-12-31',
      'registration_status': 'VERIFIED',
    },
    'NAF-2025-005678': {
      'drug_name': 'Amoxicillin 250mg',
      'manufacturer': 'GlaxoSmithKline Nigeria',
      'expiry_date': '2026-08-15',
      'registration_status': 'VERIFIED',
    },
    'NAF-2024-009012': {
      'drug_name': 'Ciprofloxacin 500mg',
      'manufacturer': 'Fidson Healthcare',
      'expiry_date': '2025-03-20',
      'registration_status': 'EXPIRED',
    },
    'NAF-2026-111111': {
      'drug_name': 'Azithromycin 500mg (Reserve)',
      'manufacturer': 'May & Baker Nigeria',
      'expiry_date': '2028-01-10',
      'registration_status': 'VERIFIED',
    },
  };

  /// Validate a NAFDAC batch number
  /// 
  /// Returns validation result with drug details if found.
  /// In production, this would make an API call to NAFDAC registry.
  Future<NAFDACValidationResult> validateBatchNumber(
    String? batchNumber,
  ) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));

    if (batchNumber == null || batchNumber.isEmpty) {
      return NAFDACValidationResult(
        isValid: false,
        registrationStatus: 'UNKNOWN',
      );
    }

    // Validate format: NAF-YYYY-XXXXXX
    final nafdacPattern = RegExp(r'^NAF-\d{4}-\d{6}$');
    if (!nafdacPattern.hasMatch(batchNumber)) {
      return NAFDACValidationResult(
        isValid: false,
        registrationStatus: 'INVALID',
        registrationNumber: batchNumber,
      );
    }

    // Check mock registry
    if (_mockRegistry.containsKey(batchNumber)) {
      final data = _mockRegistry[batchNumber]!;
      final expiryDate = DateTime.parse(data['expiry_date']);
      final isExpired = expiryDate.isBefore(DateTime.now());
      final status = isExpired ? 'EXPIRED' : data['registration_status'];

      return NAFDACValidationResult(
        isValid: status == 'VERIFIED',
        drugName: data['drug_name'],
        manufacturer: data['manufacturer'],
        expiryDate: expiryDate,
        registrationStatus: status,
        registrationNumber: batchNumber,
      );
    }

    // Not found in registry
    return NAFDACValidationResult(
      isValid: false,
      registrationStatus: 'INVALID',
      registrationNumber: batchNumber,
    );
  }

  /// Check if a drug is a Reserve class antibiotic
  /// Used for tiered logic - triggers Gemini Pro analysis
  bool isReserveDrug(String? drugName) {
    if (drugName == null) return false;

    final reserveDrugs = [
      'azithromycin',
      'meropenem',
      'colistin',
      'tigecycline',
      'linezolid',
      'daptomycin',
    ];

    return reserveDrugs.any(
      (reserve) => drugName.toLowerCase().contains(reserve),
    );
  }

  /// Check if a drug is a Watch class antibiotic
  bool isWatchDrug(String? drugName) {
    if (drugName == null) return false;

    final watchDrugs = [
      'ciprofloxacin',
      'levofloxacin',
      'ceftriaxone',
      'cefotaxime',
      'vancomycin',
      'clarithromycin',
    ];

    return watchDrugs.any(
      (watch) => drugName.toLowerCase().contains(watch),
    );
  }

  /// Get drug classification (ACCESS, WATCH, RESERVE)
  String getDrugClass(String? drugName) {
    if (drugName == null) return 'UNKNOWN';

    if (isReserveDrug(drugName)) return 'RESERVE';
    if (isWatchDrug(drugName)) return 'WATCH';
    return 'ACCESS';
  }

  // TODO: Future implementation
  // Future<NAFDACValidationResult> validateBatchNumberAPI(String batchNumber) async {
  //   final response = await http.get(
  //     Uri.parse('https://nafdac.gov.ng/api/v1/verify/$batchNumber'),
  //   );
  //   return NAFDACValidationResult.fromJson(jsonDecode(response.body));
  // }
}
