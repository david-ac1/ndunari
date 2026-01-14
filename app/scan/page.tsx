"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Link from "next/link";

type ScanState = "idle" | "scanning" | "analyzing" | "complete" | "error";

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
}

export default function ScanPage() {
    const [scanState, setScanState] = useState<ScanState>("idle");
    const [currentThought, setCurrentThought] = useState("");
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const webcamRef = useRef<Webcam>(null);

    const videoConstraints = {
        width: 1920,
        height: 1080,
        facingMode: "environment", // Use back camera on mobile
    };

    const captureImage = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) {
            setError("Failed to capture image");
            return;
        }

        setScanState("scanning");
        setCurrentThought("Capturing package image...");

        // Simulate thought progression
        setTimeout(() => setCurrentThought("Analyzing hologram structure..."), 800);
        setTimeout(() => setCurrentThought("Checking NAFDAC number format..."), 1600);
        setTimeout(() => setCurrentThought("Validating security features..."), 2400);

        try {
            // Convert base64 to blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            // Create FormData
            const formData = new FormData();
            formData.append("image", blob, "scan.jpg");

            // Call API
            setScanState("analyzing");
            setCurrentThought("Running Gemini forensic analysis...");

            const apiResponse = await fetch("/api/scan", {
                method: "POST",
                body: formData,
            });

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                // Extract error message from API response
                const errorMessage = data.error || data.message || "Scan failed";
                throw new Error(errorMessage);
            }

            setResult(data.data);
            setScanState("complete");
            setCurrentThought("");
        } catch (err) {
            console.error("Scan error:", err);
            setError(err instanceof Error ? err.message : "Scan failed");
            setScanState("error");
            setCurrentThought("");
        }
    }, []);

    const resetScan = () => {
        setScanState("idle");
        setResult(null);
        setError(null);
        setCurrentThought("");
    };

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
                {/* Dark overlay for better UI visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
            </div>

            {/* Top Header */}
            <header className="absolute top-0 left-0 w-full z-30 pt-safe-top">
                <div className="flex items-center justify-between px-6 py-4 glass-panel mx-4 mt-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                    <Link
                        href="/"
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        <span className="text-2xl">←</span>
                    </Link>
                    <h1 className="text-base font-bold tracking-wide text-white uppercase opacity-90">
                        Ndunari <span className="text-primary font-extrabold">Scan</span>
                    </h1>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors text-white">
                        <span className="text-2xl">💡</span>
                    </button>
                </div>
            </header>

            {/* Central Scanning Reticle */}
            <main className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="relative w-72 h-72 lg:w-96 lg:h-96 border border-white/10 rounded-3xl bg-white/5 shadow-2xl backdrop-blur-[2px]">

                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-primary rounded-tl-2xl -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-primary rounded-tr-2xl -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-primary rounded-bl-2xl -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-primary rounded-br-2xl -mb-0.5 -mr-0.5" />

                    {/* Scanning Line */}
                    {scanState === "scanning" && (
                        <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-primary/80 shadow-[0_0_15px_rgba(75,184,20,0.8)] animate-pulse" />
                    )}

                    {/* Status Indicator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                        {scanState === "idle" && (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                                    <span className="text-4xl">📷</span>
                                </div>
                                <p className="text-white/90 text-sm font-medium">Ready to scan</p>
                            </div>
                        )}
                        {(scanState === "scanning" || scanState === "analyzing") && (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2 animate-pulse">
                                    <span className="text-4xl">🔄</span>
                                </div>
                                <p className="text-primary text-sm font-medium animate-pulse">Analyzing...</p>
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
                {scanState === "idle" && (
                    <div className="mb-8 text-center">
                        <p className="text-white/90 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 inline-flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            Align the medication box within the frame
                        </p>
                    </div>
                )}

                {/* Camera Controls */}
                <div className="flex items-center justify-between w-full max-w-sm gap-8">

                    {/* Gallery Button */}
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                            <span className="text-2xl">📁</span>
                        </div>
                        <span className="text-xs font-medium text-white/70">History</span>
                    </button>

                    {/* Primary Capture Button */}
                    <button
                        onClick={scanState === "idle" ? captureImage : resetScan}
                        disabled={scanState === "scanning" || scanState === "analyzing"}
                        className="relative group cursor-pointer transform active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Outer Glow Ring */}
                        <div className="absolute -inset-1 bg-primary/30 rounded-full blur-md group-hover:bg-primary/50 transition-all" />

                        {/* Outer Stroke Ring */}
                        <div className="w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center relative z-10">
                            {/* Inner Fill */}
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-inner">
                                {scanState === "complete" || scanState === "error" ? (
                                    <span className="text-white text-3xl">↻</span>
                                ) : (
                                    <span className="text-white text-3xl">📷</span>
                                )}
                            </div>
                        </div>
                    </button>

                    {/* Manual Input Button */}
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                            <span className="text-2xl">⌨️</span>
                        </div>
                        <span className="text-xs font-medium text-white/70">Manual</span>
                    </button>
                </div>

                {/* Mode Indicator */}
                <div className="mt-6">
                    <button className="text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white transition-colors flex items-center gap-1">
                        Forensic Scan Mode
                        <span className="text-sm">▼</span>
                    </button>
                </div>
            </footer>

            {/* Results Modal */}
            {scanState === "complete" && result && (
                <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-forest-green dark:text-white">
                                Scan Results
                            </h2>
                            <button
                                onClick={resetScan}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>

                        {/* Authenticity Score */}
                        <div className={`p-6 rounded-xl ${result.forensic.riskLevel === "safe" ? "bg-access-green/10 border-2 border-access-green" :
                            result.forensic.riskLevel === "suspicious" ? "bg-watch-orange/10 border-2 border-watch-orange" :
                                "bg-reserve-red/10 border-2 border-reserve-red"
                            }`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium opacity-70">Authenticity Score</p>
                                    <p className="text-4xl font-bold">{result.forensic.authenticityScore}%</p>
                                </div>
                                <div className="text-5xl">
                                    {result.forensic.riskLevel === "safe" ? "✅" :
                                        result.forensic.riskLevel === "suspicious" ? "⚠️" : "❌"}
                                </div>
                            </div>
                            <p className="font-bold text-lg uppercase">
                                {result.forensic.riskLevel === "safe" ? "VERIFIED SAFE" :
                                    result.forensic.riskLevel === "suspicious" ? "SUSPICIOUS - REQUIRES VERIFICATION" :
                                        "COUNTERFEIT DETECTED"}
                            </p>
                        </div>

                        {/* Drug Information */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg">Drug Information</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-xs opacity-70 mb-1">Drug Name</p>
                                    <p className="font-bold">{result.forensic.drugName}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-xs opacity-70 mb-1">NAFDAC Number</p>
                                    <p className="font-bold">{result.forensic.nafdacNumber || "Not Found"}</p>
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

                        {/* Stewardship Warning */}
                        {result.stewardship && (
                            <div className="p-4 bg-reserve-red/10 border border-reserve-red rounded-xl">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <span>⚠️</span> Stewardship Alert
                                </h3>
                                <p className="text-sm mb-2">
                                    <strong>WHO AWaRe Category:</strong> {result.stewardship.awareCategory}
                                </p>
                                <ul className="space-y-1 text-sm">
                                    {result.stewardship.recommendations.map((rec, idx) => (
                                        <li key={idx}>• {rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Processing Info */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                            <span>Processed in {result.processingTime}ms</span>
                            <span>{result.escalated ? "Deep Analysis (Thinking Mode)" : "Standard Scan (Flash Mode)"}</span>
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

            {/* Error State */}
            {scanState === "error" && (
                <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 text-center space-y-4">
                        {/* Different icons for different error types */}
                        <span className="text-6xl">
                            {error?.toLowerCase().includes("not a valid drug package") ? "🚫" :
                                error?.toLowerCase().includes("rate limit") || error?.toLowerCase().includes("quota") ? "⏱️" :
                                    "❌"}
                        </span>

                        <h2 className="text-2xl font-bold text-reserve-red">
                            {error?.toLowerCase().includes("not a valid drug package") ? "Invalid Image" :
                                error?.toLowerCase().includes("rate limit") || error?.toLowerCase().includes("quota") ? "Rate Limit Reached" :
                                    "Scan Failed"}
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {error || "An unknown error occurred"}
                        </p>

                        {/* Helpful tips based on error type */}
                        {error?.toLowerCase().includes("not a valid drug package") && (
                            <div className="text-left bg-mint-leaf/10 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                                <p className="font-bold mb-2">✓ Valid images include:</p>
                                <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                                    <li>• Medicine boxes</li>
                                    <li>• Pill bottles</li>
                                    <li>• Blister packs</li>
                                    <li>• Drug packaging labels</li>
                                </ul>
                            </div>
                        )}

                        {(error?.toLowerCase().includes("rate limit") || error?.toLowerCase().includes("quota")) && (
                            <div className="text-left bg-watch-orange/10 border border-watch-orange/30 rounded-lg p-4 text-sm">
                                <p className="font-bold mb-2">⚠️ Too many requests</p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Please wait 10-15 seconds between scans or enable MOCK_MODE in your .env.local file for testing.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={resetScan}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
