import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Ndunari Typography System
/// Uses Inter (primary) and Manrope (for Narị agent dialogue)
/// Reference: UI-doc.md
class AppTypography {
  // Private constructor to prevent instantiation
  AppTypography._();

  // ========== Font Families ==========
  
  /// Primary font family - Inter (Google Fonts)
  static String get primaryFontFamily => GoogleFonts.inter().fontFamily!;
  
  /// Secondary font family - Manrope (for "Narị" agent dialogue)
  static String get secondaryFontFamily => GoogleFonts.manrope().fontFamily!;

  // ========== Type Scale ==========

  /// H1: 24px, weight 700 (Bold), tracking -0.02em
  /// Usage: Main page titles (e.g., "Home")
  static TextStyle h1 = GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.02 * 24, // -0.02em
    height: 1.2,
  );

  /// H2: 20px, weight 600 (Semi-Bold), tracking 0
  /// Usage: Section headers (e.g., "Verify Medicine")
  static TextStyle h2 = GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.3,
  );

  /// Body Large: 16px, weight 500 (Medium), tracking 0
  /// Usage: Action card labels, button text
  static TextStyle bodyLarge = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.5,
  );

  /// Body Regular: 14px, weight 400 (Regular), tracking 0
  /// Usage: Description text, drug details
  static TextStyle bodyRegular = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.5,
  );

  /// Caption: 12px, weight 400 (Regular), tracking +0.05em
  /// Usage: NAFDAC registration numbers, metadata
  static TextStyle caption = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.05 * 12, // +0.05em
    height: 1.4,
  );

  // ========== Agent Dialogue Typography ==========

  /// Narị Agent Response: Uses Manrope for agent dialogue
  /// 14px, weight 400 (Regular)
  static TextStyle agentDialogue = GoogleFonts.manrope(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.6,
  );

  /// Narị Agent Title: Uses Manrope for agent name
  /// 16px, weight 600 (Semi-Bold)
  static TextStyle agentTitle = GoogleFonts.manrope(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.4,
  );

  // ========== Specialized Typography ==========

  /// Forensic Scan "Thinking" Indicator
  /// 12px Inter, Italic, per UI-doc.md
  static TextStyle forensicThinking = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic,
    letterSpacing: 0,
    height: 1.4,
  );

  /// Button Text: 16px, weight 500 (Medium)
  static TextStyle button = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.02 * 16,
    height: 1.2,
  );

  /// Small Button Text: 14px, weight 500 (Medium)
  static TextStyle buttonSmall = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.02 * 14,
    height: 1.2,
  );

  // ========== Helper Methods ==========

  /// Apply color to any text style
  static TextStyle withColor(TextStyle style, Color color) {
    return style.copyWith(color: color);
  }

  /// Create a themed TextTheme for MaterialApp
  static TextTheme createTextTheme() {
    return TextTheme(
      displayLarge: h1,
      displayMedium: h2,
      bodyLarge: bodyLarge,
      bodyMedium: bodyRegular,
      bodySmall: caption,
      titleMedium: bodyLarge,
      labelLarge: button,
    );
  }

  // ========== Accessibility Compliance ==========
  
  /// Minimum font weight for medical instructions (WCAG 2.1 AA)
  /// Per UI-doc.md: Never use font weights below 400 (Regular)
  static const FontWeight minimumMedicalWeight = FontWeight.w400;
}
