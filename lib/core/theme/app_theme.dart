import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';
import 'app_spacing.dart';

/// Ndunari Global Theme Configuration
/// Combines colors, typography, and component themes
/// Based on Deep Forest Green (#0A4D3C) design system
/// Reference: UI-doc.md
class AppTheme {
  // Private constructor to prevent instantiation
  AppTheme._();

  /// Light theme configuration
  static ThemeData get lightTheme {
    return ThemeData(
      // ========== Material 3 ==========
      useMaterial3: true,

      // ========== Color Scheme ==========
      colorScheme: ColorScheme.light(
        primary: AppColors.primaryDeepForestGreen,
        onPrimary: AppColors.neutralClinicalWhite,
        secondary: AppColors.secondaryMintLeaf,
        onSecondary: AppColors.neutralSlateGray,
        error: AppColors.dangerReserveRed,
        onError: AppColors.neutralClinicalWhite,
        surface: AppColors.neutralClinicalWhite,
        onSurface: AppColors.neutralSlateGray,
        outline: AppColors.neutralSoftBorder,
      ),

      // ========== Scaffold ==========
      scaffoldBackgroundColor: AppColors.neutralClinicalWhite,

      // ========== App Bar ==========
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primaryDeepForestGreen,
        foregroundColor: AppColors.neutralClinicalWhite,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTypography.withColor(
          AppTypography.h2,
          AppColors.neutralClinicalWhite,
        ),
        iconTheme: const IconThemeData(
          color: AppColors.neutralClinicalWhite,
          size: 24,
        ),
      ),

      // ========== Typography ==========
      textTheme: AppTypography.createTextTheme(),

      // ========== Card ==========
      cardTheme: CardTheme(
        color: AppColors.neutralClinicalWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.cardBorderRadius,
          side: const BorderSide(
            color: AppColors.neutralSoftBorder,
            width: 1,
          ),
        ),
        margin: const EdgeInsets.all(AppSpacing.elementSpacing),
      ),

      // ========== Elevated Button ==========
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryDeepForestGreen,
          foregroundColor: AppColors.neutralClinicalWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.cardPadding,
            vertical: AppSpacing.elementSpacing,
          ),
          minimumSize: AppSpacing.minTouchTargetSize,
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.buttonBorderRadius,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      // ========== Outlined Button ==========
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryDeepForestGreen,
          side: const BorderSide(
            color: AppColors.primaryDeepForestGreen,
            width: 1.5,
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.cardPadding,
            vertical: AppSpacing.elementSpacing,
          ),
          minimumSize: AppSpacing.minTouchTargetSize,
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.buttonBorderRadius,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      // ========== Text Button ==========
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryDeepForestGreen,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.cardPadding,
            vertical: AppSpacing.elementSpacing,
          ),
          minimumSize: AppSpacing.minTouchTargetSize,
          textStyle: AppTypography.buttonSmall,
        ),
      ),

      // ========== Input Decoration ==========
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.neutralClinicalWhite,
        border: OutlineInputBorder(
          borderRadius: AppSpacing.buttonBorderRadius,
          borderSide: const BorderSide(
            color: AppColors.neutralSoftBorder,
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.buttonBorderRadius,
          borderSide: const BorderSide(
            color: AppColors.neutralSoftBorder,
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.buttonBorderRadius,
          borderSide: const BorderSide(
            color: AppColors.primaryDeepForestGreen,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppSpacing.buttonBorderRadius,
          borderSide: const BorderSide(
            color: AppColors.dangerReserveRed,
            width: 1,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppSpacing.buttonBorderRadius,
          borderSide: const BorderSide(
            color: AppColors.dangerReserveRed,
            width: 2,
          ),
        ),
        contentPadding: const EdgeInsets.all(AppSpacing.cardPadding),
        hintStyle: AppTypography.withColor(
          AppTypography.bodyRegular,
          AppColors.neutralSlateGray.withOpacity(0.6),
        ),
        labelStyle: AppTypography.withColor(
          AppTypography.bodyRegular,
          AppColors.neutralSlateGray,
        ),
      ),

      // ========== Bottom Navigation Bar ==========
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.neutralClinicalWhite,
        selectedItemColor: AppColors.primaryDeepForestGreen,
        unselectedItemColor: AppColors.neutralSlateGray,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: AppTypography.caption,
        unselectedLabelStyle: AppTypography.caption,
        selectedIconTheme: const IconThemeData(
          size: 24,
          color: AppColors.primaryDeepForestGreen,
        ),
        unselectedIconTheme: const IconThemeData(
          size: 24,
          color: AppColors.neutralSlateGray,
        ),
      ),

      // ========== Floating Action Button ==========
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primaryDeepForestGreen,
        foregroundColor: AppColors.neutralClinicalWhite,
        elevation: 4,
      ),

      // ========== Divider ==========
      dividerTheme: const DividerThemeData(
        color: AppColors.neutralSoftBorder,
        thickness: 1,
        space: AppSpacing.elementSpacing,
      ),

      // ========== Icon ==========
      iconTheme: const IconThemeData(
        color: AppColors.neutralSlateGray,
        size: 24,
      ),

      // ========== Chip ==========
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.secondaryMintLeaf,
        labelStyle: AppTypography.withColor(
          AppTypography.bodyRegular,
          AppColors.primaryDeepForestGreen,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.elementSpacing,
          vertical: AppSpacing.tightSpacing,
        ),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.buttonBorderRadius,
        ),
      ),

      // ========== Progress Indicator ==========
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primaryDeepForestGreen,
        circularTrackColor: AppColors.secondaryMintLeaf,
      ),

      // ========== Snackbar ==========
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.neutralSlateGray,
        contentTextStyle: AppTypography.withColor(
          AppTypography.bodyRegular,
          AppColors.neutralClinicalWhite,
        ),
        behavior: SnackBarBehavior.floating,
      ),

      // ========== Dialog ==========
      dialogTheme: DialogTheme(
        backgroundColor: AppColors.neutralClinicalWhite,
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.cardBorderRadius,
        ),
        titleTextStyle: AppTypography.withColor(
          AppTypography.h2,
          AppColors.neutralSlateGray,
        ),
        contentTextStyle: AppTypography.withColor(
          AppTypography.bodyRegular,
          AppColors.neutralSlateGray,
        ),
      ),
    );
  }

  /// Dark theme support (future enhancement)
  static ThemeData get darkTheme {
    // For now, return light theme
    // Can be extended for dark mode support
    return lightTheme;
  }
}
