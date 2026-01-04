import 'package:flutter/material.dart';
import '../services/connectivity_service.dart';

/// Provider for managing connectivity state
class ConnectivityProvider extends ChangeNotifier {
  final ConnectivityService _connectivityService = ConnectivityService();
  bool _isOnline = true;

  bool get isOnline => _isOnline;

  ConnectivityProvider() {
    _initialize();
  }

  Future<void> _initialize() async {
    // Check initial connectivity
    _isOnline = await _connectivityService.isOnline();
    notifyListeners();

    // Start monitoring connectivity changes
    _connectivityService.startMonitoring((isConnected) {
      if (_isOnline != isConnected) {
        _isOnline = isConnected;
        notifyListeners();
      }
    });
  }

  @override
  void dispose() {
    _connectivityService.dispose();
    super.dispose();
  }
}
