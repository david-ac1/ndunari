"use client";

import { ScanMode } from "@/lib/utils/scan-angles";

interface ScanModeSelectorProps {
    onSelectMode: (mode: ScanMode) => void;
}

export default function ScanModeSelector({ onSelectMode }: ScanModeSelectorProps) {
    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        How would you like to scan?
                    </h1>
                    <p className="text-white/70">
                        Choose your scanning method for drug verification
                    </p>
                </div>

                {/* Quick Upload Option */}
                <button
                    onClick={() => onSelectMode('single')}
                    className="w-full glass-panel bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-xl bg-watch-orange/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <span className="text-3xl">📂</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                            <h3 className="text-xl font-bold text-white mb-1">Quick Upload</h3>
                            <p className="text-white/70 text-sm mb-3">
                                Upload a single photo from your gallery
                            </p>

                            {/* Confidence Badge */}
                            <div className="inline-flex items-center gap-2 bg-watch-orange/20 px-3 py-1 rounded-full">
                                <span className="text-xs font-bold text-watch-orange">Max 70%</span>
                                <span className="text-xs text-white/70">confidence</span>
                            </div>

                            {/* Use Case */}
                            <p className="text-xs text-white/50 mt-2">
                                Best for: Quick checks, stock images, demos
                            </p>
                        </div>
                    </div>
                </button>

                {/* Multi-Angle Scan Option */}
                <button
                    onClick={() => onSelectMode('multi')}
                    className="w-full glass-panel bg-primary/10 backdrop-blur-md border-2 border-primary rounded-2xl p-6 hover:bg-primary/20 transition-all group relative overflow-hidden"
                >
                    {/* Recommended Badge */}
                    <div className="absolute top-3 right-3 bg-primary px-3 py-1 rounded-full">
                        <span className="text-xs font-bold text-white">Recommended</span>
                    </div>

                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-xl bg-primary/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <span className="text-3xl">📷</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                            <h3 className="text-xl font-bold text-white mb-1">3D Verification Scan</h3>
                            <p className="text-white/70 text-sm mb-3">
                                Scan package from multiple angles for full verification
                            </p>

                            {/* Confidence Badge */}
                            <div className="inline-flex items-center gap-2 bg-access-green/20 px-3 py-1 rounded-full mb-2">
                                <span className="text-xs font-bold text-access-green">Up to 100%</span>
                                <span className="text-xs text-white/70">confidence</span>
                            </div>

                            {/* Features */}
                            <div className="space-y-1 mt-3">
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <span className="text-primary">✓</span>
                                    Front, back, and sides
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <span className="text-primary">✓</span>
                                    Comprehensive security check
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <span className="text-primary">✓</span>
                                    Cross-verify batch numbers
                                </div>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Info Footer */}
                <div className="text-center">
                    <p className="text-xs text-white/50">
                        💡 Multi-angle scanning provides the most accurate counterfeit detection
                    </p>
                </div>
            </div>
        </div>
    );
}
