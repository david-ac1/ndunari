import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:typed_data';
import '../theme/app_colors.dart';
import '../providers/scan_result_provider.dart';

/// Forensic Scan screen for capturing and analyzing drug packages
class ForensicScanScreen extends StatefulWidget {
  const ForensicScanScreen({super.key});

  @override
  State<ForensicScanScreen> createState() => _ForensicScanScreenState();
}

class _ForensicScanScreenState extends State<ForensicScanScreen> {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isFlashOn = false;
  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        _cameraController = CameraController(
          _cameras![0],
          ResolutionPreset.high,
          enableAudio: false,
        );
        
        await _cameraController!.initialize();
        
        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
        }
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      if (mounted) {
        setState(() {
          _isInitialized = false;
        });
      }
    }
  }

  Future<void> _toggleFlash() async {
    if (_cameraController != null && _isInitialized) {
      setState(() {
        _isFlashOn = !_isFlashOn;
      });
      await _cameraController!.setFlashMode(
        _isFlashOn ? FlashMode.torch : FlashMode.off,
      );
    }
  }

  /// Get current GPS location
  Future<String> _getLocation() async {
    try {
      // Check location permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return 'Unknown Location';
        }
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      return '${position.latitude},${position.longitude}';
    } catch (e) {
      debugPrint('Error getting location: $e');
      return 'Unknown Location';
    }
  }

  Future<void> _captureImage() async {
    if (_cameraController != null && _isInitialized) {
      try {
        final XFile image = await _cameraController!.takePicture();
        await _processImage(image);
      } catch (e) {
        debugPrint('Error capturing image: $e');
        _showError('Failed to capture image: $e');
      }
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
      );
      
      if (image != null) {
        await _processImage(image);
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      _showError('Failed to pick image: $e');
    }
  }

  /// Process image with Gemini API
  Future<void> _processImage(XFile image) async {
    try {
      // Get location
      final location = await _getLocation();

      // Convert image to bytes
      final Uint8List imageBytes = await image.readAsBytes();

      // Call Gemini API via provider
      final provider = Provider.of<ScanResultProvider>(context, listen: false);
      await provider.scanImage(imageBytes, location);
    } catch (e) {
      debugPrint('Error processing image: $e');
      _showError('Analysis failed: $e');
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ScanResultProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          backgroundColor: Colors.black,
          body: Stack(
            children: [
              // Camera Preview
              if (_isInitialized && _cameraController != null)
                Positioned.fill(
                  child: CameraPreview(_cameraController!),
                )
              else
                _buildCameraPlaceholder(),

              // Top Bar (Back button and Flash)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Back button
                        IconButton(
                          icon: const Icon(
                            Icons.arrow_back,
                            color: Colors.white,
                            size: 28,
                          ),
                          onPressed: () {
                            provider.clearResult();
                            Navigator.pop(context);
                          },
                        ),
                        // Flash toggle
                        if (_isInitialized)
                          IconButton(
                            icon: Icon(
                              _isFlashOn ? Icons.flash_on : Icons.flash_off,
                              color: Colors.white,
                              size: 28,
                            ),
                            onPressed: _toggleFlash,
                          ),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom Controls
              if (!provider.isLoading && provider.currentResult == null)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          // Gallery picker button
                          IconButton(
                            icon: const Icon(
                              Icons.photo_library,
                              color: Colors.white,
                              size: 32,
                            ),
                            onPressed: _pickFromGallery,
                          ),
                          
                          // Capture button
                          GestureDetector(
                            onTap: _captureImage,
                            child: Container(
                              width: 70,
                              height: 70,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 4,
                                ),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(4.0),
                                child: Container(
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.camera_alt,
                                    color: Colors.white,
                                    size: 32,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          
                          // Spacer for symmetry
                          const SizedBox(width: 32),
                        ],
                      ),
                    ),
                  ),
                ),

              // Loading Overlay
              if (provider.isLoading)
                Positioned.fill(
                  child: Container(
                    color: Colors.black.withOpacity(0.8),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const CircularProgressIndicator(
                            color: AppColors.primary,
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Analyzing package...',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Using Gemini 3 Flash forensic analysis',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // Analysis Results Overlay
              if (provider.currentResult != null)
                Positioned.fill(
                  child: _buildResultsOverlay(provider),
                ),

              // Error display
              if (provider.error != null && !provider.isLoading)
                Positioned(
                  top: 100,
                  left: 20,
                  right: 20,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Error: ${provider.error}',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCameraPlaceholder() {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.camera_alt_outlined,
              size: 80,
              color: Colors.white54,
            ),
            const SizedBox(height: 16),
            Text(
              'Camera not available',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Camera may not be available on this device',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white70,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsOverlay(ScanResultProvider provider) {
    final result = provider.currentResult!;
    
    // Determine gradient based on authenticity
    final gradient = result.isAuthentic
        ? AppColors.primaryGradient
        : AppColors.dangerGradient;
    
    final icon = result.isAuthentic
        ? Icons.verified
        : Icons.warning;
    
    return Container(
      color: Colors.black.withOpacity(0.9),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Close button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Analysis Results',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      provider.clearResult();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 32),
              
              // Authenticity Score
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: gradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Icon(
                      icon,
                      size: 64,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '${result.authenticityScore.toStringAsFixed(0)}% ${result.statusText}',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      result.isAuthentic
                          ? 'This medication appears genuine'
                          : 'WARNING: Potential counterfeit detected',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),

              // Findings
              if (result.findings.isNotEmpty)
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Findings:',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...result.findings.map((finding) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.circle,
                                size: 8,
                                color: Colors.white70,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  finding,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                )
              else
                const Spacer(),
              
              // NAFDAC Verification
              if (result.batchNumber != null)
                _buildInfoCard(
                  'NAFDAC Registration',
                  result.nafdacVerified ? 'VERIFIED' : 'NOT VERIFIED',
                  Icons.check_circle,
                  result.nafdacVerified ? AppColors.success : AppColors.warning,
                ),
              
              const SizedBox(height: 16),
              
              // Batch Details
              if (result.batchNumber != null)
                _buildInfoCard(
                  'Batch Number',
                  result.batchNumber!,
                  Icons.qr_code,
                  AppColors.secondary,
                ),
              
              const SizedBox(height: 16),
              
              // Location
              _buildInfoCard(
                'Scanned Location',
                result.location,
                Icons.location_on,
                AppColors.info,
              ),
              
              const SizedBox(height: 24),
              
              // Action buttons
              ElevatedButton(
                onPressed: () {
                  provider.clearResult();
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  backgroundColor: AppColors.primary,
                ),
                child: const Text('Done'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
