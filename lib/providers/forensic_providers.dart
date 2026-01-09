import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/forensic_analysis_result.dart';
import '../services/forensic_eye_service.dart';
import '../services/nafdac_registry_service.dart';

/// NAFDAC Registry Service Provider
final nafdacServiceProvider = Provider<NAFDACRegistryService>((ref) {
  return NAFDACRegistryService();
});

/// Forensic Eye Service Provider
final forensicEyeServiceProvider = Provider<ForensicEyeService>((ref) {
  final apiKey = dotenv.env['GEMINI_API_KEY'];
  if (apiKey == null || apiKey.isEmpty) {
    throw Exception('GEMINI_API_KEY not found in .env file');
  }
  
  final nafdacService = ref.watch(nafdacServiceProvider);
  return ForensicEyeService(
    apiKey: apiKey,
    nafdacService: nafdacService,
  );
});

/// Current Scan Result State
final currentScanProvider = StateProvider<ForensicAnalysisResult?>((ref) => null);

/// Scan History Notifier
class ScanHistoryNotifier extends StateNotifier<List<ForensicAnalysisResult>> {
  ScanHistoryNotifier() : super([]);

  void addScan(ForensicAnalysisResult result) {
    state = [result, ...state];
    // Keep only last 50 scans
    if (state.length > 50) {
      state = state.sublist(0, 50);
    }
  }

  void clearHistory() {
    state = [];
  }

  ForensicAnalysisResult? getByImageHash(String hash) {
    try {
      return state.firstWhere((scan) => scan.imageHash == hash);
    } catch (e) {
      return null;
    }
  }
}

/// Scan History Provider
final scanHistoryProvider = StateNotifierProvider<ScanHistoryNotifier, List<ForensicAnalysisResult>>((ref) {
  return ScanHistoryNotifier();
});

/// Scan Loading State
final scanLoadingProvider = StateProvider<bool>((ref) => false);

/// Scan Error State
final scanErrorProvider = StateProvider<String?>((ref) => null);
