import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

/// Offline banner widget
/// Displays when network connectivity is lost
class OfflineBanner extends StatelessWidget {
  final bool isOffline;

  const OfflineBanner({
    super.key,
    required this.isOffline,
  });

  @override
  Widget build(BuildContext context) {
    if (!isOffline) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.elementSpacing),
      color: AppColors.warningWatchOrange,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.wifi_off,
            color: AppColors.neutralClinicalWhite,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.tightSpacing),
          Text(
            'No internet connection',
            style: AppTypography.withColor(
              AppTypography.bodyRegular,
              AppColors.neutralClinicalWhite,
            ),
          ),
        ],
      ),
    );
  }
}
