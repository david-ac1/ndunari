import 'package:flutter/material.dart';

/// Color palette for Ndunari medical safety app
class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFF00A86B); // Medical green
  static const Color primaryLight = Color(0xFF4DD294);
  static const Color primaryDark = Color(0xFF007849);
  
  // Secondary Colors
  static const Color secondary = Color(0xFF0078D4); // Trust blue
  static const Color secondaryLight = Color(0xFF40A0FF);
  static const Color secondaryDark = Color(0xFF005A9E);
  
  // Alert Colors
  static const Color error = Color(0xFFD32F2F); // Counterfeit warning red
  static const Color warning = Color(0xFFFFA726); // Caution yellow
  static const Color success = Color(0xFF66BB6A); // Success green
  static const Color info = Color(0xFF29B6F6); // Information blue
  
  // Neutral Colors
  static const Color background = Color(0xFFFFFFFF); // Clean white
  static const Color surface = Color(0xFFF5F5F5); // Light gray
  static const Color surfaceDark = Color(0xFFE0E0E0);
  
  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  
  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [secondary, secondaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient dangerGradient = LinearGradient(
    colors: [error, Color(0xFFE57373)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
