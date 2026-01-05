import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../theme/app_colors.dart';
import '../providers/stewardship_provider.dart';
import '../providers/voice_guide_provider.dart';
import '../models/stewardship_assessment.dart';
import '../widgets/bottom_nav_bar.dart';

/// Stewardship Screen - Check prescription for antibiotic stewardship
/// 
/// 🎯 GEMINI 3 PRO THINKING MODE + VOICE GUIDE
/// ============================================
/// 
/// Features:
/// 1. Gemini 3 Pro with Thinking for complex medical reasoning
/// 2. WHO AWaRe classification (ACCESS/WATCH/RESERVE)
/// 3. Multilingual counseling (5 Nigerian languages)
/// 4. 🔊 VOICE GUIDE: Audio playback for low-literacy accessibility
/// 5. Regional AMR pattern analysis
class StewardshipScreen extends StatefulWidget {
  const StewardshipScreen({super.key});

  @override
  State<StewardshipScreen> createState() => _StewardshipScreenState();
}

class _StewardshipScreenState extends State<StewardshipScreen> {
  final TextEditingController _prescriptionController = TextEditingController();
  String _selectedLanguage = 'english';

  Future<String> _getLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      Position position = await Geolocator.getCurrentPosition();
      return '${position.latitude},${position.longitude}';
    } catch (e) {
      return 'Unknown Location';
    }
  }

  void _analyzePrescription(StewardshipProvider provider) async {
    if (_prescriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter prescription details')),
      );
      return;
    }

    final location = await _getLocation();
    await provider.assessPrescription(
      _prescriptionController.text.trim(),
      location,
    );
  }

  @override
  void dispose() {
    _prescriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<StewardshipProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Antibiotic Stewardship'),
            actions: [
              IconButton(
                icon: const Icon(Icons.history),
                onPressed: () {
                  // TODO: Show assessment history
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('History feature coming soon')),
                  );
                },
              ),
            ],
          ),
          body: provider.currentAssessment == null
              ? _buildInputForm(provider)
              : _buildResultsView(provider),
          bottomNavigationBar: BottomNavBar(
            currentIndex: 1,
            onTap: (index) {
              if (index == 0) Navigator.pop(context);
            },
          ),
        );
      },
    );
  }

  Widget _buildInputForm(StewardshipProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Text(
            'Check Prescription',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Enter prescription details for antibiotic stewardship analysis',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 32),

          // Prescription Input
          TextField(
            controller: _prescriptionController,
            maxLines: 8,
            decoration: InputDecoration(
              hintText: 'Example:\nAmoxicillin 500mg\n3 times daily for 7 days\nFor upper respiratory infection',
              labelText: 'Prescription Details',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: AppColors.surface,
            ),
          ),
          const SizedBox(height: 24),

          // Analyze Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: provider.isLoading
                  ? null
                  : () => _analyzePrescription(provider),
              icon: provider.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.analytics),
              label: Text(
                provider.isLoading ? 'Analyzing...' : 'Analyze Prescription',
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppColors.secondary,
              ),
            ),
          ),

          if (provider.error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.error),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error, color: AppColors.error),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Error: ${provider.error}',
                      style: const TextStyle(color: AppColors.error),
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

  Widget _buildResultsView(StewardshipProvider provider) {
    final assessment = provider.currentAssessment!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with reset button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Assessment Results',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () {
                  provider.clearAssessment();
                  _prescriptionController.clear();
                },
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Drug Class Badge
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: _getGradientForClass(assessment.drugClass),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Icon(
                  _getIconForClass(assessment.drugClass),
                  size: 48,
                  color: Colors.white,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${assessment.drugClass} Class',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Risk Level: ${assessment.riskLevel}',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Appropriateness Indicator
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: assessment.isAppropriate
                  ? AppColors.success.withOpacity(0.1)
                  : AppColors.warning.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: assessment.isAppropriate
                    ? AppColors.success
                    : AppColors.warning,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  assessment.isAppropriate ? Icons.check_circle : Icons.warning,
                  color: assessment.isAppropriate
                      ? AppColors.success
                      : AppColors.warning,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    assessment.isAppropriate
                        ? 'Prescription appears appropriate'
                        : 'Requires clinical review',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: assessment.isAppropriate
                          ? AppColors.success
                          : AppColors.warning,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Recommendations
          if (assessment.recommendations.isNotEmpty) ...[
            Text(
              'Recommendations:',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...assessment.recommendations.map((rec) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_circle_outline,
                          size: 20, color: AppColors.primary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          rec,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 24),
          ],

          // Resistance Concerns
          if (assessment.resistanceConcerns.isNotEmpty) ...[
            Text(
              'Resistance Concerns:',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...assessment.resistanceConcerns.map((concern) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_amber,
                          size: 20, color: AppColors.warning),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          concern,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 24),
          ],

          // Patient Counseling
          Text(
            'Patient Counseling:',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),

          // Language Selector
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildLanguageChip('English', 'english'),
                _buildLanguageChip('Pidgin', 'pidgin'),
                _buildLanguageChip('Hausa', 'hausa'),
                _buildLanguageChip('Igbo', 'igbo'),
                _buildLanguageChip('Yoruba', 'yoruba'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Counseling Text with Voice Guide Button
          Consumer<VoiceGuideProvider>(
            builder: (context, voiceProvider, child) {
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            assessment.counseling[_selectedLanguage] ??
                                'Counseling not available in this language',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                        ),
                        // 🔊 VOICE GUIDE BUTTON
                        IconButton(
                          icon: Icon(
                            voiceProvider.isPlaying
                                ? Icons.stop_circle
                                : Icons.volume_up,
                            size: 32,
                            color: AppColors.primary,
                          ),
                          onPressed: () {
                            if (voiceProvider.isPlaying) {
                              voiceProvider.stop();
                            } else {
                              final counselingText =
                                  assessment.counseling[_selectedLanguage] ??
                                      'No counseling available';
                              voiceProvider.speak(
                                counselingText,
                                languageOverride: _selectedLanguage,
                              );
                            }
                          },
                          tooltip: voiceProvider.isPlaying
                              ? 'Stop audio'
                              : 'Play audio counseling',
                        ),
                      ],
                    ),
                    if (voiceProvider.isPlaying)
                      const Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Row(
                          children: [
                            Icon(Icons.graphic_eq, size: 16, color: AppColors.primary),
                            SizedBox(width: 8),
                            Text(
                              'Playing audio...',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageChip(String label, String langKey) {
    final isSelected = _selectedLanguage == langKey;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          if (selected) {
            setState(() {
              _selectedLanguage = langKey;
            });
          }
        },
        selectedColor: AppColors.primary,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : AppColors.textPrimary,
        ),
      ),
    );
  }

  LinearGradient _getGradientForClass(String drugClass) {
    switch (drugClass) {
      case 'RESERVE':
        return AppColors.dangerGradient;
      case 'WATCH':
        return AppColors.secondaryGradient;
      case 'ACCESS':
        return AppColors.primaryGradient;
      default:
        return const LinearGradient(colors: [Colors.grey, Colors.grey]);
    }
  }

  IconData _getIconForClass(String drugClass) {
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
}
