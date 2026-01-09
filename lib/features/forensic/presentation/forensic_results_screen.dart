import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../models/forensic_analysis_result.dart';

/// Forensic scan results screen
class ForensicResultsScreen extends StatelessWidget {
  final ForensicAnalysisResult result;

  const ForensicResultsScreen({
    super.key,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Results'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPress: () => context.go('/'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // TODO: Implement sharing
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: AppSpacing.pageMargins,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Authenticity Badge
            _AuthenticityBadge(result: result),
            
            AppSpacing.sectionSpacer,
            
            // Drug Information
            _InfoCard(
              title: 'Drug Information',
              children: [
                _InfoRow('Drug Name', result.drugName),
                _InfoRow('Manufacturer', result.manufacturer),
                if (result.nafdacNumber != null)
                  _InfoRow('NAFDAC No.', result.nafdacNumber!),
              ],
            ),
            
            AppSpacing.sectionSpacer,
            
            // NAFDAC Validation
            _NAFDACValidationCard(validation: result.nafdacValidation),
            
            AppSpacing.sectionSpacer,
            
            // Analysis Details
            if (result.findings.isNotEmpty) ...[
              _FindingsCard(
                title: 'Positive Indicators',
                icon: Icons.check_circle,
                color: AppColors.successAccessGreen,
                items: result.findings,
              ),
              AppSpacing.sectionSpacer,
            ],
            
            if (result.warnings.isNotEmpty) ...[
              _FindingsCard(
                title: 'Warnings',
                icon: Icons.warning_amber,
                color: AppColors.warningWatchOrange,
                items: result.warnings,
              ),
              AppSpacing.sectionSpacer,
            ],
            
            if (result.suspiciousFeatures.isNotEmpty) ...[
              _FindingsCard(
                title: 'Suspicious Features',
                icon: Icons.report_problem,
                color: AppColors.dangerReserveRed,
                items: result.suspiciousFeatures,
              ),
              AppSpacing.sectionSpacer,
            ],
            
            // Pro Analysis (if escalated)
            if (result.wasEscalated && result.proAnalysis != null) ...[
              _ProAnalysisCard(proAnalysis: result.proAnalysis!),
              AppSpacing.sectionSpacer,
            ],
            
            // Technical Details
            _TechnicalDetailsCard(result: result),
            
            AppSpacing.sectionSpacer,
            
            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/'),
                    icon: const Icon(Icons.home),
                    label: const Text('Home'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => context.go('/scan'),
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('Scan Again'),
                  ),
                ),
              ],
            ),
            
            const SizedBox(width: 24),
          ],
        ),
      ),
    );
  }
}

/// Authenticity badge at the top
class _AuthenticityBadge extends StatelessWidget {
  final ForensicAnalysisResult result;

  const _AuthenticityBadge({required this.result});

  Color get _badgeColor {
    if (result.authenticityScore >= 95) return AppColors.successAccessGreen;
    if (result.authenticityScore >= 80) return Colors.green;
    if (result.authenticityScore >= 60) return AppColors.warningWatchOrange;
    return AppColors.dangerReserveRed;
  }

  IconData get_badgeIcon {
    if (result.authenticityScore >= 95) return Icons.verified;
    if (result.authenticityScore >= 60) return Icons.warning_amber;
    return Icons.dangerous;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_badgeColor, _badgeColor.withOpacity(0.8)],
        ),
        borderRadius: AppSpacing.cardBorderRadius,
      ),
      child: Column(
        children: [
          Icon(_badgeIcon, color: Colors.white, size: 64),
          const SizedBox(height: 16),
          Text(
            result.riskLevel,
            style: AppTypography.h1.copyWith(
              color: Colors.white,
              fontSize: 28,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            '${result.authenticityScore.toStringAsFixed(1)}% Authenticity Score',
            style: AppTypography.bodyLarge.copyWith(
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          if (result.wasEscalated) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.psychology, color: Colors.white, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    'Expert Analysis',
                    style: AppTypography.caption.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// NAFDAC validation card
class _NAFDACValidationCard extends StatelessWidget {
  final NAFDACValidationResult validation;

  const _NAFDACValidationCard({required this.validation});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: validation.isValid
            ? AppColors.successAccessGreen.withOpacity(0.1)
            : AppColors.dangerReserveRed.withOpacity(0.1),
        borderRadius: AppSpacing.cardBorderRadius,
        border: Border.all(
          color: validation.isValid
              ? AppColors.successAccessGreen.withOpacity(0.3)
              : AppColors.dangerReserveRed.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                validation.isValid ? Icons.verified : Icons.error,
                color: validation.isValid
                    ? AppColors.successAccessGreen
                    : AppColors.dangerReserveRed,
              ),
              const SizedBox(width: 8),
              Text(
                'NAFDAC Validation',
                style: AppTypography.h2.copyWith(
                  color: validation.isValid
                      ? AppColors.successAccessGreen
                      : AppColors.dangerReserveRed,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (validation.isValid) ...[
            if (validation.registrationNumber != null)
              _InfoRow('Registration No.', validation.registrationNumber!),
            if (validation.productCategory != null)
              _InfoRow('Category', validation.productCategory!),
          ] else ...[
            ...validation.validationErrors.map((error) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, size: 16, color: AppColors.dangerReserveRed),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          error,
                          style: AppTypography.caption.copyWith(
                            color: AppColors.dangerReserveRed,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

/// Info card with title and rows
class _InfoCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _InfoCard({
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.neutralClinicalWhite,
        borderRadius: AppSpacing.cardBorderRadius,
        border: Border.all(color: AppColors.neutralSoftBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.h2),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

/// Info row
class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: AppTypography.caption.copyWith(
                color: AppColors.neutralSlateGray.withOpacity(0.6),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTypography.bodyRegular.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

/// Findings card (positive/warnings/suspicious)
class _FindingsCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final List<String> items;

  const _FindingsCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: AppSpacing.cardBorderRadius,
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: AppTypography.bodyLarge.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 4,
                      height: 4,
                      margin: const EdgeInsets.only(top: 8, right: 8),
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        item,
                        style: AppTypography.bodyRegular,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

/// Pro analysis card
class _ProAnalysisCard extends StatelessWidget {
  final ProAnalysisDetails proAnalysis;

  const _ProAnalysisCard({required this.proAnalysis});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryDeepForestGreen.withOpacity(0.1),
            AppColors.secondaryMintLeaf,
          ],
        ),
        borderRadius: AppSpacing.cardBorderRadius,
        border: Border.all(color: AppColors.primaryDeepForestGreen.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology, color: AppColors.primaryDeepForestGreen),
              const SizedBox(width: 8),
              Text(
                'Expert Forensic Analysis',
                style: AppTypography.h2.copyWith(color: AppColors.primaryDeepForestGreen),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _ProAnalysisSection('Hologram Refraction', proAnalysis.hologramRefraction),
          _ProAnalysisSection('Typography Kerning', proAnalysis.typographyKerning),
          _ProAnalysisSection('NAFDAC Syntax', proAnalysis.nafdacSyntax),
          _ProAnalysisSection('Printing Quality', proAnalysis.printingQuality),
          _ProAnalysisSection('Overall Assessment', proAnalysis.overallAssessment),
        ],
      ),
    );
  }
}

class _ProAnalysisSection extends StatelessWidget {
  final String title;
  final String content;

  const _ProAnalysisSection(this.title, this.content);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppTypography.caption.copyWith(
              color: AppColors.primaryDeepForestGreen,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: AppTypography.bodyRegular,
          ),
        ],
      ),
    );
  }
}

/// Technical details card
class _TechnicalDetailsCard extends StatelessWidget {
  final ForensicAnalysisResult result;

  const _TechnicalDetailsCard({required this.result});

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      title: Text('Technical Details', style: AppTypography.bodyLarge),
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _InfoRow('Model Used', result.modelUsed),
              _InfoRow('Confidence', '${result.confidence.toStringAsFixed(1)}%'),
              _InfoRow('Scanned At', result.scannedAt.toString()),
              if (result.location != null) _InfoRow('Location', result.location!),
              _InfoRow('Image Hash', result.imageHash),
              if (result.escalationReason != null)
                _InfoRow('Escalation Reason', result.escalationReason!),
            ],
          ),
        ),
      ],
    );
  }
}
