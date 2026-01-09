import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/forensic/presentation/forensic_scan_screen.dart';
import '../../features/stewardship/presentation/stewardship_screen.dart';
import '../../features/history/presentation/history_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import 'route_paths.dart';

/// GoRouter configuration for Ndunari app
/// Provides type-safe navigation with deep linking support
class AppRouter {
  // Private constructor to prevent instantiation
  AppRouter._();

  /// Global router configuration
  static final GoRouter router = GoRouter(
    initialLocation: RoutePaths.home,
    debugLogDiagnostics: true,
    routes: [
      // ========== Home Route ==========
      GoRoute(
        path: RoutePaths.home,
        name: RoutePaths.homeRoute,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const HomeScreen(),
        ),
      ),

      // ========== Forensic Scan Route ==========
      GoRoute(
        path: RoutePaths.forensicScan,
        name: RoutePaths.forensicScanRoute,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const ForensicScanScreen(),
        ),
      ),

      // ========== Stewardship Route ==========
      GoRoute(
        path: RoutePaths.stewardship,
        name: RoutePaths.stewardshipRoute,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const StewardshipScreen(),
        ),
      ),

      // ========== History Route ==========
      GoRoute(
        path: RoutePaths.history,
        name: RoutePaths.historyRoute,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const HistoryScreen(),
        ),
      ),

      // ========== Profile Route ==========
      GoRoute(
        path: RoutePaths.profile,
        name: RoutePaths.profileRoute,
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const ProfileScreen(),
        ),
      ),
    ],
    
    // ========== Error Handling ==========
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(
        title: const Text('Page Not Found'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page not found: ${state.uri.path}',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(RoutePaths.home),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
}
