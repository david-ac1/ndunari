import 'package:flutter/material.dart';
import 'dart:typed_data';
import '../models/forensic_analysis_result.dart';
import '../services/forensic_eye_service.dart';

/// Provider for managing scan results and API state
class ScanResultProvider extends ChangeNotifier {
  final ForensicEyeService _forensicService = ForensicEyeService();

  bool _isLoading = false;
  ForensicAnalysisResult? _currentResult;
  String? _error;
  final List<ForensicAnalysisResult> _scanHistory = [];

  bool get isLoading => _isLoading;
  ForensicAnalysisResult? get currentResult => _currentResult;
  String? get error => _error;
  List<ForensicAnalysisResult> get scanHistory => List.unmodifiable(_scanHistory);

  /// Scan image for drug authenticity
  Future<void> scanImage(Uint8List imageBytes, String location) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Call Gemini Flash API
      final result = await _forensicService.scanBatch(imageBytes, location);

      // Verify with NAFDAC registry
      if (result.batchNumber != null) {
        final nafdacVerified =
            await _forensicService.verifyNAFDAC(result.batchNumber);
        _currentResult = ForensicAnalysisResult(
          authenticityScore: result.authenticityScore,
          isAuthentic: result.isAuthentic,
          findings: result.findings,
          batchNumber: result.batchNumber,
          nafdacVerified: nafdacVerified,
          location: result.location,
          scannedAt: result.scannedAt,
          thoughtSignature: result.thoughtSignature,
        );
      } else {
        _currentResult = result;
      }

      // Add to history
      _scanHistory.insert(0, _currentResult!);

      // TODO: Persist to local storage with shared_preferences

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear current result
  void clearResult() {
    _currentResult = null;
    _error = null;
    notifyListeners();
  }

  /// Clear all scan history
  void clearHistory() {
    _scanHistory.clear();
    notifyListeners();
  }
}
