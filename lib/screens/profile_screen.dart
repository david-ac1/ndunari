import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_colors.dart';
import '../providers/user_provider.dart';
import '../providers/scan_result_provider.dart';
import '../providers/stewardship_provider.dart';
import '../services/local_storage_service.dart';
import '../widgets/bottom_nav_bar.dart';

/// Profile and settings screen
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile & Settings'),
      ),
      body: Consumer<UserProvider>(
        builder: (context, userProvider, child) {
          return SingleChildScrollView(
            child: Column(
              children: [
                // User Info Section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                  ),
                  child: Column(
                    children: [
                      const CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.white,
                        child: Icon(
                          Icons.person,
                          size: 48,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Ndunari User',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Keeping Nigeria\'s medicines safe',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ),

                // Settings Sections
                _buildSectionHeader('Preferences'),
                _buildLanguageTile(context, userProvider),
                _buildNotificationTile(context, userProvider),

                _buildSectionHeader('Data'),
                _buildStatsTile(context),
                _buildClearHistoryTile(context),

                _buildSectionHeader('About'),
                _buildAboutTile(context, 'Version', '1.0.0'),
                _buildAboutTile(context, 'Privacy Policy', 'View'),
                _buildAboutTile(context, 'Terms of Service', 'View'),

                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: 3,
        onTap: (index) {
          if (index == 0) Navigator.pop(context);
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageTile(BuildContext context, UserProvider provider) {
    final languages = {
      'english': 'English',
      'pidgin': 'Nigerian Pidgin',
      'hausa': 'Hausa',
      'igbo': 'Igbo',
      'yoruba': 'Yoruba',
    };

    return ListTile(
      leading: const Icon(Icons.language),
      title: const Text('Language'),
      subtitle: Text(languages[provider.preferredLanguage] ?? 'English'),
      trailing: const Icon(Icons.chevron_right),
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Select Language'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: languages.entries.map((entry) {
                return RadioListTile<String>(
                  title: Text(entry.value),
                  value: entry.key,
                  groupValue: provider.preferredLanguage,
                  onChanged: (value) {
                    if (value != null) {
                      provider.setPreferredLanguage(value);
                      Navigator.pop(context);
                    }
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }

  Widget _buildNotificationTile(BuildContext context, UserProvider provider) {
    return SwitchListTile(
      secondary: const Icon(Icons.notifications),
      title: const Text('Notifications'),
      subtitle: const Text('Receive alerts and updates'),
      value: provider.notificationsEnabled,
      onChanged: (value) {
        provider.setNotificationsEnabled(value);
      },
    );
  }

  Widget _buildStatsTile(BuildContext context) {
    return Consumer2<ScanResultProvider, StewardshipProvider>(
      builder: (context, scanProvider, stewardshipProvider, child) {
        final totalScans = scanProvider.scanHistory.length;
        final totalAssessments = stewardshipProvider.assessmentHistory.length;

        return ListTile(
          leading: const Icon(Icons.analytics),
          title: const Text('Activity Stats'),
          subtitle: Text('$totalScans scans • $totalAssessments assessments'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Activity Statistics'),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Drug Scans: $totalScans'),
                    const SizedBox(height: 8),
                    Text('Total Assessments: $totalAssessments'),
                    const SizedBox(height: 8),
                    Text('Total Actions: ${totalScans + totalAssessments}'),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Close'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildClearHistoryTile(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.delete_outline, color: AppColors.error),
      title: const Text('Clear All History', style: TextStyle(color: AppColors.error)),
      subtitle: const Text('Delete all scans and assessments'),
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Clear All History?'),
            content: const Text(
              'This will permanently delete all your scans and assessments. This action cannot be undone.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () async {
                  final storage = LocalStorageService();
                  await storage.clearAllHistory();
                  await context.read<ScanResultProvider>().clearHistory();
                  await context.read<StewardshipProvider>().clearHistory();
                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('History cleared')),
                    );
                  }
                },
                style: TextButton.styleFrom(foregroundColor: AppColors.error),
                child: const Text('Clear'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAboutTile(BuildContext context, String title, String value) {
    return ListTile(
      title: Text(title),
      trailing: Text(
        value,
        style: const TextStyle(color: AppColors.textSecondary),
      ),
      onTap: () {
        if (title != 'Version') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Coming soon')),
          );
        }
      },
    );
  }
}
