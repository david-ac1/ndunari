import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Service to monitor network connectivity
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  /// Check if device is currently online
  Future<bool> isOnline() async {
    final connectivityResult = await _connectivity.checkConnectivity();
    return !connectivityResult.contains(ConnectivityResult.none);
  }

  /// Stream of connectivity changes
  Stream<bool> get connectivityStream {
    return _connectivity.onConnectivityChanged.map((results) {
      return !results.contains(ConnectivityResult.none);
    });
  }

  /// Start listening to connectivity changes
  void startMonitoring(Function(bool) onConnectivityChanged) {
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (results) {
        final isConnected = !results.contains(ConnectivityResult.none);
        onConnectivityChanged(isConnected);
      },
    );
  }

  /// Stop listening to connectivity changes
  void stopMonitoring() {
    _connectivitySubscription?.cancel();
    _connectivitySubscription = null;
  }

  /// Dispose resources
  void dispose() {
    stopMonitoring();
  }
}
