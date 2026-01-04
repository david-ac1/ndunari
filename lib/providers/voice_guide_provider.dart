import 'package:flutter/material.dart';
import '../services/voice_guide_service.dart';

/// Provider for managing voice guide state
class VoiceGuideProvider extends ChangeNotifier {
  final VoiceGuideService _voiceService = VoiceGuideService();
  bool _isPlaying = false;
  String _currentLanguage = 'english';

  bool get isPlaying => _isPlaying;
  String get currentLanguage => _currentLanguage;

  /// Speak text in current language
  Future<void> speak(String text, {String? languageOverride}) async {
    final language = languageOverride ?? _currentLanguage;
    
    _isPlaying = true;
    notifyListeners();

    await _voiceService.speak(text, language);

    // Wait a bit then update (speech completion is async)
    await Future.delayed(const Duration(milliseconds: 500));
    _isPlaying = _voiceService.isSpeaking;
    notifyListeners();
  }

  /// Stop current playback
  Future<void> stop() async {
    await _voiceService.stop();
    _isPlaying = false;
    notifyListeners();
  }

  /// Set language for future playback
  void setLanguage(String language) {
    _currentLanguage = language;
    notifyListeners();
  }

  @override
  void dispose() {
    _voiceService.dispose();
    super.dispose();
  }
}
