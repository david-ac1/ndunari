"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { saveScanToHistory, getScanHistory, deleteScanFromHistory, type ScanHistoryItem } from "@/lib/utils/scan-history";
import { type ScanMode, type AngleType, createScanSession, type MultiAngleScanSession, SCAN_ANGLES, getNextAngle, isSessionComplete, isMinimumSessionComplete, isOptimalSessionComplete } from "@/lib/utils/scan-angles";
import ScanModeSelector from "./components/ScanModeSelector";
import MultiAngleCapture from "./components/MultiAngleCapture";
import CapturedImageReview from "./components/CapturedImageReview";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { useScanData } from "@/lib/contexts/ScanDataContext";
import { forensicEyeService, type EvidenceBox } from "@/lib/gemini/forensic-eye.service";
import { sentinelAgentService } from "@/lib/gemini/sentinel-agent.service";
import { ThinkingPanel } from "@/app/components/ThinkingPanel";
import ForensicEvidenceOverlay from "./components/ForensicEvidenceOverlay";
import { normalizeError, getUserMessage, logError } from "@/lib/errors/app-errors";
import {
    Camera,
    Search,
    AlertTriangle,
    BarChart2,
    CheckCircle,
    ScanLine,
    Info,
    Zap,
    Upload,
    History,
    ArrowLeft,
    Settings,
    Shield,
    Plus,
    Minus,
    FileText
} from "lucide-react";

type ScanState = "mode_select" | "idle" | "multi_angle" | "review" | "scanning" | "analyzing" | "analyzing_upload" | "upload_pending" | "complete" | "error";

interface ScanResult {
    forensic: {
        authenticityScore: number;
        drugName: string;
        nafdacNumber?: string;
        riskLevel: "safe" | "suspicious" | "counterfeit";
        findings: string[];
        thoughtProcess: string[];
        evidenceBoxes?: EvidenceBox[];
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
    const { speak, stop, speaking, enabled } = useVoiceGuide();
    const { refreshScans } = useScanData();
    const [scanState, setScanState] = useState<ScanState>("mode_select");
    const [scanMode, setScanMode] = useState<ScanMode | null>(null);
    const [multiAngleSession, setMultiAngleSession] = useState<MultiAngleScanSession | null>(null);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const [thoughts, setThoughts] = useState<{ id: string, text: string, level: 'forensic' | 'sentinel' | 'system', timestamp: Date }[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isGuiding, setIsGuiding] = useState(false);
    const [lastScanPreview, setLastScanPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    // Capture Location on Mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (err) => console.log("Geolocation skipped:", err),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }, []);

    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handlers
    const handleReadScanResults = useCallback(() => {
        if (!result) return;
        const statusText = result.forensic.riskLevel === 'safe' ? 'is verified as safe' :
            result.forensic.riskLevel === 'suspicious' ? 'is suspicious and requires manual verification' :
                'is a suspected counterfeit';

        let text = `${result.forensic.drugName} ${statusText}. Our findings include: `;
        result.forensic.findings.forEach(f => text += `${f}. `);
        speak(text);
    }, [result, speak]);

    // Auto-read results
    useEffect(() => {
        if (scanState === 'complete' && result && enabled) {
            handleReadScanResults();
        }
    }, [scanState, result, enabled, handleReadScanResults]);

    // Live Guidance Loop (Action Era)
    useEffect(() => {
        const isCameraActive = scanState === 'idle';

        if (isCameraActive) {
            const addThought = (text: string, level: 'forensic' | 'sentinel' | 'system' = 'system') => {
                setThoughts(prev => [...prev, { id: Math.random().toString(), text, level, timestamp: new Date() }]);
            };

            const interval = setInterval(async () => {
                const screenshot = webcamRef.current?.getScreenshot();
                if (screenshot) {
                    setIsGuiding(true);
                    const guidance = await sentinelAgentService.generateLiveGuidance(screenshot);
                    addThought(guidance, 'sentinel');
                    if (enabled) speak(guidance);
                    setTimeout(() => setIsGuiding(false), 800);
                }
            }, 4000);

            return () => clearInterval(interval);
        } else {
            setIsGuiding(false);
        }
    }, [scanState, scanMode, multiAngleSession, enabled, speak, webcamRef, setIsGuiding]);

    // Initial thoughts on mount
    useEffect(() => {
        setThoughts([
            { id: '1', text: "Sentinel connection established.", level: 'system', timestamp: new Date() },
            { id: '2', text: "Monitoring supply chain anomalies in real-time...", level: 'sentinel', timestamp: new Date() }
        ]);
    }, []);

    const videoConstraints = {
        width: { ideal: 4096 },
        height: { ideal: 2160 },
        facingMode: "environment",
        aspectRatio: 16 / 9,
    };

    const handleModeSelect = useCallback((mode: ScanMode) => {
        setScanMode(mode);
        if (mode === 'multi') {
            setMultiAngleSession(createScanSession(mode));
            setScanState('multi_angle');
        } else {
            setScanState('upload_pending');
            setThoughts(prev => [...prev, { id: Date.now().toString(), text: "Ready for National Ledger upload. Please select a high-contrast forensic specimen.", level: 'system', timestamp: new Date() }]);
        }
    }, []);

    const handleAngleCapture = useCallback((angle: AngleType, imageData: string) => {
        if (!multiAngleSession) return;
        multiAngleSession.capturedAngles.set(angle, imageData);
        multiAngleSession.completedCount += 1;
        multiAngleSession.currentAngle = getNextAngle(multiAngleSession);
        setMultiAngleSession({ ...multiAngleSession });
    }, [multiAngleSession]);

    const handleMultiAngleComplete = useCallback(() => {
        if (multiAngleSession && isMinimumSessionComplete(multiAngleSession)) {
            setScanState('review');
        }
    }, [multiAngleSession]);

    const handleRetake = useCallback((angle: AngleType) => {
        if (!multiAngleSession) return;
        multiAngleSession.capturedAngles.delete(angle);
        multiAngleSession.completedCount -= 1;
        multiAngleSession.currentAngle = angle;
        setMultiAngleSession({ ...multiAngleSession });
        setScanState('multi_angle');
    }, [multiAngleSession]);

    const resetScan = () => {
        setScanState('mode_select');
        setScanMode(null);
        setMultiAngleSession(null);
        setResult(null);
        setError(null);
        setIsThinking(false);
        setLastScanPreview(null);
    };

    const handleAnalyzeMultiAngle = useCallback(async () => {
        if (!multiAngleSession) return;
        setScanState('analyzing');
        setIsThinking(true);
        setThoughts(prev => [...prev, { id: Date.now().toString(), text: "Escalating multi-angle forensics to thinking brain...", level: 'forensic', timestamp: new Date() }]);

        try {
            const formData = new FormData();
            formData.append('mode', 'multi');
            if (location) {
                formData.append('latitude', location.latitude.toString());
                formData.append('longitude', location.longitude.toString());
            }

            const blobPromises = Array.from(multiAngleSession.capturedAngles.entries()).map(async ([angle, data]) => {
                const res = await fetch(data);
                const blob = await res.blob();
                formData.append(angle, blob, `${angle}.jpg`);
            });
            await Promise.all(blobPromises);

            const apiRes = await fetch('/api/scan', { method: 'POST', body: formData });
            const data = await apiRes.json();

            if (!apiRes.ok) throw new Error(data.error || 'Forensic analysis failed');

            setResult({ ...data.data, scanMode: 'multi', anglesScanned: multiAngleSession.completedCount });
            setLastScanPreview(multiAngleSession.capturedAngles.get('front') || Array.from(multiAngleSession.capturedAngles.values())[0]);
            setScanState('complete');
            await refreshScans();

        } catch (err: any) {
            setError(err.message);
            setScanState('error');
        } finally {
            setIsThinking(false);
        }
    }, [multiAngleSession, user, location, refreshScans]);

    const processScan = useCallback(async (imageSource: string | Blob, source: 'camera' | 'upload' = 'camera') => {
        setScanState(source === 'camera' ? 'scanning' : 'analyzing_upload');
        setIsThinking(true);
        setError(null);

        try {
            let blob: Blob;
            let preview: string;
            if (typeof imageSource === 'string') {
                blob = await (await fetch(imageSource)).blob();
                preview = imageSource;
            } else {
                blob = imageSource;
                preview = await new Promise(r => {
                    const reader = new FileReader();
                    reader.onloadend = () => r(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            // Add detailed reasoning steps
            setThoughts(prev => [...prev, {
                id: Date.now().toString() + '-1',
                text: "Image captured. Starting OCR analysis on package text...",
                level: 'forensic',
                timestamp: new Date()
            }]);

            await new Promise(r => setTimeout(r, 500)); // Brief delay for UI

            setThoughts(prev => [...prev, {
                id: Date.now().toString() + '-2',
                text: "Extracting NAFDAC registration number from packaging...",
                level: 'forensic',
                timestamp: new Date()
            }]);

            const formData = new FormData();
            formData.append('image', blob, 'scan.jpg');
            formData.append('mode', 'single');
            if (location) {
                formData.append('latitude', location.latitude.toString());
                formData.append('longitude', location.longitude.toString());
            }

            setThoughts(prev => [...prev, {
                id: Date.now().toString() + '-3',
                text: "Validating against NAFDAC database and WHO Essential Medicines list...",
                level: 'forensic',
                timestamp: new Date()
            }]);

            setScanState('analyzing');

            setThoughts(prev => [...prev, {
                id: Date.now().toString() + '-4',
                text: "Initiating Google Search grounding for similar packaging reports...",
                level: 'sentinel',
                timestamp: new Date()
            }]);

            const apiRes = await fetch('/api/scan', { method: 'POST', body: formData });
            const data = await apiRes.json();

            if (!apiRes.ok) throw new Error(data.error || 'Scan failed');

            setThoughts(prev => [...prev, {
                id: Date.now().toString() + '-5',
                text: `Forensic analysis complete. Authenticity score: ${data.data.forensic.authenticityScore}%`,
                level: 'system',
                timestamp: new Date()
            }]);

            setResult({ ...data.data, scanMode: 'single', anglesScanned: 1 });
            setLastScanPreview(preview);
            setScanState('complete');
            await refreshScans();

        } catch (err: any) {
            setError(err.message);
            setScanState('error');
        } finally {
            setIsThinking(false);
        }
    }, [user, location, refreshScans]);


    const captureImage = useCallback(async () => {
        const src = webcamRef.current?.getScreenshot();
        if (src) await processScan(src, 'camera');
    }, [processScan]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processScan(file, 'upload');
    };

    const loadHistory = () => {
        setScanHistory(getScanHistory());
        setShowHistory(true);
    };

    const handleDeleteScan = (id: string) => {
        deleteScanFromHistory(id);
        setScanHistory(getScanHistory());
    };

    // Render Logic
    if (scanState === 'mode_select') return <ScanModeSelector onSelectMode={handleModeSelect} />;

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

    return (
        <div className="relative min-h-screen w-full bg-background-dark overflow-hidden flex flex-col font-display">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-3 z-50">
                <div className="flex items-center gap-4 text-background-dark dark:text-white">
                    <Link href="/" className="size-8 text-primary hover:scale-110 transition-transform">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-xl font-bold leading-tight tracking-tight">Ndunari</h2>
                </div>
                <div className="hidden md:flex flex-1 justify-center gap-8">
                    <Link href="/" className="text-background-dark dark:text-white/80 text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
                    <Link href="/history" className="text-background-dark dark:text-white/80 text-sm font-medium hover:text-primary transition-colors">History</Link>
                    <span className="text-primary text-sm font-bold border-b-2 border-primary pb-1">Forensic Scanner</span>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Settings size={20} />
                    </button>
                    <div className="h-8 w-[1px] bg-primary/20 mx-1"></div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-primary text-white rounded-lg text-xs font-bold">
                        <Shield size={14} />
                        SECURE
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Navigation (Desktop) */}
                <aside className="hidden lg:flex w-64 flex-col justify-between bg-white dark:bg-background-dark border-r border-primary/10 p-4">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-background-dark dark:text-white text-base font-bold">Forensic Mode</h1>
                            <p className="text-primary text-xs font-semibold uppercase tracking-wider">AI Medical Safety</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 cursor-pointer">
                                <Camera size={20} />
                                <p className="text-sm font-semibold leading-normal">Live Scan</p>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-background-dark dark:text-white/70 hover:bg-primary/10 transition-colors cursor-pointer">
                                <Search size={20} />
                                <p className="text-sm font-medium leading-normal">Batch Lookup</p>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-background-dark dark:text-white/70 hover:bg-primary/10 transition-colors cursor-pointer">
                                <AlertTriangle size={20} />
                                <p className="text-sm font-medium leading-normal">Safety Alerts</p>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-background-dark dark:text-white/70 hover:bg-primary/10 transition-colors cursor-pointer">
                                <BarChart2 size={20} />
                                <p className="text-sm font-medium leading-normal">Analytics</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Scanner Content */}
                <section id="main-content" className="flex-1 flex flex-col relative bg-black overflow-hidden">
                    {/* Camera Viewfinder */}
                    <div className="absolute inset-0 z-0">
                        {scanState !== 'analyzing_upload' && scanState !== 'upload_pending' ? (
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-background-dark flex items-center justify-center">
                                {/* Upload/Analysis Placeholder - Keep simple for now */}
                                <div className="text-center">
                                    <div className="text-6xl mb-4">{scanState === 'analyzing_upload' ? '📄' : '📤'}</div>
                                    <p className="text-white/40 font-bold uppercase tracking-widest">{scanState === 'analyzing_upload' ? 'Analyzing...' : 'Ready for Upload'}</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                    </div>

                    {/* Viewfinder UI Overlays */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                        {/* Scan Brackets - Enhanced with Pulsing Glow */}
                        <div className="relative w-[80%] max-w-[500px] h-[300px] border border-white/10 rounded-xl">
                            {/* Animated Corner Brackets */}
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl shadow-glow-primary"
                            />
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl shadow-glow-primary"
                            />
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl shadow-glow-primary"
                            />
                            <motion.div
                                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                                className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl shadow-glow-primary"
                            />

                            {/* Enhanced Scanning Line Animation */}
                            {(scanState === 'scanning' || scanState === 'analyzing' || scanState === 'idle') && (
                                <>
                                    <motion.div
                                        animate={{ top: ["0%", "100%", "0%"] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-[3px] gradient-primary shadow-glow-primary opacity-80 blur-[1px]"
                                    />
                                    <motion.div
                                        animate={{ top: ["0%", "100%", "0%"] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-[1px] bg-white"
                                    />
                                </>
                            )}

                            {/* Help Text */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 glass-panel-subtle px-4 py-1.5 rounded-full border border-primary/30"
                            >
                                <p className="text-white text-xs font-medium tracking-wide">
                                    {scanState === 'upload_pending' ? 'UPLOAD IMAGE' : 'ALIGN PACKAGING WITHIN BRACKETS'}
                                </p>
                            </motion.div>
                        </div>

                        {/* Glassmorphic AI Insight Badges */}
                        {isGuiding && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="absolute top-[25%] left-[60%] glass-panel-strong p-3 rounded-xl flex items-center gap-3 border border-primary/30 shadow-glow-primary animate-float"
                            >
                                <div className="size-8 rounded-full gradient-primary flex items-center justify-center text-white shadow-glow-primary animate-pulse-glow">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">AI Insight</p>
                                    <p className="text-sm font-extrabold text-white">Live Analysis</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom Scanner Controls */}
                    <div className="mt-auto relative z-30 flex flex-col items-center pb-8 pt-10 px-6 bg-gradient-to-t from-black/80 to-transparent">
                        {/* Main Controls Row */}
                        <div className="flex items-center gap-12">
                            <button className="size-12 rounded-full glass-panel-subtle border border-primary/30 flex items-center justify-center text-white hover:bg-primary/20 hover:shadow-glow-primary transition-all group">
                                <Zap size={24} className="group-hover:scale-110 transition-transform" />
                            </button>

                            {/* Capture Button - Enhanced with Ripple Animation */}
                            {scanState === 'idle' || scanState === 'upload_pending' ? (
                                <motion.button
                                    onClick={() => {
                                        if (scanState === 'idle' && webcamRef.current) {
                                            const screenshot = webcamRef.current.getScreenshot();
                                            if (screenshot) processScan(screenshot, 'camera');
                                        }
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                    className="size-20 rounded-full gradient-primary shadow-xl-glow flex items-center justify-center group relative overflow-hidden"
                                >
                                    {/* Ripple effect on click */}
                                    <motion.div
                                        className="absolute inset-0 bg-white rounded-full"
                                        initial={{ scale: 0, opacity: 0.5 }}
                                        whileTap={{ scale: 3, opacity: 0 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                    <div className="size-16 rounded-full bg-white flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform">
                                        <Camera size={32} className="text-primary" />
                                    </div>
                                </motion.button>
                            ) : (
                                <div className="size-20 rounded-full gradient-primary shadow-xl-glow flex items-center justify-center relative overflow-hidden animate-pulse-glow">
                                    <div className="size-16 rounded-full bg-white/90 flex items-center justify-center">
                                        <div className="animate-spin">
                                            <ScanLine size={32} className="text-primary" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="size-12 rounded-full glass-panel-subtle border border-primary/30 flex items-center justify-center text-white hover:bg-primary/20 hover:shadow-glow-primary transition-all group"
                            >
                                <Upload size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {/* Secondary Actions */}
                        <div className="mt-8 px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex gap-4 pointer-events-auto">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-white text-xs font-bold py-1 hover:text-primary transition-colors">
                                <Upload size={16} /> UPLOAD IMAGE
                            </button>
                            <div className="w-[1px] bg-white/10"></div>
                            <button onClick={loadHistory} className="flex items-center gap-2 text-white text-xs font-bold py-1 hover:text-primary transition-colors">
                                <History size={16} /> SESSION LOG
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                        </div>
                    </div>
                </section>

                {/* Right Sidebar (Analysis Details) - Desktop Only */}
                <aside className="hidden xl:flex w-80 flex-col bg-white dark:bg-background-dark border-l border-primary/10 overflow-y-auto">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-background-dark dark:text-white mb-4">Real-time Analysis</h3>
                        <div className="space-y-4">
                            {/* Dynamic Content or Placeholders */}
                            <ThinkingPanel thoughts={thoughts} isAnalyzing={isThinking} mode="live" />

                            <div className="pt-4 border-t border-primary/10">
                                <h4 className="text-xs font-bold text-background-dark/40 dark:text-white/40 uppercase mb-3">Live Feed Status</h4>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-background-dark/70 dark:text-white/70">Neural Engine</span>
                                    <span className="text-xs font-bold text-primary">ACTIVE</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-background-dark/70 dark:text-white/70">Resolution</span>
                                    <span className="text-xs font-bold text-background-dark dark:text-white">4K UHD</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Results Modal (Overlay) - Reusing existing logic but styled better */}
            {scanState === 'complete' && result && (
                <div className="fixed inset-0 z-[60] bg-black/90 p-6 overflow-y-auto flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-full max-w-md bg-white dark:bg-background-dark rounded-3xl p-6 shadow-2xl space-y-6 border border-white/10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black text-forest-green dark:text-white uppercase tracking-tight">Analysis Report</h2>
                                <p className="text-sm font-bold text-primary">{result.forensic.drugName}</p>
                            </div>
                            <button onClick={resetScan} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-gray-500 dark:text-white">✕</button>
                        </div>

                        <div className={`p-6 rounded-2xl border-l-4 ${result.forensic.riskLevel === 'safe' ? 'bg-access-green/10 border-access-green' :
                            result.forensic.riskLevel === 'suspicious' ? 'bg-watch-orange/10 border-watch-orange' :
                                'bg-reserve-red/10 border-reserve-red'
                            }`}>
                            <p className="text-lg font-black uppercase tracking-tighter text-foreground">
                                {result.forensic.riskLevel === 'safe' ? 'Verified Authentic' :
                                    result.forensic.riskLevel === 'suspicious' ? 'Verification Required' : 'Counterfeit Suspected'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest">Forensic Findings</h3>
                            <ul className="space-y-2">
                                {result.forensic.findings.map((f, i) => (
                                    <li key={i} className="flex gap-3 text-sm items-start">
                                        <CheckCircle size={16} className="text-primary mt-1 shrink-0" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button onClick={resetScan} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-primary-dark transition-colors">
                            New Scan
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {scanState === 'error' && (
                <div className="fixed inset-0 z-[60] bg-black/90 p-6 flex items-center justify-center">
                    <div className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-3xl p-8 text-center space-y-6">
                        <AlertTriangle size={48} className="mx-auto text-reserve-red" />
                        <h2 className="text-xl font-black uppercase text-white">Analysis Failed</h2>
                        <p className="text-sm text-gray-400">{error}</p>
                        <button onClick={resetScan} className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20">Try Again</button>
                    </div>
                </div>
            )}
        </div>
    );
}
