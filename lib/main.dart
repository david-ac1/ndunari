import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'providers/scan_result_provider.dart';
import 'providers/stewardship_provider.dart';
import 'providers/user_provider.dart';
import 'providers/connectivity_provider.dart';
import 'providers/voice_guide_provider.dart';

Future<void> main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  await dotenv.load(fileName: ".env");
  
  runApp(const NdunariApp());
}

class NdunariApp extends StatelessWidget {
  const NdunariApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ScanResultProvider()),
        ChangeNotifierProvider(create: (_) => StewardshipProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProvider(create: (_) => VoiceGuideProvider()),
      ],
      child: MaterialApp(
        title: 'Ndunari',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const HomeScreen(),
      ),
    );
  }
}
