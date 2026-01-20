"use client";

import { CheckCircle, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export type AngleType = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export interface AngleGuidanceProps {
    targetAngle: AngleType;
    capturedAngles: AngleType[];
    totalRequired: number;
}

const ANGLE_INSTRUCTIONS: Record<AngleType, string> = {
    front: "Position the package front label facing the camera",
    back: "Rotate 180° to show the back of the package",
    left: "Rotate to show the left side of the package",
    right: "Rotate to show the right side of the package",
    top: "Tilt to show the top of the package",
    bottom: "Tilt to show the bottom of the package"
};

const ANGLE_DISPLAY_NAMES: Record<AngleType, string> = {
    front: "Front View",
    back: "Back View",
    left: "Left Side",
    right: "Right Side",
    top: "Top View",
    bottom: "Bottom View"
};

export default function AngleGuidance({ targetAngle, capturedAngles, totalRequired }: AngleGuidanceProps) {
    const allAngles: AngleType[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const requiredAngles = allAngles.slice(0, totalRequired);
    const progress = capturedAngles.length;
    const progressPercent = (progress / totalRequired) * 100;

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-white/70 font-mono">
                        Capturing Angles: {progress}/{totalRequired}
                    </span>
                    <span className="text-primary font-bold font-mono">
                        {Math.round(progressPercent)}%
                    </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary to-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Current Target Angle */}
            <motion.div
                key={targetAngle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 border-2 border-primary"
            >
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                            {progress + 1}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {ANGLE_DISPLAY_NAMES[targetAngle]}
                        </h3>
                        <p className="text-sm text-white/70 font-mono">
                            Current target angle
                        </p>
                    </div>
                </div>
                <p className="text-white/90 leading-relaxed">
                    {ANGLE_INSTRUCTIONS[targetAngle]}
                </p>

                {/* Best Practices */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <p className="text-xs text-white/50 font-mono uppercase tracking-widest">
                        Tips for Best Results
                    </p>
                    <ul className="text-sm text-white/70 space-y-1">
                        <li>• Hold the camera steady</li>
                        <li>• Ensure good, even lighting</li>
                        <li>• Frame the entire package in view</li>
                    </ul>
                </div>
            </motion.div>

            {/* Angle Checklist */}
            <div className="glass-panel p-4 rounded-2xl space-y-2">
                <p className="text-xs text-white/50 font-mono uppercase tracking-widest mb-3">
                    Progress Checklist
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {requiredAngles.map((angle) => {
                        const isCaptured = capturedAngles.includes(angle);
                        const isCurrent = angle === targetAngle;

                        return (
                            <motion.div
                                key={angle}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent
                                        ? 'bg-primary/20 border-2 border-primary'
                                        : isCaptured
                                            ? 'bg-green-500/10 border border-green-500/30'
                                            : 'bg-white/5 border border-white/10'
                                    }`}
                            >
                                {isCaptured ? (
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                ) : (
                                    <Circle className={`w-5 h-5 flex-shrink-0 ${isCurrent ? 'text-primary' : 'text-white/30'
                                        }`} />
                                )}
                                <span className={`text-sm font-bold ${isCaptured
                                        ? 'text-green-400'
                                        : isCurrent
                                            ? 'text-primary'
                                            : 'text-white/50'
                                    }`}>
                                    {ANGLE_DISPLAY_NAMES[angle]}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Completion Indicator */}
            {progress === totalRequired && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400"
                >
                    <div className="flex items-center gap-4">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                        <div>
                            <h3 className="text-xl font-bold text-green-400">
                                All Angles Captured!
                            </h3>
                            <p className="text-white/70 text-sm">
                                Ready to process 3D verification scan
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
