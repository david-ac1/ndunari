"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Link from "next/link";
import { saveScanToHistory, getScanHistory, deleteScanFromHistory, type ScanHistoryItem } from "@/lib/utils/scan-history";
import { type ScanMode, type AngleType, createScanSession, type MultiAngleScanSession, SCAN_ANGLES, getNextAngle, isSessionComplete } from "@/lib/utils/scan-angles";
import ScanModeSelector from "./components/ScanModeSelector";
import MultiAngleCapture from "./components/MultiAngleCapture";
import CapturedImageReview from "./components/CapturedImageReview";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { saveScan } from "@/lib/services/scan-storage.service";

type ScanState = "mode_select" | "idle" | "multi_angle" | "review" | "scanning" | "analyzing" | "complete" | "error";

interface ScanResult {
    forensic: {
        authenticityScore: number;
        drugName: string;
        nafdacNumber?: string;
        riskLevel: "safe" | "suspicious" | "counterfeit";
        findings: string[];
        thoughtProcess: string[];
    };
    stewardship?: {
        awareCategory: string;
        riskLevel: string;
        recommendations: string[];
    };
    escalated: boolean;
    processingTime: number;
    scanMode?: ScanMode;
    anglesScanned?: number;
}

export default function ScanPage() {
    const { user } = useAuth();
    const { speak, stop, speaking } = useVoiceGuide();
    const [scanState, setScanState] = useState<ScanState>("mode_select");
    const [scanMode, setScanMode] = useState<ScanMode | null>(null);
    const [multiAngleSession, setMultiAngleSession] = useState<MultiAngleScanSession | null>(null);
    const [currentThought, setCurrentThought] = useState("");
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReadScanResults = () => {
        if (!result) return;
        const statusText = result.forensic.riskLevel === 'safe' ? 'is verified as safe' :
            result.forensic.riskLevel === 'suspicious' ? 'is suspicious and requires manual verification' :
                'is a suspected counterfeit';

        let text = `${result.forensic.drugName} ${statusText}. Our findings include: `;
        result.forensic.findings.forEach(f => text += `${f}. `);
        speak(text);
    };

    // High quality video constraints
    const videoConstraints = {
        width: { ideal: 4096 },
        height: { ideal: 2160 },
        facingMode: "environment",
        aspectRatio: 16 / 9,
    };

    // Handle mode selection
    const handleModeSelect = useCallback((mode: ScanMode) => {
        setScanMode(mode);

        if (mode === 'multi') {
            const session = createScanSession(mode);
            setMultiAngleSession(session);
            setScanState('multi_angle');
        } else {
            setScanState('idle');
        }
    }, []);

    // Handle multi-angle capture
    const handleAngleCapture = useCallback((angle: AngleType, imageData: string) => {
        if (!multiAngleSession) return;

        // Add captured angle to session
        multiAngleSession.capturedAngles.set(angle, imageData);
        multiAngleSession.completedCount += 1;

        // Get next angle
        const nextAngle = getNextAngle(multiAngleSession);
        multiAngleSession.currentAngle = nextAngle;

        setMultiAngleSession({ ...multiAngleSession });
    }, [multiAngleSession]);

    // Complete multi-angle capture - go to review
    const handleMultiAngleComplete = useCallback(() => {
        if (!multiAngleSession) return;

        // Check if all required angles are captured
        if (isSessionComplete(multiAngleSession)) {
            setScanState('review');
        }
    }, [multiAngleSession]);

    // Handle retake from review screen
    const handleRetake = useCallback((angle: AngleType) => {
        if (!multiAngleSession) return;

        // Remove the captured image
        multiAngleSession.capturedAngles.delete(angle);
        multiAngleSession.completedCount -= 1;
        multiAngleSession.currentAngle = angle;

        setMultiAngleSession({ ...multiAngleSession });
        setScanState('multi_angle');
    }, [multiAngleSession]);

    // Analyze multi-angle images
    const handleAnalyzeMultiAngle = useCallback(async () => {
        if (!multiAngleSession) return;

        setScanState('analyzing');
        setCurrentThought('Analyzing all captured angles...');

        try {
            // Create FormData with all captured angles
            const formData = new FormData();
            formData.append('mode', 'multi');

            // Convert all base64 images to blobs sequentially
            const blobPromises: Promise<void>[] = [];
            multiAngleSession.capturedAngles.forEach((imageData, angleType) => {
                const promise = fetch(imageData)
                    .then(res => res.blob())
                    .then(blob => {
                        formData.append(angleType, blob, `${angleType}.jpg`);
                    });
                blobPromises.push(promise);
            });

            // Wait for all conversions
            await Promise.all(blobPromises);

            // Call API
            const apiResponse = await fetch('/api/scan', {
                method: 'POST',
                body: formData,
            });

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                const errorMessage = data.error || data.message || 'Scan failed';
                throw new Error(errorMessage);
            }

            setResult({
                ...data.data,
                scanMode: 'multi',
                anglesScanned: multiAngleSession.completedCount,
            });
            setScanState('complete');
            setCurrentThought('');

            // Save to history (Legacy localStorage)
            const historyItem: ScanHistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                drugName: data.data.forensic.drugName,
                authenticityScore: data.data.forensic.authenticityScore,
                riskLevel: data.data.forensic.riskLevel,
                nafdacNumber: data.data.forensic.nafdacNumber,
                imagePreview: Array.from(multiAngleSession.capturedAngles.values())[0]?.substring(0, 10000),
            };
            saveScanToHistory(historyItem);

            // Save to Supabase (Cloud Storage)
            if (user) {
                await saveScan({
                    drugName: data.data.forensic.drugName,
                    nafdacNumber: data.data.forensic.nafdacNumber,
                    authenticityScore: data.data.forensic.authenticityScore,
                    riskLevel: data.data.forensic.riskLevel,
                    findings: data.data.forensic.findings,
                    scanMode: 'multi',
                    anglesScanned: multiAngleSession.completedCount,
                    imagePreview: Array.from(multiAngleSession.capturedAngles.values())[0],
                });
            }
        } catch (err) {
            console.error('Scan error:', err);
            setError(err instanceof Error ? err.message : 'Scan failed');
            setScanState('error');
            setCurrentThought('');
        }
    }, [multiAngleSession]);

    // Process single scan (works for both camera capture and file upload)
    const processScan = useCallback(async (imageSource: string | Blob) => {
        setScanState('scanning');
        setCurrentThought('Capturing package image...');
        setError(null);

        setTimeout(() => setCurrentThought('Analyzing hologram structure...'), 800);
        setTimeout(() => setCurrentThought('Checking NAFDAC number format...'), 1600);
        setTimeout(() => setCurrentThought('Validating security features...'), 2400);

        try {
            let blob: Blob;
            let imagePreview: string = '';

            if (typeof imageSource === 'string') {
                const response = await fetch(imageSource);
                blob = await response.blob();
                imagePreview = imageSource;
            } else {
                blob = imageSource;
                imagePreview = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            const formData = new FormData();
            formData.append('image', blob, 'scan.jpg');
            formData.append('mode', 'single');

            setScanState('analyzing');
            setCurrentThought('Running Gemini forensic analysis...');

            const apiResponse = await fetch('/api/scan', {
                method: 'POST',
                body: formData,
            });

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                const errorMessage = data.error || data.message || 'Scan failed';
                throw new Error(errorMessage);
            }

            setResult({
                ...data.data,
                scanMode: 'single',
                anglesScanned: 1,
            });
            setScanState('complete');
            setCurrentThought('');

            const historyItem: ScanHistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                drugName: data.data.forensic.drugName,
                authenticityScore: data.data.forensic.authenticityScore,
                riskLevel: data.data.forensic.riskLevel,
                nafdacNumber: data.data.forensic.nafdacNumber,
                imagePreview: imagePreview.substring(0, 10000),
            };
            saveScanToHistory(historyItem);

            // Save to Supabase (Cloud Storage)
            if (user) {
                await saveScan({
                    drugName: data.data.forensic.drugName,
                    nafdacNumber: data.data.forensic.nafdacNumber,
                    authenticityScore: data.data.forensic.authenticityScore,
                    riskLevel: data.data.forensic.riskLevel,
                    findings: data.data.forensic.findings,
                    scanMode: 'single',
                    anglesScanned: 1,
                    imagePreview: imagePreview,
                });
            }
        } catch (err) {
            console.error('Scan error:', err);
            setError(err instanceof Error ? err.message : 'Scan failed');
            setScanState('error');
            setCurrentThought('');
        }
    }, []);

    // Capture image from camera (single mode only)
    const captureImage = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot({
            width: 1920,
            height: 1080,
        });
        if (!imageSrc) {
            setError('Failed to capture image');
            setScanState('error');
            return;
        }
        await processScan(imageSrc);
    }, [processScan]);

    // Handle file upload
    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            setScanState('error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Image file too large. Maximum size is 10MB');
            setScanState('error');
            return;
        }

        processScan(file);
    }, [processScan]);

    const loadHistory = useCallback(() => {
        const history = getScanHistory();
        setScanHistory(history);
        setShowHistory(true);
    }, []);

    const handleDeleteScan = useCallback((scanId: string) => {
        deleteScanFromHistory(scanId);
        const history = getScanHistory();
        setScanHistory(history);
    }, []);

    const resetScan = () => {
        setScanState('mode_select');
        setScanMode(null);
        setMultiAngleSession(null);
        setResult(null);
        setError(null);
        setCurrentThought('');
    };

    // Render mode selector
    if (scanState === 'mode_select') {
        return <ScanModeSelector onSelectMode={handleModeSelect} />;
    }

    // Render multi-angle capture
    if (scanState === 'multi_angle' && multiAngleSession) {
        return (
            <MultiAngleCapture
                session={multiAngleSession}
                onCaptureAngle={handleAngleCapture}
                onComplete={handleMultiAngleComplete}
                onCancel={resetScan}
            />
        );
    }

    // Render review screen
    if (scanState === 'review' && multiAngleSession) {
        return (
            <CapturedImageReview
                capturedImages={multiAngleSession.capturedAngles}
                onRetake={handleRetake}
                onProceed={handleAnalyzeMultiAngle}
                onCancel={resetScan}
            />
        );
    }

    // Render single image scanner (existing UI)
    return (
        <div className="relative min-h-screen w-full bg-background-dark overflow-hidden">

            {/* Camera Viewport */}
            <div className="absolute inset-0 z-0">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
            </div>

            {/* Top Header */}
            <header className="absolute top-0 left-0 w-full z-30 pt-safe-top">
                <div className="flex items-center justify-between px-6 py-4 glass-panel mx-4 mt-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                    <button
                        onClick={resetScan}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        <span className="text-2xl">←</span>
                    </button>
                    <h1 className="text-base font-bold tracking-wide text-white uppercase opacity-90">
                        Ndunari <span className="text-primary font-extrabold">Quick Scan</span>
                    </h1>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white">
                        <span className="text-2xl">💡</span>
                    </button>
                </div>
            </header>

            {/* Central Scanning Reticle - LARGER */}
            <main className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="relative w-[90vw] max-w-2xl aspect-[4/3] border border-white/10 rounded-3xl bg-white/5 shadow-2xl backdrop-blur-[2px]">

                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-[4px] border-l-[4px] border-primary rounded-tl-2xl -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-[4px] border-r-[4px] border-primary rounded-tr-2xl -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[4px] border-l-[4px] border-primary rounded-bl-2xl -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[4px] border-r-[4px] border-primary rounded-br-2xl -mb-0.5 -mr-0.5" />

                    {/* Scanning Line */}
                    {scanState === 'scanning' && (
                        <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-primary/80 shadow-[0_0_15px_rgba(75,184,20,0.8)] animate-pulse" />
                    )}

                    {/* Status Indicator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                        {scanState === 'idle' && (
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                                    <span className="text-5xl">📷</span>
                                </div>
                                <p className="text-white/90 text-base font-medium">Ready to scan</p>
                                <p className="text-watch-orange text-sm mt-1">Max 70% confidence</p>
                            </div>
                        )}
                        {(scanState === 'scanning' || scanState === 'analyzing') && (
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2 animate-pulse">
                                    <span className="text-5xl">🔄</span>
                                </div>
                                <p className="text-primary text-base font-medium animate-pulse">Analyzing...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Thought Signature */}
                {currentThought && (
                    <div className="mt-8 pointer-events-auto">
                        <div className="glass-panel px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-primary/30">
                            <p className="text-white/90 text-sm font-medium italic flex items-center gap-2">
                                <span className="animate-pulse">💭</span>
                                {currentThought}
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Controls */}
            <footer className="absolute bottom-0 left-0 w-full z-30 pb-10 pt-6 px-6 flex flex-col items-center">

                {/* Instruction Text */}
                {scanState === 'idle' && (
                    <div className="mb-8 text-center">
                        <p className="text-white/90 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 inline-flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            Align the medication box within the frame
                        </p>
                    </div>
                )}

                {/* Camera Controls */}
                <div className="flex items-center justify-between w-full max-w-sm gap-8">

                    {/* History Button */}
                    <button onClick={loadHistory} className="flex flex-col items-center gap-1 group">
                        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                            <span className="text-2xl">📁</span>
                        </div>
                        <span className="text-xs font-medium text-white/70">History</span>
                    </button>

                    {/* Primary Capture Button */}
                    <button
                        onClick={scanState === 'idle' ? captureImage : resetScan}
                        disabled={scanState === 'scanning' || scanState === 'analyzing'}
                        className="relative group cursor-pointer transform active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute -inset-1 bg-primary/30 rounded-full blur-md group-hover:bg-primary/50 transition-all" />

                        <div className="w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center relative z-10">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-inner">
                                {scanState === 'complete' || scanState === 'error' ? (
                                    <span className="text-white text-3xl">↻</span>
                                ) : (
                                    <span className="text-white text-3xl">📷</span>
                                )}
                            </div>
                        </div>
                    </button>

                    {/* Manual Upload Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                            <span className="text-2xl">📂</span>
                        </div>
                        <span className="text-xs font-medium text-white/70">Upload</span>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>

                {/* Mode Indicator */}
                <div className="mt-6">
                    <button className="text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white transition-colors flex items-center gap-1">
                        Quick Scan Mode (Max 70%)
                    </button>
                </div>
            </footer>

            {/* Results Modal - same as before but shortened for brevity */}
            {scanState === 'complete' && result && (
                <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-forest-green dark:text-white">
                                    Scan Results
                                </h2>
                                <button
                                    onClick={() => speaking ? stop() : handleReadScanResults()}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${speaking ? 'bg-primary animate-pulse text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                    title="Read Results"
                                >
                                    {speaking ? '⏹️' : '🔊'}
                                </button>
                            </div>
                            <button
                                onClick={resetScan}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>

                        {/* Scan Mode Warning */}
                        {result.scanMode === 'single' && (
                            <div className="p-4 bg-watch-orange/10 border border-watch-orange rounded-xl">
                                <p className="text-sm font-bold text-watch-orange flex items-center gap-2">
                                    <span>⚠️</span> Single Image Scan - Limited Verification
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    For comprehensive authentication (up to 100% confidence), use 3D Multi-Angle Scan on your next scan.
                                </p>
                            </div>
                        )}

                        {/* Authenticity Score */}
                        <div className={`p-6 rounded-xl ${result.forensic.riskLevel === 'safe' ? 'bg-access-green/10 border-2 border-access-green' :
                            result.forensic.riskLevel === 'suspicious' ? 'bg-watch-orange/10 border-2 border-watch-orange' :
                                'bg-reserve-red/10 border-2 border-reserve-red'
                            }`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium opacity-70">Authenticity Score</p>
                                    <p className="text-4xl font-bold">{result.forensic.authenticityScore}%</p>
                                </div>
                                <div className="text-5xl">
                                    {result.forensic.riskLevel === 'safe' ? '✅' :
                                        result.forensic.riskLevel === 'suspicious' ? '⚠️' : '❌'}
                                </div>
                            </div>
                            <p className="font-bold text-lg uppercase">
                                {result.forensic.riskLevel === 'safe' ? 'VERIFIED SAFE' :
                                    result.forensic.riskLevel === 'suspicious' ? 'SUSPICIOUS - REQUIRES VERIFICATION' :
                                        'COUNTERFEIT DETECTED'}
                            </p>
                        </div>

                        {/* Drug Information - same as before */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg">Drug Information</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-xs opacity-70 mb-1">Drug Name</p>
                                    <p className="font-bold">{result.forensic.drugName}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-xs opacity-70 mb-1">NAFDAC Number</p>
                                    <p className="font-bold">{result.forensic.nafdacNumber || 'Not Found'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Findings */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">Forensic Findings</h3>
                            <ul className="space-y-2">
                                {result.forensic.findings.map((finding, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={resetScan}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                            >
                                Scan Another
                            </button>
                            <Link
                                href="/"
                                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-center rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State - same as before */}
            {scanState === 'error' && (
                <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 text-center space-y-4">
                        <span className="text-6xl">
                            {error?.toLowerCase().includes('not a valid drug package') ? '🚫' :
                                error?.toLowerCase().includes('rate limit') || error?.toLowerCase().includes('quota') ? '⏱️' :
                                    '❌'}
                        </span>

                        <h2 className="text-2xl font-bold text-reserve-red">
                            {error?.toLowerCase().includes('not a valid drug package') ? 'Invalid Image' :
                                error?.toLowerCase().includes('rate limit') || error?.toLowerCase().includes('quota') ? 'Rate Limit Reached' :
                                    'Scan Failed'}
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {error || 'An unknown error occurred'}
                        </p>

                        <button
                            onClick={resetScan}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* History Modal - same as before, abbreviated here */}
            {showHistory && (
                <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6 overflow-y-auto">
                    {/* History UI same as before */}
                    <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <h2 className="text-2xl font-bold">Scan History</h2>
                            <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <span>✕</span>
                            </button>
                        </div>
                        {scanHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="text-6xl">📭</span>
                                <p className="mt-4 text-gray-500">No scan history yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mt-4">
                                {scanHistory.map((scan) => (
                                    <div key={scan.id} className="flex items-center gap-4 p-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-700">
                                        {scan.imagePreview && (
                                            <img src={scan.imagePreview} alt={scan.drugName} className="w-16 h-16 rounded-lg object-cover" />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold">{scan.drugName}</h3>
                                            <p className="text-sm text-gray-600">Score: {scan.authenticityScore}%</p>
                                        </div>
                                        <button onClick={() => handleDeleteScan(scan.id)} className="w-8 h-8 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                                            <span>🗑️</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
