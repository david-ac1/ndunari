import 'package:flutter/material.dart';
import 'dart:typed_data';
import '../models/forensic_analysis_result.dart';
import '../services/forensic_eye_service.dart';
import '../services/nafdac_registry_service.dart';
import '../services/local_storage_service.dart';

/// Provider for managing scan results and API state
class ScanResultProvider extends ChangeNotifier {
  final ForensicEyeService _forensicService = ForensicEyeService();
  final NAFDACRegistryService _nafdacService = NAFDACRegistryService();
  final LocalStorageService _storage = LocalStorageService();

  bool _isLoading = false;
  ForensicAnalysisResult? _currentResult;
  String? _error;
  final List<ForensicAnalysisResult> _scanHistory = [];
  bool _historyLoaded = false;

  bool get isLoading => _isLoading;
  ForensicAnalysisResult? get currentResult => _currentResult;
  String? get error => _error;
  List<ForensicAnalysisResult> get scanHistory => List.unmodifiable(_scanHistory);

  ScanResultProvider() {
    _loadHistory();
  }

  /// Load scan history from local storage
  Future<void> _loadHistory() async {
    if (_historyLoaded) return;
    
    final history = await _storage.loadScanHistory();
    _scanHistory.clear();
    _scanHistory.addAll(history);
    _historyLoaded = true;
    notifyListeners();
  }

  /// Save history to local storage
  Future<void> _saveHistory() async {
    await _storage.saveScanHistory(_scanHistory);
  }

  /// Scan image for drug authenticity
  Future<void> scanImage(Uint8List imageBytes, String location) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Call Gemini Flash API
      final result = await _forensicService.scanBatch(imageBytes, location);

      // Verify with NAFDAC registry using proper service
      if (result.batchNumber != null) {
        final nafdacResult =
            await _nafdacService.validateBatchNumber(result.batchNumber);
        
        // Add NAFDAC findings to result
        final updatedFindings = List<String>.from(result.findings);
        if (nafdacResult.isValid) {
          updatedFindings.add(
            'NAFDAC verified: ${nafdacResult.drugName} by ${nafdacResult.manufacturer}'
          );
        } else {
          updatedFindings.add(
            'NAFDAC validation: ${nafdacResult.registrationStatus}'
          );
        }
        
        _currentResult = ForensicAnalysisResult(
          authenticityScore: result.authenticityScore,
          isAuthentic: result.isAuthentic && nafdacResult.isValid,
          findings: updatedFindings,
          batchNumber: result.batchNumber,
          nafdacVerified: nafdacResult.isValid,
          location: result.location,
          scannedAt: result.scannedAt,
          thoughtSignature: result.thoughtSignature,
        );
      } else {
        _currentResult = result;
      }

      // Add to history
      _scanHistory.insert(0, _currentResult!);

      // Persist to local storage
      await _saveHistory();

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
  Future<void> clearHistory() async {
    _scanHistory.clear();
    await _storage.clearScanHistory();
    notifyListeners();
  }
}
