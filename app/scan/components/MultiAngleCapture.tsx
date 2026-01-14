"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
    SCAN_ANGLES,
    type AngleType,
    type MultiAngleScanSession,
    getNextAngle,
    isSessionComplete,
} from "@/lib/utils/scan-angles";

interface MultiAngleCaptureProps {
    session: MultiAngleScanSession;
    onCaptureAngle: (angle: AngleType, imageData: string) => void;
    onComplete: () => void;
    onCancel: () => void;
}

export default function MultiAngleCapture({
    session,
    onCaptureAngle,
    onComplete,
    onCancel,
}: MultiAngleCaptureProps) {
    const webcamRef = useRef<Webcam>(null);
    const [capturing, setCapturing] = useState(false);

    const currentAngle = session.currentAngle;
    const angleConfig = currentAngle ? SCAN_ANGLES[currentAngle] : null;

    const progress = (session.completedCount / session.requiredCount) * 100;

    const videoConstraints = {
        width: 1920,
        height: 1080,
        facingMode: "environment",
    };

    const handleCapture = useCallback(() => {
        if (!currentAngle || capturing) return;

        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) {
            alert("Failed to capture image. Please try again.");
            return;
        }

        setCapturing(true);

        // Animate capture
        setTimeout(() => {
            onCaptureAngle(currentAngle, imageSrc);
            setCapturing(false);

            // Check if all required angles are captured
            if (isSessionComplete(session)) {
                onComplete();
            }
        }, 300);
    }, [currentAngle, capturing, onCaptureAngle, session, onComplete]);

    const handleSkip = useCallback(() => {
        if (!currentAngle) return;

        const angle = SCAN_ANGLES[currentAngle];
        if (angle.required) {
            alert("This angle is required and cannot be skipped.");
            return;
        }

        const next = getNextAngle(session);
        if (next) {
            // Skip to next (handled by parent component)
        }
    }, [currentAngle, session]);

    if (!angleConfig) {
        return null;
    }

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
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
            </div>

            {/* Top Header */}
            <header className="absolute top-0 left-0 w-full z-30 pt-safe-top">
                <div className="flex items-center justify-between px-6 py-4 glass-panel mx-4 mt-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 text-white hover:text-white/70 transition-colors"
                    >
                        <span className="text-2xl">←</span>
                        <span className="text-sm font-medium">Cancel</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-base font-bold tracking-wide text-white uppercase">
                            Scanning: {angleConfig.label}
                        </h1>
                        <p className="text-xs text-white/70">
                            {session.completedCount + 1} of {session.requiredCount}
                        </p>
                    </div>

                    {!angleConfig.required && (
                        <button
                            onClick={handleSkip}
                            className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                        >
                            Skip
                        </button>
                    )}
                    {angleConfig.required && <div className="w-12" />}
                </div>
            </header>

            {/* AR Guide Overlay */}
            <main className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">

                {/* Guide Frame */}
                <div className="relative w-80 h-80 lg:w-96 lg:h-96">

                    {/* Reticle */}
                    <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-3xl" />

                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-[4px] border-l-[4px] border-primary rounded-tl-2xl -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-[4px] border-r-[4px] border-primary rounded-tr-2xl -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[4px] border-l-[4px] border-primary rounded-bl-2xl -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[4px] border-r-[4px] border-primary rounded-br-2xl -mb-0.5 -mr-0.5" />

                    {/* Angle Icon */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-2">
                                <span className="text-5xl">{angleConfig.icon}</span>
                            </div>
                            <p className="text-white font-bold text-lg">{angleConfig.label}</p>
                        </div>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-8 pointer-events-auto max-w-md">
                    <div className="glass-panel px-6 py-4 rounded-xl bg-black/60 backdrop-blur-md border border-primary/30">
                        <p className="text-white text-center font-medium mb-2">
                            {angleConfig.description}
                        </p>
                        <p className="text-white/70 text-sm text-center">
                            💡 {angleConfig.helpText}
                        </p>
                    </div>
                </div>
            </main>

            {/* Bottom Controls */}
            <footer className="absolute bottom-0 left-0 w-full z-30 pb-10 pt-6 px-6">

                {/* Progress Bar */}
                <div className="mb-6 px-8">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-white/70 text-xs text-center mt-2">
                        {session.completedCount} / {session.requiredCount} required angles
                    </p>
                </div>

                {/* Capture Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleCapture}
                        disabled={capturing}
                        className="relative group cursor-pointer transform active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {/* Outer Glow Ring */}
                        <div className="absolute -inset-1 bg-primary/30 rounded-full blur-md group-hover:bg-primary/50 transition-all" />

                        {/* Outer Stroke Ring */}
                        <div className="w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center relative z-10">
                            {/* Inner Fill */}
                            <div className={`w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-inner ${capturing ? 'animate-pulse' : ''}`}>
                                <span className="text-white text-3xl">📷</span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Angles Checklist */}
                <div className="mt-6 flex justify-center gap-2">
                    {Object.values(SCAN_ANGLES).map((angle) => (
                        <div
                            key={angle.id}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${session.capturedAngles.has(angle.id)
                                    ? 'bg-access-green/20 border-access-green'
                                    : angle.id === currentAngle
                                        ? 'bg-primary/20 border-primary animate-pulse'
                                        : 'bg-white/5 border-white/20'
                                }`}
                        >
                            <span className="text-lg">{angle.icon}</span>
                        </div>
                    ))}
                </div>
            </footer>
        </div>
    );
}
