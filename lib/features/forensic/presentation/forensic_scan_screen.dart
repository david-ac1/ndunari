import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';

/// Forensic scan screen
/// AR-style scanning interface for drug authentication
/// Reference: UI-doc.md Section 4.1
class ForensicScanScreen extends StatelessWidget {
  const ForensicScanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera background simulation
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 1.0,
                colors: [
                  Color(0xFF2A2A2A),
                  Color(0xFF000000),
                ],
              ),
            ),
          ),
          
          // Top gradient overlay
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 150,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0x99000000),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          // Bottom gradient overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 250,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Color(0xCC000000),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          // Top header
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => context.pop(),
                      ),
                      Expanded(
                        child: Center(
                          child: RichText(
                            text: TextSpan(
                              text: 'NDUNARI ',
                              style: AppTypography.bodyLarge.copyWith(
                                color: Colors.white.withOpacity(0.9),
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                              ),
                              children: [
                                TextSpan(
                                  text: 'SCAN',
                                  style: TextStyle(
                                    color: AppColors.primaryDeepForestGreen,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.flash_off, color: Colors.white),
                        onPressed: () {},
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          
          // Central scanning reticle
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // AR tooltip above
                _ARTooltip(
                  icon: Icons.verified_user,
                  status: 'Verified',
                  message: 'Safety Seal Intact',
                  color: AppColors.primaryDeepForestGreen,
                  showConnector: true,
                ),
                
                const SizedBox(height: 40),
                
                // Scanning frame
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Main frame container
                    Container(
                      width: 280,
                      height: 280,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.1),
                          width: 1,
                        ),
                      ),
                    ),
                    
                    // Corner brackets
                    SizedBox(
                      width: 280,
                      height: 280,
                      child: Stack(
                        children: [
                          // Top-left
                          Positioned(
                            top: -2,
                            left: -2,
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                border: Border(
                                  top: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                  left: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                ),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(16),
                                ),
                              ),
                            ),
                          ),
                          // Top-right
                          Positioned(
                            top: -2,
                            right: -2,
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                border: Border(
                                  top: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                  right: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                ),
                                borderRadius: const BorderRadius.only(
                                  topRight: Radius.circular(16),
                                ),
                              ),
                            ),
                          ),
                          // Bottom-left
                          Positioned(
                            bottom: -2,
                            left: -2,
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                border: Border(
                                  bottom: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                  left: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                ),
                                borderRadius: const BorderRadius.only(
                                  bottomLeft: Radius.circular(16),
                                ),
                              ),
                            ),
                          ),
                          // Bottom-right
                          Positioned(
                            bottom: -2,
                            right: -2,
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                border: Border(
                                  bottom: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                  right: BorderSide(
                                    color: AppColors.primaryDeepForestGreen,
                                    width: AppSpacing.forensicBorderWidth,
                                  ),
                                ),
                                borderRadius: const BorderRadius.only(
                                  bottomRight: Radius.circular(16),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Scanning line
                    Container(
                      width: 240,
                      height: 2,
                      decoration: BoxDecoration(
                        color: AppColors.primaryDeepForestGreen,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryDeepForestGreen.withOpacity(0.8),
                            blurRadius: 15,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 40),
                
                // AR tooltip below
                _ARTooltip(
                  icon: Icons.sync,
                  status: 'Processing',
                  message: 'Checking NAFDAC...',
                  color: AppColors.warningWatchOrange,
                  showConnector: false,
                  isProcessing: true,
                ),
              ],
            ),
          ),
          
          // Bottom controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Column(
                children: [
                  // Instruction text
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    margin: const EdgeInsets.only(bottom: 32),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.1),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.center_focus_strong,
                          color: Colors.white,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Align the medication box within the frame',
                          style: AppTypography.bodyRegular.copyWith(
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Camera controls
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // History button
                        _ControlButton(
                          icon: Icons.history,
                          label: 'History',
                          onTap: () {},
                        ),
                        
                        // Capture button
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white,
                              width: 3,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryDeepForestGreen.withOpacity(0.3),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Material(
                            color: AppColors.primaryDeepForestGreen,
                            shape: const CircleBorder(),
                            child: InkWell(
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Scanning... Camera integration pending'),
                                  ),
                                );
                              },
                              customBorder: const CircleBorder(),
                              child: const Icon(
                                Icons.qr_code_scanner,
                                color: Colors.white,
                                size: 36,
                              ),
                            ),
                          ),
                        ),
                        
                        // Manual button
                        _ControlButton(
                          icon: Icons.keyboard,
                          label: 'Manual',
                          onTap: () {},
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Mode indicator
                  TextButton(
                    onPressed: () {},
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'FORENSIC SCAN MODE',
                          style: AppTypography.caption.copyWith(
                            color: Colors.white.withOpacity(0.5),
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const Icon(
                          Icons.expand_less,
                          color: Colors.white38,
                          size: 14,
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// AR tooltip widget
class _ARTooltip extends StatelessWidget {
  final IconData icon;
  final String status;
  final String message;
  final Color color;
  final bool showConnector;
  final bool isProcessing;

  const _ARTooltip({
    required this.icon,
    required this.status,
    required this.message,
    required this.color,
    this.showConnector = false,
    this.isProcessing = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                status.toUpperCase(),
                style: AppTypography.caption.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              Text(
                message,
                style: AppTypography.bodyRegular.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Control button widget
class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.4),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withOpacity(0.1),
                width: 1,
              ),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: Colors.white.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}
