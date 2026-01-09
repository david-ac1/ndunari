import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/routing/route_paths.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/floating_nav_bar.dart';
import '../../../shared/widgets/offline_banner.dart';

/// Home screen - Main entry point for Ndunari app
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.primaryDeepForestGreen.withOpacity(0.05),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          // Main content
          Column(
            children: [
              // Offline banner
              const OfflineBanner(isOffline: false),
              
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.only(bottom: 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
                        child: Row(
                          children: [
                            // Avatar
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.primaryDeepForestGreen,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.neutralClinicalWhite,
                                  width: 2,
                                ),
                              ),
                              child: const Icon(
                                Icons.person,
                                color: AppColors.neutralClinicalWhite,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Welcome back,',
                                    style: AppTypography.withColor(
                                      AppTypography.caption,
                                      AppColors.neutralSlateGray.withOpacity(0.7),
                                    ),
                                  ),
                                  Text(
                                    'User',
                                    style: AppTypography.h2,
                                  ),
                                ],
                              ),
                            ),
                            // Notification button
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.neutralClinicalWhite,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.neutralSoftBorder,
                                  width: 1,
                                ),
                              ),
                              child: const Icon(
                                Icons.notifications,
                                color: AppColors.neutralSlateGray,
                                size: 20,
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Health Shield Status Card
                      Padding(
                        padding: AppSpacing.pageMargins,
                        child: _HealthShieldCard(),
                      ),
                      
                      AppSpacing.sectionSpacer,
                      
                      // Alert Chips
                      SizedBox(
                        height: 70,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          children: const [
                            _AlertChip(
                              icon: Icons.warning_amber,
                              title: 'NAFDAC Alert',
                              subtitle: 'Paracetamol Batch #291 Recall',
                              color: AppColors.warningWatchOrange,
                            ),
                            SizedBox(width: 12),
                            _AlertChip(
                              icon: Icons.thermostat,
                              title: 'Storage Tip',
                              subtitle: 'Keep insulin below 25°C',
                              color: Colors.blue,
                            ),
                          ],
                        ),
                      ),
                      
                      AppSpacing.sectionSpacer,
                      
                      // Primary Actions
                      Padding(
                        padding: AppSpacing.pageMargins,
                        child: Row(
                          children: [
                            Expanded(
                              child: _PrimaryActionCard(
                                icon: Icons.qr_code_scanner,
                                title: 'Scan\nPack',
                                subtitle: 'Verify barcode safety',
                                isDark: true,
                                onTap: () => context.go(RoutePaths.forensicScan),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _PrimaryActionCard(
                                icon: Icons.medical_services,
                                title: 'Analyze\nRx',
                                subtitle: 'Check drug conflicts',
                                isDark: false,
                                onTap: () => context.go(RoutePaths.stewardship),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      AppSpacing.sectionSpacer,
                      
                      // Secondary Actions
                      Padding(
                        padding: AppSpacing.pageMargins,
                        child: Row(
                          children: [
                            Expanded(
                              child: _SecondaryActionButton(
                                icon: Icons.report_problem,
                                label: 'Report Fake',
                                color: AppColors.dangerReserveRed,
                                onTap: () {},
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _SecondaryActionButton(
                                icon: Icons.medication,
                                label: 'My Cabinet',
                                color: Colors.purple,
                                onTap: () {},
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      AppSpacing.sectionSpacer,
                      
                      // Recent Activity
                      Padding(
                        padding: AppSpacing.pageMargins,
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Recent Activity', style: AppTypography.h2),
                                TextButton(
                                  onPressed: () => context.go(RoutePaths.history),
                                  child: Text(
                                    'See All',
                                    style: AppTypography.withColor(
                                      AppTypography.caption,
                                      AppColors.primaryDeepForestGreen,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            AppSpacing.elementSpacer,
                            const _ActivityItem(
                              title: 'Amartem Softgel',
                              subtitle: 'Verified • Today, 9:41 AM',
                              isVerified: true,
                            ),
                            AppSpacing.elementSpacer,
                            const _ActivityItem(
                              title: 'Dr. Ibrahim\'s Rx',
                              subtitle: 'Analysis Complete • Yesterday',
                              isSafe: true,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          // Floating Navigation
          const FloatingNavBar(currentIndex: 0),
        ],
      ),
    );
  }
}

/// Health Shield status card
class _HealthShieldCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.secondaryMintLeaf,
        borderRadius: AppSpacing.cardBorderRadius,
        border: Border.all(
          color: AppColors.neutralSoftBorder,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.verified_user,
                    color: AppColors.primaryDeepForestGreen,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Health Shield',
                    style: AppTypography.h2,
                  ),
                ],
              ),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primaryDeepForestGreen.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.security,
                  color: AppColors.primaryDeepForestGreen,
                  size: 24,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Active',
            style: AppTypography.withColor(
              AppTypography.h1,
              AppColors.primaryDeepForestGreen,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Last scan: 2 hours ago',
            style: AppTypography.withColor(
              AppTypography.caption,
              AppColors.neutralSlateGray.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Protected against counterfeits',
                style: AppTypography.bodyRegular,
              ),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  backgroundColor: AppColors.primaryDeepForestGreen.withOpacity(0.1),
                  foregroundColor: AppColors.primaryDeepForestGreen,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Details',
                  style: AppTypography.caption.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Alert chip widget
class _AlertChip extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;

  const _AlertChip({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                title,
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700),
              ),
              Text(
                subtitle,
                style: AppTypography.caption.copyWith(fontSize: 10),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Primary action card
class _PrimaryActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isDark;
  final VoidCallback onTap;

  const _PrimaryActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 180,
      child: Material(
        color: isDark ? AppColors.primaryDeepForestGreen : AppColors.neutralClinicalWhite,
        borderRadius: AppSpacing.cardBorderRadius,
        elevation: isDark ? 0 : 1,
        child: InkWell(
          onTap: onTap,
          borderRadius: AppSpacing.cardBorderRadius,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: isDark 
                        ? Colors.white.withOpacity(0.1) 
                        : AppColors.primaryDeepForestGreen.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: isDark ? AppColors.neutralClinicalWhite : AppColors.primaryDeepForestGreen,
                    size: 24,
                  ),
                ),
                const Spacer(),
                Text(
                  title,
                  style: AppTypography.h2.copyWith(
                    color: isDark ? AppColors.neutralClinicalWhite : AppColors.neutralSlateGray,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: AppTypography.caption.copyWith(
                    color: isDark 
                        ? AppColors.neutralClinicalWhite.withOpacity(0.7) 
                        : AppColors.neutralSlateGray.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Secondary action button
class _SecondaryActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SecondaryActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.neutralClinicalWhite,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.neutralSoftBorder),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodyRegular.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Activity item
class _ActivityItem extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool isVerified;
  final bool isSafe;

  const _ActivityItem({
    required this.title,
    required this.subtitle,
    this.isVerified = false,
    this.isSafe = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.neutralClinicalWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.neutralSoftBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.secondaryMintLeaf,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.medication,
              color: AppColors.primaryDeepForestGreen,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.bodyRegular.copyWith(fontWeight: FontWeight.w600)),
                Text(
                  subtitle,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.neutralSlateGray.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          if (isVerified)
            const Icon(Icons.check_circle, color: AppColors.successAccessGreen, size: 20),
          if (isSafe)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.successAccessGreen.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'SAFE',
                style: AppTypography.caption.copyWith(
                  color: AppColors.successAccessGreen,
                  fontWeight: FontWeight.w700,
                  fontSize: 10,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
