"use client";

import { type AngleType, SCAN_ANGLES } from "@/lib/utils/scan-angles";

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
                            <p className="text-white/70 text-sm mb-1">Angles Captured</p>
                            <p className="text-2xl font-bold text-white">{totalCaptured}/5</p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm mb-1">Required Complete</p>
                            <p className="text-2xl font-bold text-white">
                                {requiredAngles.filter(a => capturedImages.has(a.id)).length}/{requiredAngles.length}
                            </p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm mb-1">Expected Confidence</p>
                            <p className="text-2xl font-bold text-access-green">{confidenceEstimate}</p>
                        </div>
                    </div>
                </div>

                {/* Warnings */}
                {!allRequiredCaptured && (
                    <div className="p-4 bg-watch-orange/10 border border-watch-orange rounded-xl">
                        <p className="text-sm font-bold text-watch-orange flex items-center gap-2">
                            <span>⚠️</span> Missing required angles
                        </p>
                        <p className="text-xs text-white/70 mt-1">
                            Please capture all required angles (Front, Back, Side 1) for comprehensive verification.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                    >
                        Cancel
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
