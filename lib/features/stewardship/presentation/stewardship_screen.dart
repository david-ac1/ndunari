import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/floating_nav_bar.dart';

/// Stewardship screen
/// WHO AWaRe antibiotic guidance and prescription analysis
/// Reference: UI-doc.md Section 4.2
class StewardshipScreen extends StatefulWidget {
  const StewardshipScreen({super.key});

  @override
  State<StewardshipScreen> createState() => _StewardshipScreenState();
}

class _StewardshipScreenState extends State<StewardshipScreen> {
  String _selectedFilter = 'All';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stewardship Report'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
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
                
                // Safety Index Card
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: _SafetyIndexCard(),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Search bar
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Search antibiotics (e.g., Amoxicillin)',
                      prefixIcon: Icon(Icons.search),
                    ),
                  ),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Filter chips
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      _FilterChip(
                        label: 'All',
                        isSelected: _selectedFilter == 'All',
                        onTap: () => setState(() => _selectedFilter = 'All'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Access',
                        isSelected: _selectedFilter == 'Access',
                        color: AppColors.successAccessGreen,
                        onTap: () => setState(() => _selectedFilter = 'Access'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Watch',
                        isSelected: _selectedFilter == 'Watch',
                        color: AppColors.warningWatchOrange,
                        onTap: () => setState(() => _selectedFilter = 'Watch'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChip(
                        label: 'Reserve',
                        isSelected: _selectedFilter == 'Reserve',
                        color: AppColors.dangerReserveRed,
                        onTap: () => setState(() => _selectedFilter = 'Reserve'),
                      ),
                    ],
                  ),
                ),
                
                AppSpacing.sectionSpacer,
                
                // Drug lists by category
                Padding(
                  padding: AppSpacing.pageMargins,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ACCESS category
                      _CategoryHeader(
                        title: 'ACCESS — FIRST CHOICE',
                        color: AppColors.successAccessGreen,
                        badge: 'Safe',
                      ),
                      AppSpacing.elementSpacer,
                      _DrugItem(
                        name: 'Amoxicillin',
                        dosage: '500mg • Twice • Daily',
                        category: 'ACCESS',
                        isRecommended: true,
                      ),
                      AppSpacing.elementSpacer,
                      _DrugItem(
                        name: 'Ampicillin',
                        dosage: '250mg • 4x Daily',
                        category: 'ACCESS',
                        isRecommended: true,
                      ),
                      
                      AppSpacing.sectionSpacer,
                      
                      // WATCH category
                      _CategoryHeader(
                        title: 'WATCH — MONITOR CLOSELY',
                        color: AppColors.warningWatchOrange,
                        badge: 'Caution',
                      ),
                      AppSpacing.elementSpacer,
                      _DrugItem(
                        name: 'Ciprofloxacin',
                        dosage: '750mg • Twice • 10 Days STD',
                        category: 'WATCH',
                        riskLevel: 'High Res',
                      ),
                      AppSpacing.elementSpacer,
                      _DrugItem(
                        name: 'Azithromycin',
                        dosage: '500mg • Once Daily',
                        category: 'WATCH',
                        riskLevel: 'High Res',
                      ),
                      
                      AppSpacing.sectionSpacer,
                      
                      // RESERVE category
                      _CategoryHeader(
                        title: 'RESERVE — LAST RESORT',
                        color: AppColors.dangerReserveRed,
                        badge: 'Danger',
                      ),
                      AppSpacing.elementSpacer,
                      _DrugItem(
                        name: 'Colistin',
                        dosage: 'Injectable • Hospital Use Only',
                        category: 'RESERVE',
                        isRestricted: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Floating navigation
          const FloatingNavBar(currentIndex: 2),
        ],
      ),
    );
  }
}

/// Safety Index Card
class _SafetyIndexCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0A4D3C),
            Color(0xFF0D6147),
          ],
        ),
        borderRadius: AppSpacing.cardBorderRadius,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SAFETY INDEX',
                  style: AppTypography.caption.copyWith(
                    color: Colors.white.withOpacity(0.7),
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '92',
                      style: AppTypography.h1.copyWith(
                        fontSize: 48,
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        height: 1,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8, left: 4),
                      child: Text(
                        '%',
                        style: AppTypography.h2.copyWith(
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.successAccessGreen,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Low Risk',
                        style: AppTypography.caption.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Ndunari AI–Based on local resistance patterns in your region',
                  style: AppTypography.caption.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Circular progress indicator
          SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: CircularProgressIndicator(
                    value: 0.92,
                    strokeWidth: 6,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.successAccessGreen,
                    ),
                  ),
                ),
                Icon(
                  Icons.local_hospital,
                  color: Colors.white.withOpacity(0.5),
                  size: 32,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Category header
class _CategoryHeader extends StatelessWidget {
  final String title;
  final Color color;
  final String badge;

  const _CategoryHeader({
    required this.title,
    required this.color,
    required this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: AppTypography.bodyLarge.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.neutralSlateGray,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            badge,
            style: AppTypography.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

/// Drug item widget
class _DrugItem extends StatelessWidget {
  final String name;
  final String dosage;
  final String category;
  final bool isRecommended;
  final String? riskLevel;
  final bool isRestricted;

  const _DrugItem({
    required this.name,
    required this.dosage,
    required this.category,
    this.isRecommended = false,
    this.riskLevel,
    this.isRestricted = false,
  });

  Color get _categoryColor {
    switch (category) {
      case 'ACCESS':
        return AppColors.successAccessGreen;
      case 'WATCH':
        return AppColors.warningWatchOrange;
      case 'RESERVE':
        return AppColors.dangerReserveRed;
      default:
        return AppColors.neutralSlateGray;
    }
  }

  IconData get _leadingIcon {
    if (isRecommended) return Icons.check_circle;
    if (isRestricted) return Icons.lock;
    return Icons.warning_amber;
  }

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
          Icon(
            _leadingIcon,
            color: _categoryColor,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  dosage,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.neutralSlateGray.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          if (riskLevel != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.warningWatchOrange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                riskLevel!,
                style: AppTypography.caption.copyWith(
                  color: AppColors.warningWatchOrange,
                  fontWeight: FontWeight.w700,
                  fontSize: 10,
                ),
              ),
            ),
          if (isRestricted)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.dangerReserveRed.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Restricted',
                style: AppTypography.caption.copyWith(
                  color: AppColors.dangerReserveRed,
                  fontWeight: FontWeight.w700,
                  fontSize: 10,
                ),
              ),
            ),
          const SizedBox(width: 8),
          Icon(
            Icons.chevron_right,
            color: AppColors.neutralSlateGray.withOpacity(0.3),
            size: 20,
          ),
        ],
      ),
    );
  }
}

/// Filter chip widget
class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final Color? color;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final chipColor = color ?? AppColors.primaryDeepForestGreen;
    
    return Material(
      color: isSelected ? chipColor : Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            border: Border.all(
              color: isSelected ? chipColor : AppColors.neutralSoftBorder,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              if (color != null && isSelected)
                Container(
                  width: 12,
                  height: 12,
                  margin: const EdgeInsets.only(right: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              Text(
                label,
                style: AppTypography.bodyRegular.copyWith(
                  color: isSelected ? Colors.white : AppColors.neutralSlateGray,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
