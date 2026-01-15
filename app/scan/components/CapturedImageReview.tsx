"use client";

import { type AngleType, SCAN_ANGLES } from "@/lib/utils/scan-angles";
import Link from "next/link";

interface CapturedImageReviewProps {
    capturedImages: Map<AngleType, string>;
    onRetake: (angle: AngleType) => void;
    onProceed: () => void;
    onCancel: () => void;
}

export default function CapturedImageReview({
    capturedImages,
    onRetake,
    onProceed,
    onCancel,
}: CapturedImageReviewProps) {
    const requiredAngles = Object.values(SCAN_ANGLES).filter(a => a.required);
    const allRequiredCaptured = requiredAngles.every(angle => capturedImages.has(angle.id));

    const totalCaptured = capturedImages.size;
    const confidenceEstimate = totalCaptured >= 3 ? '95-100%' : totalCaptured === 2 ? '80-85%' : '70%';

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
            <div className="w-full max-w-4xl space-y-6">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Review Your Scans
                    </h1>
                    <p className="text-white/70">
                        Check all captured angles before analysis
                    </p>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(SCAN_ANGLES).map((angle) => {
                        const imageData = capturedImages.get(angle.id);
                        const isCaptured = !!imageData;

                        return (
                            <div
                                key={angle.id}
                                className={`relative rounded-2xl overflow-hidden border-2 ${isCaptured
                                    ? 'border-access-green'
                                    : angle.required
                                        ? 'border-reserve-red/50'
                                        : 'border-white/20'
                                    }`}
                            >
                                {/* Image or Placeholder */}
                                {isCaptured ? (
                                    <img
                                        src={imageData}
                                        alt={angle.label}
                                        className="w-full aspect-[4/3] object-cover"
                                    />
                                ) : (
                                    <div className="w-full aspect-[4/3] bg-white/5 flex flex-col items-center justify-center">
                                        <span className="text-4xl mb-2">{angle.icon}</span>
                                        <p className="text-white/50 text-sm">Not captured</p>
                                        {angle.required && (
                                            <p className="text-reserve-red text-xs mt-1">Required</p>
                                        )}
                                    </div>
                                )}

                                {/* Label Overlay */}
                                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{angle.icon}</span>
                                        <span className="text-white text-sm font-medium">{angle.label}</span>
                                        {isCaptured && (
                                            <span className="text-access-green text-lg">✓</span>
                                        )}
                                    </div>
                                </div>

                                {/* Retake Button */}
                                {isCaptured && (
                                    <button
                                        onClick={() => onRetake(angle.id)}
                                        className="absolute bottom-2 right-2 bg-primary px-3 py-1 rounded-full text-white text-xs font-bold hover:bg-primary-dark transition-colors"
                                    >
                                        🔄 Retake
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Stats */}
                <div className="glass-panel bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-white/70 text-sm mb-1">Forensic Intensity</p>
                            <p className={`text-2xl font-bold ${totalCaptured >= 5 ? 'text-primary' : 'text-white'}`}>{totalCaptured}/5</p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm mb-1">Safety Baseline</p>
                            <p className="text-2xl font-bold text-white">
                                {allRequiredCaptured ? 'PASSED' : `${requiredAngles.filter(a => capturedImages.has(a.id)).length}/3`}
                            </p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm mb-1">Authenticity Power</p>
                            <p className={`text-2xl font-bold ${totalCaptured >= 5 ? 'text-primary animate-pulse' : 'text-access-green'}`}>{confidenceEstimate}</p>
                        </div>
                    </div>
                </div>

                {/* Boost Authenticity Nudge */}
                {allRequiredCaptured && totalCaptured < 5 && (
                    <div className="p-6 bg-primary/10 border-2 border-primary/30 rounded-3xl relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl animate-bounce">
                                    🚀
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase text-primary tracking-widest">Boost Authenticity</h3>
                                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-tight">Capture remaining sides for Sentinel High-Integrity analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={onCancel} // This will trigger a re-entry to the scan flow
                                className="px-6 py-2 bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-lg"
                            >
                                Capture More
                            </button>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
                    </div>
                )}

                {/* Warnings */}
                {!allRequiredCaptured && (
                    <div className="p-4 bg-reserve-red/10 border-2 border-reserve-red/30 rounded-2xl">
                        <p className="text-sm font-bold text-reserve-red flex items-center gap-2">
                            <span>⚠️</span> Forensic Integrity Incomplete
                        </p>
                        <p className="text-[10px] text-white/50 mt-1 uppercase font-bold tracking-tight">
                            Please capture all required angles (Front, Back, Side 1) to establish the safety baseline.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Link
                        href="/"
                        className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                        Go Home
                    </Link>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onProceed}
                        disabled={!allRequiredCaptured}
                        className="flex-1 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {allRequiredCaptured ? (
                            <>Analyze Package ({totalCaptured} angles)</>
                        ) : (
                            <>Capture More Angles</>
                        )}
                    </button>
                </div>

                {/* Helper Text */}
                <div className="text-center">
                    <p className="text-xs text-white/50">
                        💡 More angles = higher confidence. Optional angles (Side 2, Contents) can boost accuracy.
                    </p>
                </div>
            </div>
        </div>
    );
}
