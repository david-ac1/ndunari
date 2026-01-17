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
    const { refreshScans } = useScanData(); // Use centralized state
    const [scanState, setScanState] = useState<ScanState>("mode_select");
    const [scanMode, setScanMode] = useState<ScanMode | null>(null);
    const [multiAngleSession, setMultiAngleSession] = useState<MultiAngleScanSession | null>(null);
    const [currentThought, setCurrentThought] = useState("");
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const [thoughts, setThoughts] = useState<{ id: string, text: string, level: 'forensic' | 'sentinel' | 'system', timestamp: Date }[]>([]);
    const [isThinking, setIsThinking] = useState(false); // Global busy state
    const [isGuiding, setIsGuiding] = useState(false);  // Agent background pulse state
    const [lastScanPreview, setLastScanPreview] = useState<string | null>(null);

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
        // Only run guidance if the camera is explicitly in IDLE mode
        // This prevents interference during mode selection, scanning, and upload analysis
        const isCameraActive = scanState === 'idle';

        if (isCameraActive) {
            const addThought = (text: string, level: 'forensic' | 'sentinel' | 'system' = 'system') => {
                setThoughts(prev => [...prev, { id: Math.random().toString(), text, level, timestamp: new Date() }]);
            };

            const interval = setInterval(async () => {
                // Capture current frame for real-time analysis
                const screenshot = webcamRef.current?.getScreenshot();

                if (screenshot) {
                    setIsGuiding(true);
                    const guidance = await sentinelAgentService.generateLiveGuidance(screenshot);
                    addThought(guidance, 'sentinel');
                    if (enabled) speak(guidance);

                    // Small delay to show the 'Pulse' visually
                    setTimeout(() => setIsGuiding(false), 800);
                } else {
                    console.log("Sentinel: No camera frame available, skipping live guidance pulse.");
                }
            }, 4000); // Pulse every 4s for high-immersion guidance

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

    // Video Constraints
    const videoConstraints = {
        width: { ideal: 4096 },
        height: { ideal: 2160 },
        facingMode: "environment",
        aspectRatio: 16 / 9,
    };

    // Mode Selection logic
    const handleModeSelect = useCallback((mode: ScanMode) => {
        setScanMode(mode);
        if (mode === 'multi') {
            setMultiAngleSession(createScanSession(mode));
            setScanState('multi_angle');
        } else {
            // "Quick Upload" - Transition to upload-first UI
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
        setCurrentThought('');
        setIsThinking(false);
        setLastScanPreview(null);
    };

    // Core Analysis logic
    const handleAnalyzeMultiAngle = useCallback(async () => {
        if (!multiAngleSession) return;
        setScanState('analyzing');
        setIsThinking(true);
        setThoughts(prev => [...prev, { id: Date.now().toString(), text: "Escalating multi-angle forensics to thinking brain...", level: 'forensic', timestamp: new Date() }]);

        try {
            const formData = new FormData();
            formData.append('mode', 'multi');

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

            // Background save logic
            const historyItem: ScanHistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                drugName: data.data.forensic.drugName,
                authenticityScore: data.data.forensic.authenticityScore,
                riskLevel: data.data.forensic.riskLevel,
                nafdacNumber: data.data.forensic.nafdacNumber,
                imagePreview: Array.from(multiAngleSession.capturedAngles.values())[0]?.substring(0, 5000),
            };

            // Save to localStorage for offline access only
            saveScanToHistory(historyItem);

            // API already saved to Supabase - just refresh UI
            await refreshScans();

        } catch (err: any) {
            setError(err.message);
            setScanState('error');
        } finally {
            setIsThinking(false);
        }
    }, [multiAngleSession, user]);

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

            const formData = new FormData();
            formData.append('image', blob, 'scan.jpg');
            formData.append('mode', 'single');

            setScanState('analyzing');
            const apiRes = await fetch('/api/scan', { method: 'POST', body: formData });
            const data = await apiRes.json();

            if (!apiRes.ok) throw new Error(data.error || 'Scan failed');

            setResult({ ...data.data, scanMode: 'single', anglesScanned: 1 });
            setLastScanPreview(preview);
            setScanState('complete');

            const historyItem: ScanHistoryItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                drugName: data.data.forensic.drugName,
                authenticityScore: data.data.forensic.authenticityScore,
                riskLevel: data.data.forensic.riskLevel,
                nafdacNumber: data.data.forensic.nafdacNumber,
                imagePreview: preview.substring(0, 5000),
            };

            // Save to localStorage for offline access only
            saveScanToHistory(historyItem);

            // API already saved to Supabase - just refresh UI
            await refreshScans();

        } catch (err: any) {
            setError(err.message);
            setScanState('error');
        } finally {
            setIsThinking(false);
        }
    }, [user, refreshScans]);


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
        <div className="relative min-h-screen w-full bg-background-dark overflow-hidden flex flex-col">
            {/* Camera Viewport or Document Placeholder */}
            {scanState !== 'analyzing_upload' && scanState !== 'upload_pending' ? (
                <div className="absolute inset-0 z-0 transition-opacity duration-700">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                    {/* Animated background for document processing */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"
                    />
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-32 h-44 border-2 border-primary/30 rounded-lg bg-white/5 backdrop-blur-3xl flex items-center justify-center relative overflow-hidden"
                        >
                            <div className="text-6xl opacity-40">📄</div>
                            {scanState === 'analyzing_upload' && (
                                <motion.div
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-primary/60 shadow-[0_0_15px_rgba(56,189,248,0.8)]"
                                />
                            )}
                            {scanState === 'upload_pending' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 animate-pulse">
                                    <span className="text-3xl">+</span>
                                </div>
                            )}
                        </motion.div>
                        <p className="text-primary/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">
                            {scanState === 'analyzing_upload' ? 'Scanning Image Buffer...' : 'Awaiting Forensic Document...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="relative z-30 pt-6 px-4">
                <div className="flex items-center justify-between p-4 glass-panel rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                    <Link href="/" className="w-10 h-10 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors">
                        <span className="text-xl">←</span>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">Ndunari Sentinel</h1>
                        <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${scanState === 'analyzing_upload' ? 'text-primary' : 'text-emerald-500'}`}>
                            {scanState === 'analyzing_upload' ? 'National Ledger Integrated' : 'Guardian Live Enabled'}
                        </p>
                    </div>
                    <button className="w-10 h-10 rounded-full hover:bg-white/10 text-white flex items-center justify-center">
                        <span className="text-xl">💡</span>
                    </button>
                </div>
            </header>

            {/* Main Scanning View */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 pb-32">
                <div className="w-full max-w-lg space-y-6">
                    {/* Thinking Monologue (Action Era Feature) */}
                    <ThinkingPanel
                        thoughts={thoughts}
                        isAnalyzing={isThinking || isGuiding || scanState === 'analyzing_upload'}
                        mode={scanState === 'analyzing_upload' ? 'document' : 'live'}
                    />

                    {/* Central Reticle */}
                    <div className="relative aspect-square w-full max-w-sm mx-auto group">
                        <div className="absolute inset-0 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-[2px]" />

                        {/* Braces - Only show for live scan */}
                        {scanState !== 'analyzing_upload' && (
                            <>
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                            </>
                        )}

                        {/* Scan Line */}
                        {(scanState === 'scanning' || scanState === 'analyzing') && (
                            <motion.div
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute left-2 right-2 h-0.5 bg-primary shadow-[0_0_15px_rgba(56,189,248,0.8)] z-20"
                            />
                        )}

                        <div className="absolute inset-0 flex items-center justify-center">
                            {scanState === 'idle' && <span className="text-white/20 text-xs font-bold uppercase tracking-widest animate-pulse">Align Package</span>}
                            {(scanState === 'analyzing_upload' || scanState === 'upload_pending') && (
                                <div className="text-center space-y-4">
                                    <div className="text-5xl animate-bounce">{scanState === 'analyzing_upload' ? '📄' : '📤'}</div>
                                    <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                                        {scanState === 'analyzing_upload' ? 'Analyzing Document...' : 'Upload Specimen'}
                                    </p>
                                </div>
                            )}
                            {isGuiding && scanState !== 'analyzing_upload' && scanState !== 'upload_pending' && <div className="text-5xl animate-bounce">🧠</div>}
                        </div>
                    </div>
                </div>
            </main>

            {/* Controls */}
            <footer className="absolute bottom-0 left-0 w-full z-30 p-10 flex flex-col items-center gap-6">
                <div className="flex items-center gap-8">
                    <button onClick={loadHistory} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center group relative" title="Scan History">
                        <span className="group-hover:scale-125 transition-transform text-lg">📁</span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest bg-black/60 px-2 py-1 rounded">Logbook</span>
                    </button>

                    <button
                        onClick={scanState === 'idle' ? captureImage : (scanState === 'upload_pending' ? () => fileInputRef.current?.click() : resetScan)}
                        disabled={isThinking}
                        className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-primary shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 transition-all hover:scale-105 ${scanState === 'upload_pending' ? 'bg-watch-orange' : ''}`}
                    >
                        <span className="text-white text-3xl">
                            {scanState === 'complete' ? '↻' : (scanState === 'upload_pending' ? '📤' : '📷')}
                        </span>
                    </button>

                    <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center group relative" title="Upload Document">
                        <span className="group-hover:scale-125 transition-transform text-lg">📂</span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest bg-black/60 px-2 py-1 rounded">Upload</span>
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>

                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">
                    {scanState === 'analyzing_upload' ? 'Scanning National Ledger...' : scanMode === 'single' ? 'Standard Forensic Mode' : 'Initializing Sentinel...'}
                </p>
            </footer>

            {/* Results Overlay */}
            {
                scanState === 'complete' && result && (
                    <div className="absolute inset-0 z-50 bg-black/90 p-6 overflow-y-auto flex items-center justify-center">
                        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-forest-green dark:text-white uppercase tracking-tight">Analysis Report</h2>
                                    <p className="text-sm font-bold text-primary">{result.forensic.drugName}</p>
                                </div>
                                <button onClick={resetScan} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold">✕</button>
                            </div>

                            <div className={`p-6 rounded-2xl border-b-8 ${result.forensic.riskLevel === 'safe' ? 'bg-access-green/10 border-access-green' :
                                result.forensic.riskLevel === 'suspicious' ? 'bg-watch-orange/10 border-watch-orange' :
                                    'bg-reserve-red/10 border-reserve-red'
                                }`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase opacity-60">Authenticity Score</span>
                                    <span className="text-2xl font-black">{result.forensic.authenticityScore}%</span>
                                </div>
                                <p className="text-lg font-black uppercase tracking-tighter">
                                    {result.forensic.riskLevel === 'safe' ? 'Verified Authentic' :
                                        result.forensic.riskLevel === 'suspicious' ? 'Verification Required' : 'Counterfeit Suspected'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase text-white/40 tracking-widest">Findings</h3>
                                <ul className="space-y-2">
                                    {result.forensic.findings.slice(0, 4).map((f, i) => (
                                        <li key={i} className="flex gap-2 text-sm items-start">
                                            <span className="text-primary mt-1">•</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Forensic Evidence Visualizer (Wow Factor) */}
                            {lastScanPreview && result.forensic.evidenceBoxes && result.forensic.evidenceBoxes.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase text-white/40 tracking-widest">Forensic Evidence</h3>
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-primary/30 group">
                                        <img src={lastScanPreview} className="w-full h-full object-cover" alt="Evidence" />
                                        <ForensicEvidenceOverlay boxes={result.forensic.evidenceBoxes} />
                                        <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-md px-2 py-1 rounded-lg border border-primary/30">
                                            <p className="text-[8px] text-primary font-black uppercase tracking-tighter">AI Annotated</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white/40 font-medium italic text-center">
                                        * Gemini 3 has pinpointed security feature anomalies above
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={() => speaking ? stop() : handleReadScanResults()} className="flex-1 py-4 bg-primary/10 text-primary font-black rounded-2xl border-2 border-primary/20">
                                    {speaking ? 'Stop Narị' : 'Narị Audio'}
                                </button>
                                <button onClick={resetScan} className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-lg">New Scan</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Error Overlay */}
            {
                scanState === 'error' && (
                    <div className="absolute inset-0 z-50 bg-black/90 p-6 flex items-center justify-center">
                        <div className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-3xl p-8 text-center space-y-6">
                            <div className="text-6xl">⚠️</div>
                            <h2 className="text-xl font-black uppercase">Forensic Halt</h2>
                            <p className="text-sm text-gray-500">{error || 'Unknown analysis exception'}</p>
                            <button onClick={resetScan} className="w-full py-4 bg-reserve-red text-white font-black rounded-2xl">Retry Scan</button>
                        </div>
                    </div>
                )
            }

            {/* History Overlay (Simplified for MVP) */}
            {
                showHistory && (
                    <div className="absolute inset-0 z-50 bg-black/90 p-6 overflow-y-auto">
                        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black uppercase">Sentinel Logs</h2>
                                <button onClick={() => setShowHistory(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-bold">Close</button>
                            </div>
                            <div className="space-y-4">
                                {scanHistory.map(scan => (
                                    <div key={scan.id} className="p-4 rounded-2xl border-2 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                                        <div>
                                            <p className="font-black text-sm">{scan.drugName}</p>
                                            <p className="text-[10px] uppercase font-bold opacity-50">{new Date(scan.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-primary">{scan.authenticityScore}%</p>
                                            <button onClick={() => handleDeleteScan(scan.id)} className="text-[10px] font-bold text-reserve-red uppercase">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
