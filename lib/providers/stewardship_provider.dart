import 'package:flutter/material.dart';
import '../models/stewardship_assessment.dart';
import '../services/stewardship_brain_service.dart';
import '../services/local_storage_service.dart';

/// Provider for managing stewardship assessments
class StewardshipProvider extends ChangeNotifier {
  final StewardshipBrainService _stewardshipService = StewardshipBrainService();
  final LocalStorageService _storage = LocalStorageService();

  bool _isLoading = false;
  StewardshipAssessment? _currentAssessment;
  String? _error;
  final List<StewardshipAssessment> _assessmentHistory = [];
  bool _historyLoaded = false;

  bool get isLoading => _isLoading;
  StewardshipAssessment? get currentAssessment => _currentAssessment;
  String? get error => _error;
  List<StewardshipAssessment> get assessmentHistory =>
      List.unmodifiable(_assessmentHistory);

  StewardshipProvider() {
    _loadHistory();
  }

  /// Load assessment history from local storage
  Future<void> _loadHistory() async {
    if (_historyLoaded) return;
    
    final history = await _storage.loadAssessmentHistory();
    _assessmentHistory.clear();
    _assessmentHistory.addAll(history);
    _historyLoaded = true;
    notifyListeners();
  }

  /// Save history to local storage
  Future<void> _saveHistory() async {
    await _storage.saveAssessmentHistory(_assessmentHistory);
  }

  /// Assess prescription for antibiotic stewardship
  Future<void> assessPrescription(
    String prescriptionText,
    String location,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final assessment = await _stewardshipService.assessStewardship(
        prescriptionText,
        location,
      );

      _currentAssessment = assessment;
      _assessmentHistory.insert(0, assessment);

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

  /// Clear current assessment
  void clearAssessment() {
    _currentAssessment = null;
    _error = null;
    notifyListeners();
  }

  /// Clear assessment history
  Future<void> clearHistory() async {
    _assessmentHistory.clear();
    await _storage.clearAssessmentHistory();
    notifyListeners();
  }
}
