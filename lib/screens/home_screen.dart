import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/action_card.dart';
import '../widgets/bottom_nav_bar.dart';
import 'forensic_scan_screen.dart';
import 'stewardship_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';

/// Home screen with quick action cards and recent activity
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentNavIndex = 0;

  void _onNavTap(int index) {
    setState(() {
      _currentNavIndex = index;
    });
    
    // Navigate based on bottom nav selection
    if (index == 1) {
      // Navigate to Scan screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ForensicScanScreen()),
      );
    } else if (index == 2) {
      // Navigate to History screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const HistoryScreen()),
      );
    } else if (index == 3) {
      // Navigate to Profile screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ProfileScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.health_and_safety, color: AppColors.primary, size: 28),
            SizedBox(width: 8),
            Text('Ndunari'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Navigate to notifications
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              Text(
                'Welcome back!',
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 8),
              Text(
                'Keep Nigeria\'s medicines safe',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 32),

              // Quick Actions Section
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              
              // Action Cards Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.85,
                children: [
                  ActionCard(
                    icon: Icons.document_scanner,
                    title: 'Scan Batch',
                    subtitle: 'Check drug authenticity',
                    gradient: AppColors.primaryGradient,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ForensicScanScreen(),
                        ),
                      );
                    },
                  ),
                  ActionCard(
                    icon: Icons.medication,
                    title: 'Check Prescription',
                    subtitle: 'Verify antibiotic use',
                    gradient: AppColors.secondaryGradient,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const StewardshipScreen(),
                        ),
                      );
                    },
                  ),
                  ActionCard(
                    icon: Icons.record_voice_over,
                    title: 'Voice Guide',
                    subtitle: 'Audio instructions',
                    gradient: const LinearGradient(
                      colors: [Color(0xFF9C27B0), Color(0xFFBA68C8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    onTap: () {
                      // TODO: Implement voice guide feature
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Voice guide feature coming soon'),
                        ),
                      );
                    },
                  ),
                  ActionCard(
                    icon: Icons.info_outline,
                    title: 'Learn More',
                    subtitle: 'About counterfeit drugs',
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF6F00), Color(0xFFFFB74D)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    onTap: () {
                      // TODO: Navigate to education/info screen
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Educational content coming soon'),
                        ),
                      );
                    },
                  ),
                ],
              ),
              
              const SizedBox(height: 32),

              // Recent Activity Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Activity',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  TextButton(
                    onPressed: () {
                      // TODO: Navigate to full history
                    },
                    child: const Text('See all'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Recent activity placeholder
              _buildRecentActivityPlaceholder(context),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentNavIndex,
        onTap: _onNavTap,
      ),
    );
  }

  Widget _buildRecentActivityPlaceholder(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            Icons.history,
            size: 48,
            color: AppColors.textHint,
          ),
          const SizedBox(height: 12),
          Text(
            'No recent scans',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Your scan history will appear here',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
