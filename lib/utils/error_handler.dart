import 'dart:io';
import '../utils/app_constants.dart';

/// Error handler for converting technical errors to user-friendly messages
class ErrorHandler {
  /// Convert any error to a user-friendly message
  static String getUserFriendlyMessage(dynamic error) {
    final errorString = error.toString().toLowerCase();

    // Network errors
    if (error is SocketException || errorString.contains('socketexception')) {
      return AppConstants.noInternetError;
    }

    // Timeout errors
    if (errorString.contains('timeout') || 
        errorString.contains('timed out')) {
      return AppConstants.apiTimeoutError;
    }

    // API Key errors
    if (errorString.contains('api_key') || 
        errorString.contains('apikey') ||
        errorString.contains('unauthorized') ||
        errorString.contains('401')) {
      return AppConstants.apiKeyError;
    }

    // Permission errors
    if (errorString.contains('camera') && errorString.contains('permission')) {
      return AppConstants.cameraPermissionError;
    }

    if (errorString.contains('location') && errorString.contains('permission')) {
      return AppConstants.locationPermissionError;
    }

    // Image processing errors
    if (errorString.contains('image') || 
        errorString.contains('invalid format')) {
      return AppConstants.invalidImageError;
    }

    // NAFDAC errors
    if (errorString.contains('nafdac') || 
        errorString.contains('batch')) {
      return AppConstants.nafdacValidationError;
    }

    // HTTP errors
    if (errorString.contains('404')) {
      return 'Resource not found. Please try again.';
    }

    if (errorString.contains('500') || errorString.contains('502') || 
        errorString.contains('503')) {
      return 'Server error. Please try again later.';
    }

    // Generic error with details if available
    if (errorString.isNotEmpty && errorString.length < 100) {
      return 'Error: ${errorString.split('\n').first}';
    }

    // Fallback
    return AppConstants.unknownError;
  }

  /// Check if error is network-related
  static bool isNetworkError(dynamic error) {
    return error is SocketException ||
        error.toString().toLowerCase().contains('socketexception') ||
        error.toString().toLowerCase().contains('network');
  }

  /// Check if error is API key related
  static bool isApiKeyError(dynamic error) {
    final errorString = error.toString().toLowerCase();
    return errorString.contains('api_key') ||
        errorString.contains('unauthorized') ||
        errorString.contains('401');
  }

  /// Log error (for debugging)
  static void logError(String context, dynamic error, [StackTrace? stackTrace]) {
    print('=== ERROR in $context ===');
    print('Error: $error');
    if (stackTrace != null) {
      print('Stack trace: $stackTrace');
    }
    print('========================');
  }
}
