import 'package:flutter/material.dart';
import '../models/user_preferences.dart';
import '../services/local_storage_service.dart';

/// Provider for managing user preferences and settings
class UserProvider extends ChangeNotifier {
  final LocalStorageService _storage = LocalStorageService();
  UserPreferences _preferences = UserPreferences();

  UserPreferences get preferences => _preferences;
  String get preferredLanguage => _preferences.preferredLanguage;
  bool get notificationsEnabled => _preferences.notificationsEnabled;
  bool get isFirstTime => _preferences.isFirstTime;

  UserProvider() {
    _loadPreferences();
  }

  /// Load preferences from local storage
  Future<void> _loadPreferences() async {
    _preferences = await _storage.loadUserPreferences();
    notifyListeners();
  }

  /// Update preferred language
  Future<void> setPreferredLanguage(String language) async {
    _preferences = _preferences.copyWith(preferredLanguage: language);
    await _storage.saveUserPreferences(_preferences);
    notifyListeners();
  }

  /// Toggle notifications
  Future<void> setNotificationsEnabled(bool enabled) async {
    _preferences = _preferences.copyWith(notificationsEnabled: enabled);
    await _storage.saveUserPreferences(_preferences);
    notifyListeners();
  }

  /// Mark first-time user flow as complete
  Future<void> completeFirstTimeSetup() async {
    _preferences = _preferences.copyWith(
      isFirstTime: false,
      lastUsed: DateTime.now(),
    );
    await _storage.saveUserPreferences(_preferences);
    notifyListeners();
  }

  /// Update location permission status
  Future<void> setLocationPermissionGranted(bool granted) async {
    _preferences = _preferences.copyWith(locationPermissionGranted: granted);
    await _storage.saveUserPreferences(_preferences);
    notifyListeners();
  }

  /// Update last used timestamp
  Future<void> updateLastUsed() async {
    _preferences = _preferences.copyWith(lastUsed: DateTime.now());
    await _storage.saveUserPreferences(_preferences);
    // Don't notify listeners for this minor update
  }
}
