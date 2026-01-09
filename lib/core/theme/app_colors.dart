import 'package:flutter/material.dart';

/// Ndunari Color System
/// Based on Deep Forest Green (#0A4D3C) design system
/// Reference: UI-doc.md
class AppColors {
  // Private constructor to prevent instantiation
  AppColors._();

  // ========== Primary Colors ==========
  /// Deep Forest Green - App bars, primary buttons, branding elements
  static const Color primaryDeepForestGreen = Color(0xFF0A4D3C);
  
  /// Deep Forest Green with opacity variants
  static const Color primaryDeepForestGreen90 = Color(0xE60A4D3C); // 90% opacity
  static const Color primaryDeepForestGreen70 = Color(0xB30A4D3C); // 70% opacity
  static const Color primaryDeepForestGreen50 = Color(0x800A4D3C); // 50% opacity

  // ========== Secondary Colors ==========
  /// Mint Leaf - Card backgrounds, subtle highlights
  static const Color secondaryMintLeaf = Color(0xFFE8F5E9);

  // ========== Success Colors ==========
  /// Access Green - WHO Access drug status, authentic drug verification
  static const Color successAccessGreen = Color(0xFF2E7D32);

  // ========== Warning Colors ==========
  /// Watch Orange - WHO Watch drug status, suspicious batch warnings
  static const Color warningWatchOrange = Color(0xFFEF6C00);

  // ========== Danger Colors ==========
  /// Reserve Red - WHO Reserve drug status, counterfeit alerts
  static const Color dangerReserveRed = Color(0xFFC62828);

  // ========== Neutral Colors ==========
  /// Clinical White - Main background, text on dark buttons
  static const Color neutralClinicalWhite = Color(0xFFFFFFFF);

  /// Slate Gray - Body text, unselected navigation icons
  static const Color neutralSlateGray = Color(0xFF455A64);

  /// Soft Border - Card borders, dividers
  static const Color neutralSoftBorder = Color(0xFFE0E0E0);

  // ========== Overlay Colors ==========
  /// Black overlay for forensic scan screen (70% opacity)
  static const Color forensicOverlay = Color(0xB3000000);

  // ========== WHO AWaRe Indicator Lights ==========
  /// WHO Access category indicator
  static const Color whoAccessIndicator = successAccessGreen;
  
  /// WHO Watch category indicator
  static const Color whoWatchIndicator = warningWatchOrange;
  
  /// WHO Reserve category indicator
  static const Color whoReserveIndicator = dangerReserveRed;

  // ========== Helper Methods ==========
  
  /// Get color for WHO AWaRe classification
  static Color getAWaReColor(String classification) {
    switch (classification.toUpperCase()) {
      case 'ACCESS':
        return whoAccessIndicator;
      case 'WATCH':
        return whoWatchIndicator;
      case 'RESERVE':
        return whoReserveIndicator;
      default:
        return neutralSlateGray;
    }
  }

  /// Get color for risk level
  static Color getRiskLevelColor(String riskLevel) {
    switch (riskLevel.toUpperCase()) {
      case 'LOW':
        return successAccessGreen;
      case 'MEDIUM':
        return warningWatchOrange;
      case 'HIGH':
        return dangerReserveRed;
      default:
        return neutralSlateGray;
    }
  }

  /// Get color for authenticity score
  /// Returns green for high scores, red for low scores
  static Color getAuthenticityScoreColor(double score) {
    if (score >= 95.0) {
      return successAccessGreen;
    } else if (score >= 70.0) {
      return warningWatchOrange;
    } else {
      return dangerReserveRed;
    }
  }
}
