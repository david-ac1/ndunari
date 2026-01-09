import 'package:flutter/material.dart';

/// Ndunari Spacing & Layout Constants
/// Based on 4dp baseline grid
/// Reference: UI-doc.md
class AppSpacing {
  // Private constructor to prevent instantiation
  AppSpacing._();

  // ========== Baseline Grid ==========
  /// 4dp baseline grid unit
  static const double baseUnit = 4.0;

  // ========== Page-Level Spacing ==========
  
  /// Page margins: 20px left/right (mobile-first gutters)
  static const double pageMarginHorizontal = 20.0;
  
  /// Page margins: Top/bottom
  static const double pageMarginVertical = 20.0;
  
  /// Page margins as EdgeInsets
  static const EdgeInsets pageMargins = EdgeInsets.symmetric(
    horizontal: pageMarginHorizontal,
    vertical: pageMarginVertical,
  );

  // ========== Card Spacing ==========
  
  /// Card padding: 16px internal padding for all interactive cards
  static const double cardPadding = 16.0;
  
  /// Card padding as EdgeInsets
  static const EdgeInsets cardPaddingAll = EdgeInsets.all(cardPadding);

  // ========== Vertical Spacing ==========
  
  /// 24px between major sections
  static const double sectionSpacing = 24.0;
  
  /// 12px between related elements
  static const double elementSpacing = 12.0;
  
  /// 8px for tight spacing
  static const double tightSpacing = 8.0;
  
  /// 4px for minimal spacing
  static const double minimalSpacing = 4.0;

  // ========== Horizontal Spacing ==========
  
  /// 12px between adjacent icons or buttons
  static const double iconButtonSpacing = 12.0;

  // ========== Border Radius ==========
  
  /// 12px for primary cards and containers
  static const double radiusCard = 12.0;
  
  /// 8px for buttons and small input fields
  static const double radiusButton = 8.0;
  
  /// 4px for minimal rounding
  static const double radiusSmall = 4.0;
  
  /// Card border radius
  static const BorderRadius cardBorderRadius = BorderRadius.all(
    Radius.circular(radiusCard),
  );
  
  /// Button border radius
  static const BorderRadius buttonBorderRadius = BorderRadius.all(
    Radius.circular(radiusButton),
  );

  // ========== Component-Specific Spacing ==========
  
  /// Bottom navigation bar height
  static const double bottomNavHeight = 56.0;
  
  /// App bar height (default Material height)
  static const double appBarHeight = kToolbarHeight;
  
  /// Floating action button size
  static const double fabSize = 56.0;

  // ========== Touch Targets (WCAG 2.1 AA) ==========
  
  /// Minimum touch target size: 48×48px per UI-doc.md
  static const double minTouchTarget = 48.0;
  
  /// Minimum touch target as Size
  static const Size minTouchTargetSize = Size(minTouchTarget, minTouchTarget);

  // ========== Card Elevation & Shadows ==========
  
  /// Level 1 soft shadow (per UI-doc.md Stewardship Dashboard)
  /// blurRadius: 4, offset: (0, 2)
  static const List<BoxShadow> cardShadowLevel1 = [
    BoxShadow(
      color: Color(0x14000000), // ~8% opacity black
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];
  
  /// Level 2 medium shadow
  static const List<BoxShadow> cardShadowLevel2 = [
    BoxShadow(
      color: Color(0x1F000000), // ~12% opacity black
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  // ========== Forensic Scan View Specifications ==========
  
  /// Forensic overlay opacity: 70% per UI-doc.md
  static const double forensicOverlayOpacity = 0.70;
  
  /// Forensic focus border width: 3px animated border
  static const double forensicBorderWidth = 3.0;

  // ========== Indicator Specifications ==========
  
  /// WHO AWaRe indicator light size: 12px circular glyphs
  static const double indicatorSize = 12.0;

  // ========== Helper Methods ==========
  
  /// Get spacing based on multiplier of base unit
  static double spacing(double multiplier) => baseUnit * multiplier;
  
  /// Get vertical spacing SizedBox
  static Widget verticalSpace(double height) => SizedBox(height: height);
  
  /// Get horizontal spacing SizedBox
  static Widget horizontalSpace(double width) => SizedBox(width: width);
  
  /// Get section spacing SizedBox
  static Widget get sectionSpacer => SizedBox(height: sectionSpacing);
  
  /// Get element spacing SizedBox
  static Widget get elementSpacer => SizedBox(height: elementSpacing);
}
