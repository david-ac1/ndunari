import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/routing/route_paths.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

/// Floating navigation bar with central FAB
class FloatingNavBar extends StatelessWidget {
  final int currentIndex;

  const FloatingNavBar({
    super.key,
    required this.currentIndex,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 24,
      left: 24,
      right: 24,
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(32),
          border: Border.all(
            color: AppColors.neutralSoftBorder,
            width: 1,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1A000000),
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _NavItem(
              icon: Icons.home,
              isActive: currentIndex == 0,
              onTap: () => context.go(RoutePaths.home),
            ),
            _NavItem(
              icon: Icons.history,
              isActive: currentIndex == 3,
              onTap: () => context.go(RoutePaths.history),
            ),
            // Central FAB
            Transform.translate(
              offset: const Offset(0, -8),
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.primaryDeepForestGreen,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 4,
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x33000000),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => context.go(RoutePaths.forensicScan),
                    customBorder: const CircleBorder(),
                    child: const Icon(
                      Icons.qr_code_scanner,
                      color: AppColors.neutralClinicalWhite,
                      size: 28,
                    ),
                  ),
                ),
              ),
            ),
            _NavItem(
              icon: Icons.medical_services,
              isActive: currentIndex == 2,
              onTap: () => context.go(RoutePaths.stewardship),
            ),
            _NavItem(
              icon: Icons.person,
              isActive: currentIndex == 4,
              onTap: () => context.go(RoutePaths.profile),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          child: Icon(
            icon,
            color: isActive
                ? AppColors.primaryDeepForestGreen
                : AppColors.neutralSlateGray.withOpacity(0.5),
            size: 24,
          ),
        ),
      ),
    );
  }
}
