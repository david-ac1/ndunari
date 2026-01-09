import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    // Handle missing .env file gracefully
    debugPrint('Warning: .env file not found. Using defaults.');
  }
  
  runApp(
    const ProviderScope(
      child: NdunariApp(),
    ),
  );
}

/// Main Ndunari application widget
class NdunariApp extends StatelessWidget {
  const NdunariApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Ndunari - Medical Safety AI',
      debugShowCheckedModeBanner: false,
      
      // Theme configuration
      theme: AppTheme.lightTheme,
      
      // Router configuration
      routerConfig: AppRouter.router,
    );
  }
}
