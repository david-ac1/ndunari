import 'dart:ui';
import 'package:flutter/material.dart';

/// Glassmorphic panel widget
/// Implements backdrop blur with semi-transparent background
class GlassPanel extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final Color? backgroundColor;
  final Color? borderColor;
  final EdgeInsetsGeometry? padding;

  const GlassPanel({
    super.key,
    required this.child,
    this.borderRadius = 16.0,
    this.backgroundColor,
    this.borderColor,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: backgroundColor ?? Colors.white.withOpacity(0.7),
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: borderColor ?? Colors.white.withOpacity(0.6),
              width: 1,
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
