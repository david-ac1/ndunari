import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../utils/app_constants.dart';

/// Centralized permission management
class PermissionHandler {
  /// Request camera permission
  static Future<bool> requestCameraPermission(BuildContext context) async {
    final status = await Permission.camera.request();

    if (status.isGranted) {
      return true;
    } else if (status.isDenied) {
      _showPermissionDialog(
        context,
        'Camera Permission Required',
        AppConstants.cameraPermissionError,
        Permission.camera,
      );
      return false;
    } else if (status.isPermanentlyDenied) {
      _showSettingsDialog(
        context,
        'Camera Permission Required',
        'Camera permission was permanently denied. Please enable it in app settings.',
      );
      return false;
    }

    return false;
  }

  /// Request location permission
  static Future<bool> requestLocationPermission(BuildContext context) async {
    final status = await Permission.location.request();

    if (status.isGranted) {
      return true;
    } else if (status.isDenied) {
      _showPermissionDialog(
        context,
        'Location Permission',
        AppConstants.locationPermissionError,
        Permission.location,
      );
      return false;
    } else if (status.isPermanentlyDenied) {
      _showSettingsDialog(
        context,
        'Location Permission',
        'Location permission was permanently denied. Please enable it in app settings.',
      );
      return false;
    }

    return false;
  }

  /// Check if camera permission is granted
  static Future<bool> hasCameraPermission() async {
    return await Permission.camera.isGranted;
  }

  /// Check if location permission is granted
  static Future<bool> hasLocationPermission() async {
    return await Permission.location.isGranted;
  }

  /// Show permission explanation dialog
  static void _showPermissionDialog(
    BuildContext context,
    String title,
    String message,
    Permission permission,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              permission.request();
            },
            child: const Text('Grant Permission'),
          ),
        ],
      ),
    );
  }

  /// Show settings dialog for permanently denied permissions
  static void _showSettingsDialog(
    BuildContext context,
    String title,
    String message,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }
}
