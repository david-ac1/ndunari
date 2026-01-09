import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/floating_nav_bar.dart';

/// Profile screen - User preferences and settings
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {},
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 100),
            child: Column(
              children: [
                AppSpacing.sectionSpacer,
                
                // User Avatar Section
                Center(
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: AppColors.primaryDeepForestGreen,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.neutralClinicalWhite,
                                width: 4,
                              ),
                            ),
                            child: const Icon(
                              Icons.person,
                              size: 50,
                              color: AppColors.neutralClinicalWhite,
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: const BoxDecoration(
                                color: AppColors.successAccessGreen,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.verified,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                      AppSpacing.elementSpacer,
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'User Name',
                            style: AppTypography.h1,
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.verified,
                            color: AppColors.successAccessGreen,
                            size: 20,
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'ID: NDU-8829 • Member since 2023',
                        style: AppTypography.withColor(
                          AppTypography.caption,
                          AppColors.neutralSlateGray.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Safety Score Card
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: _SafetyScoreCard(),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Quick Stats
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: Row(
                    children: const [
                      Expanded(
                        child: _StatCard(
                          label: 'SAFETY CHECKS',
                          value: '12',
                          subtitle: 'All time',
                          icon: Icons.verified_user,
                          color: AppColors.primaryDeepForestGreen,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          label: 'ACTIVE ALERTS',
                          value: '0',
                          subtitle: 'All clear',
                          icon: Icons.notifications_active,
                          color: AppColors.successAccessGreen,
                        ),
                      ),
                    ],
                  ),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Account Section
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Account',
                        style: AppTypography.h2,
                      ),
                      AppSpacing.elementSpacer,
                      _MenuItem(
                        icon: Icons.person_outline,
                        title: 'Personal Information',
                        subtitle: 'Name, DOB, Gender',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.credit_card,
                        title: 'Subscription & Billing',
                        subtitle: 'Manage subscription',
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Health & Safety Section
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Health & Safety',
                        style: AppTypography.h2,
                      ),
                      AppSpacing.elementSpacer,
                      _MenuItem(
                        icon: Icons.medical_information,
                        iconColor: AppColors.successAccessGreen,
                        title: 'Medical Records',
                        subtitle: 'Secure your health data',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.psychology,
                        iconColor: Colors.orange,
                        title: 'AI Preferences',
                        subtitle: 'Custom data training',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.contact_emergency,
                        iconColor: Colors.blue,
                        title: 'Emergency Contacts',
                        subtitle: 'Manage trusted list',
                        badge: 'NEW',
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
                
                AppSpacing.sectionSpacer,
                
                // App Settings Section
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'App Settings',
                        style: AppTypography.h2,
                      ),
                      AppSpacing.elementSpacer,
                      _MenuItem(
                        icon: Icons.security,
                        title: 'Security & Privacy',
                        onTap: () {},
                      ),
                      _MenuItem(
                        icon: Icons.support_agent,
                        title: 'Support',
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Log Out
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(
                      Icons.logout,
                      color: AppColors.dangerReserveRed,
                    ),
                    label: Text(
                      'Log Out',
                      style: AppTypography.bodyLarge.copyWith(
                        color: AppColors.dangerReserveRed,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Version
                Center(
                  child: Text(
                    '${AppConstants.appName} v${AppConstants.appVersion} (Build 2024)',
                    style: AppTypography.withColor(
                      AppTypography.caption,
                      AppColors.neutralSlateGray.withOpacity(0.4),
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
              ],
            ),
          ),
          
          // Floating navigation
          const FloatingNavBar(currentIndex: 4),
        ],
      ),
    );
  }
}

/// Safety Score Card
class _SafetyScoreCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.neutralClinicalWhite,
        borderRadius: AppSpacing.cardBorderRadius,
        border: Border.all(color: AppColors.neutralSoftBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SAFETY SCORE',
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '85',
                style: AppTypography.h1.copyWith(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primaryDeepForestGreen,
                  height: 1,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 8, left: 4),
                child: Text(
                  '% Good',
                  style: AppTypography.bodyLarge.copyWith(
                    color: AppColors.primaryDeepForestGreen,
                  ),
                ),
              ),
              const Spacer(),
              Icon(
                Icons.security,
                color: AppColors.primaryDeepForestGreen.withOpacity(0.2),
                size: 48,
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: 0.85,
            backgroundColor: AppColors.neutralSoftBorder,
            valueColor: const AlwaysStoppedAnimation(
              AppColors.primaryDeepForestGreen,
            ),
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warningWatchOrange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.warning_amber,
                  color: AppColors.warningWatchOrange,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Add 1 more emergency contact to reach 100% completion',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.neutralSlateGray,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Stat card
class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.caption.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTypography.h1.copyWith(
              color: color,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: AppTypography.caption.copyWith(
              color: AppColors.neutralSlateGray.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }
}

/// Menu item
class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;
  final String? badge;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
    this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: (iconColor ?? AppColors.primaryDeepForestGreen).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: iconColor ?? AppColors.primaryDeepForestGreen,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          title,
                          style: AppTypography.bodyRegular.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (badge != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.warningWatchOrange,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              badge!,
                              style: AppTypography.caption.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 9,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: AppTypography.caption.copyWith(
                          color: AppColors.neutralSlateGray.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: AppColors.neutralSlateGray.withOpacity(0.3),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
