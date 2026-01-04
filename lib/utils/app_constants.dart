/// Application-wide constants
class AppConstants {
  // App Information
  static const String appName = 'Ndunari';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'AI-Driven Medical Safety for Nigeria';

  // API Configuration
  static const int apiTimeoutSeconds = 30;
  static const int maxRetries = 3;

  // History Limits
  static const int maxScanHistory = 50;
  static const int maxAssessmentHistory = 30;

  // Supported Languages
  static const List<String> supportedLanguages = [
    'english',
    'pidgin',
    'hausa',
    'igbo',
    'yoruba',
  ];

  static const Map<String, String> languageNames = {
    'english': 'English',
    'pidgin': 'Nigerian Pidgin',
    'hausa': 'Hausa',
    'igbo': 'Igbo',
    'yoruba': 'Yoruba',
  };

  // WHO AWaRe Classification
  static const List<String> accessDrugs = [
    'amoxicillin',
    'ampicillin',
    'doxycycline',
    'metronidazole',
  ];

  static const List<String> watchDrugs = [
    'ciprofloxacin',
    'levofloxacin',
    'ceftriaxone',
    'cefotaxime',
    'vancomycin',
  ];

  static const List<String> reserveDrugs = [
    'azithromycin',
    'meropenem',
    'colistin',
    'tigecycline',
    'linezolid',
  ];

  // NAFDAC Batch Number Pattern
  static const String nafdacBatchPattern = r'^NAF-\d{4}-\d{6}$';

  // Error Messages
  static const String noInternetError =
      'No internet connection. Please check your network and try again.';
  static const String apiKeyError =
      'API configuration error. Please ensure your API key is set correctly.';
  static const String apiTimeoutError =
      'Request timed out. Please try again.';
  static const String unknownError =
      'An unexpected error occurred. Please try again later.';
  static const String cameraPermissionError =
      'Camera permission is required to scan drug packages.';
  static const String locationPermissionError =
      'Location permission helps provide regional drug resistance information.';
  static const String invalidImageError =
      'Unable to process image. Please try a different photo.';
  static const String nafdacValidationError =
      'Unable to verify NAFDAC registration. Please check batch number.';

  // Success Messages
  static const String scanSuccessMessage =
      'Drug package scanned successfully!';
  static const String assessmentSuccessMessage =
      'Prescription assessed successfully!';
  static const String historyClearedMessage =
      'History cleared successfully.';
  static const String preferencesSavedMessage =
      'Preferences saved successfully.';
}
