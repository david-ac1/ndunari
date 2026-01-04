import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/forensic_analysis_result.dart';
import '../models/stewardship_assessment.dart';
import '../models/user_preferences.dart';

/// Local storage service using shared_preferences
class LocalStorageService {
  static const String _scanHistoryKey = 'scan_history';
  static const String _assessmentHistoryKey = 'assessment_history';
  static const String _userPreferencesKey = 'user_preferences';
  static const int _maxScanHistory = 50;
  static const int _maxAssessmentHistory = 30;

  /// Save scan history
  Future<void> saveScanHistory(List<ForensicAnalysisResult> scans) async {
    final prefs = await SharedPreferences.getInstance();
    
    // Limit to max history
    final limitedScans = scans.take(_maxScanHistory).toList();
    
    // Convert to JSON
    final jsonList = limitedScans.map((scan) => scan.toJson()).toList();
    final jsonString = json.encode(jsonList);
    
    await prefs.setString(_scanHistoryKey, jsonString);
  }

  /// Load scan history
  Future<List<ForensicAnalysisResult>> loadScanHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_scanHistoryKey);
    
    if (jsonString == null) return [];
    
    try {
      final jsonList = json.decode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => ForensicAnalysisResult.fromJson(json))
          .toList();
    } catch (e) {
      // Corrupted data, return empty list
      return [];
    }
  }

  /// Save assessment history
  Future<void> saveAssessmentHistory(
      List<StewardshipAssessment> assessments) async {
    final prefs = await SharedPreferences.getInstance();
    
    // Limit to max history
    final limitedAssessments =
        assessments.take(_maxAssessmentHistory).toList();
    
    // Convert to JSON
    final jsonList =
        limitedAssessments.map((assessment) => assessment.toJson()).toList();
    final jsonString = json.encode(jsonList);
    
    await prefs.setString(_assessmentHistoryKey, jsonString);
  }

  /// Load assessment history
  Future<List<StewardshipAssessment>> loadAssessmentHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_assessmentHistoryKey);
    
    if (jsonString == null) return [];
    
    try {
      final jsonList = json.decode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => StewardshipAssessment.fromJson(json))
          .toList();
    } catch (e) {
      // Corrupted data, return empty list
      return [];
    }
  }

  /// Save user preferences
  Future<void> saveUserPreferences(UserPreferences preferences) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = json.encode(preferences.toJson());
    await prefs.setString(_userPreferencesKey, jsonString);
  }

  /// Load user preferences
  Future<UserPreferences> loadUserPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_userPreferencesKey);
    
    if (jsonString == null) {
      // Return default preferences for first-time users
      return UserPreferences();
    }
    
    try {
      final json = jsonDecode(jsonString);
      return UserPreferences.fromJson(json);
    } catch (e) {
      // Corrupted data, return defaults
      return UserPreferences();
    }
  }

  /// Clear all scan history
  Future<void> clearScanHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_scanHistoryKey);
  }

  /// Clear all assessment history
  Future<void> clearAssessmentHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_assessmentHistoryKey);
  }

  /// Clear all history (scans + assessments)
  Future<void> clearAllHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_scanHistoryKey);
    await prefs.remove(_assessmentHistoryKey);
  }

  /// Clear all data including preferences
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
