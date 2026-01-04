import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_colors.dart';
import '../providers/scan_result_provider.dart';
import '../providers/stewardship_provider.dart';
import '../widgets/bottom_nav_bar.dart';
import 'package:intl/intl.dart';

/// History screen showing past scans and assessments
class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('History'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Scans', icon: Icon(Icons.qr_code_scanner)),
            Tab(text: 'Prescriptions', icon: Icon(Icons.medication)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildScanHistory(),
          _buildAssessmentHistory(),
        ],
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: 2,
        onTap: (index) {
          if (index == 0) Navigator.pop(context);
        },
      ),
    );
  }

  Widget _buildScanHistory() {
    return Consumer<ScanResultProvider>(
      builder: (context, provider, child) {
        if (provider.scanHistory.isEmpty) {
          return _buildEmptyState(
            icon: Icons.qr_code_scanner,
            title: 'No Scan History',
            subtitle: 'Your drug scans will appear here',
          );
        }

        return Column(
          children: [
            // Clear button
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${provider.scanHistory.length} scans',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  TextButton.icon(
                    onPressed: () => _confirmClearHistory(context, 'scans'),
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Clear All'),
                    style: TextButton.styleFrom(foregroundColor: AppColors.error),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: provider.scanHistory.length,
                itemBuilder: (context, index) {
                  final scan = provider.scanHistory[index];
                  return _buildScanHistoryItem(scan);
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildAssessmentHistory() {
    return Consumer<StewardshipProvider>(
      builder: (context, provider, child) {
        if (provider.assessmentHistory.isEmpty) {
          return _buildEmptyState(
            icon: Icons.medication,
            title: 'No Assessment History',
            subtitle: 'Your prescription assessments will appear here',
          );
        }

        return Column(
          children: [
            // Clear button
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${provider.assessmentHistory.length} assessments',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  TextButton.icon(
                    onPressed: () => _confirmClearHistory(context, 'assessments'),
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Clear All'),
                    style: TextButton.styleFrom(foregroundColor: AppColors.error),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: provider.assessmentHistory.length,
                itemBuilder: (context, index) {
                  final assessment = provider.assessmentHistory[index];
                  return _buildAssessmentHistoryItem(assessment);
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildScanHistoryItem(scan) {
    final dateFormat = DateFormat('MMM d, y h:mm a');
    final badgeColor = scan.isAuthentic ? AppColors.success : AppColors.error;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: badgeColor.withOpacity(0.2),
          child: Text(
            '${scan.authenticityScore.toInt()}%',
            style: TextStyle(
              color: badgeColor,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        title: Text(
          scan.batchNumber ?? 'No batch number',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              scan.isAuthentic ? 'Authentic' : 'Suspicious',
              style: TextStyle(color: badgeColor),
            ),
            Text(
              dateFormat.format(scan.scannedAt),
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          // TODO: Show detailed view
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Detailed view coming soon')),
          );
        },
      ),
    );
  }

  Widget _buildAssessmentHistoryItem(assessment) {
    final drugClassColor = _getDrugClassColor(assessment.drugClass);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: drugClassColor.withOpacity(0.2),
          child: Icon(
            _getDrugClassIcon(assessment.drugClass),
            color: drugClassColor,
          ),
        ),
        title: Text(
          '${assessment.drugClass} Class',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              'Risk: ${assessment.riskLevel}',
              style: TextStyle(color: _getRiskColor(assessment.riskLevel)),
            ),
            Text(
              assessment.isAppropriate ? 'Appropriate' : 'Needs Review',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          // TODO: Show detailed view
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Detailed view coming soon')),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 80, color: AppColors.textHint),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _confirmClearHistory(BuildContext context, String type) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear History?'),
        content: Text('This will permanently delete all $type.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (type == 'scans') {
                context.read<ScanResultProvider>().clearHistory();
              } else {
                context.read<StewardshipProvider>().clearHistory();
              }
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  Color _getDrugClassColor(String drugClass) {
    switch (drugClass) {
      case 'RESERVE':
        return AppColors.error;
      case 'WATCH':
        return AppColors.warning;
      case 'ACCESS':
        return AppColors.success;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData _getDrugClassIcon(String drugClass) {
    switch (drugClass) {
      case 'RESERVE':
        return Icons.emergency;
      case 'WATCH':
        return Icons.visibility;
      case 'ACCESS':
        return Icons.check_circle;
      default:
        return Icons.help;
    }
  }

  Color _getRiskColor(String riskLevel) {
    switch (riskLevel) {
      case 'HIGH':
        return AppColors.error;
      case 'MEDIUM':
        return AppColors.warning;
      case 'LOW':
        return AppColors.success;
      default:
        return AppColors.textSecondary;
    }
  }
}
