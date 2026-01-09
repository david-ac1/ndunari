import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/floating_nav_bar.dart';

/// History screen - View past scans and assessments
class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {},
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 100),
            child: Padding(
              padding: AppSpacing.pageMargins,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppSpacing.sectionSpacer,
                  
                  Text(
                    'Scan & Assessment History',
                    style: AppTypography.h1,
                  ),
                  
                  AppSpacing.elementSpacer,
                  
                  Text(
                    'Your recent scans and prescription assessments are stored locally.',
                    style: AppTypography.withColor(
                      AppTypography.bodyRegular,
                      AppColors.neutralSlateGray,
                    ),
                  ),
                  
                  AppSpacing.sectionSpacer,
                  
                  // Empty state
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 60),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              color: AppColors.secondaryMintLeaf,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.history,
                              size: 60,
                              color: AppColors.primaryDeepForestGreen.withOpacity(0.3),
                            ),
                          ),
                          AppSpacing.sectionSpacer,
                          Text(
                            'No history yet',
                            style: AppTypography.h2.copyWith(
                              color: AppColors.neutralSlateGray.withOpacity(0.6),
                            ),
                          ),
                          AppSpacing.elementSpacer,
                          Text(
                            'Your scans and assessments will appear here',
                            style: AppTypography.withColor(
                              AppTypography.caption,
                              AppColors.neutralSlateGray.withOpacity(0.5),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          AppSpacing.sectionSpacer,
                          ElevatedButton.icon(
                            onPressed: () {
                              // Navigate to scan
                            },
                            icon: const Icon(Icons.qr_code_scanner),
                            label: const Text('Start Scanning'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Floating navigation
          const FloatingNavBar(currentIndex: 3),
        ],
      ),
    );
  }
}
