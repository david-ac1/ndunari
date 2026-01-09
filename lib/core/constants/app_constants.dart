/// Ndunari App Constants
/// Reference: PRD.md, README.md
class AppConstants {
  // Private constructor to prevent instantiation
  AppConstants._();

  // ========== App Information ==========
  static const String appName = 'Ndunari';
  static const String appTagline = 'AI-Driven Medical Safety for Nigeria';
  static const String appVersion = '1.0.0';

  // ========== WHO AWaRe Classifications ==========
  static const String whoAccess = 'ACCESS';
  static const String whoWatch = 'WATCH';
  static const String whoReserve = 'RESERVE';

  // ========== Risk Levels ==========
  static const String riskLow = 'LOW';
  static const String riskMedium = 'MEDIUM';
  static const String riskHigh = 'HIGH';

  // ========== Supported Languages ==========
  static const List<String> supportedLanguages = [
    'English',
    'Pidgin',
    'Hausa',
    'Igbo',
    'Yoruba',
  ];

  static const Map<String, String> languageCodes = {
    'English': 'en',
    'Pidgin': 'pcm',
    'Hausa': 'ha',
    'Igbo': 'ig',
    'Yoruba': 'yo',
  };

  // ========== Storage Keys ==========
  static const String prefKeyLanguage = 'user_language';
  static const String prefKeyScanHistory = 'scan_history';
  static const String prefKeyAssessmentHistory = 'assessment_history';
  static const String prefKeyFirstLaunch = 'first_launch';

  // ========== API Configuration ==========
  static const String geminiFlashModel = 'gemini-2.0-flash-exp';
  static const String geminiThinkingModel = 'gemini-2.0-flash-thinking-exp-1219';
  static const double geminiTemperature = 1.0;
  static const int geminiMaxOutputTokens = 4096;

  // ========== Storage Limits ==========
  static const int maxScanHistoryItems = 50;
  static const int maxAssessmentHistoryItems = 30;

  // ========== Thresholds ==========
  static const double authenticityScoreThreshold = 95.0;
  static const int minBatchNumberLength = 6;

  // ========== UI Constants ==========
  static const int forensicScanAnimationDurationMs = 2000;
  static const int thinkingIndicatorDelayMs = 500;

  // ========== Error Messages ==========
  static const String errorNoInternet = 'No internet connection. Please check your network.';
  static const String errorCameraPermission = 'Camera permission is required to scan medications.';
  static const String errorLocationPermission = 'Location permission helps detect regional fraud patterns.';
  static const String errorGeminiApi = 'Unable to analyze at this time. Please try again.';
  static const String errorInvalidImage = 'Please provide a clear image of the medication package.';

  // ========== Success Messages ==========
  static const String successScanComplete = 'Scan complete! Review the results below.';
  static const String successAssessmentComplete = 'Assessment complete! See recommendations below.';

  // ========== NAFDAC ==========
  static const String nafdacPrefix = 'NAFDAC';
  static const String nafdacRegex = r'NAFDAC\s*[\dA-Z-]+';
}
