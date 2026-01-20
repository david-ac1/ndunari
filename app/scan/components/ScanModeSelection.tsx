"use client";

import { motion } from 'framer-motion';
import { Camera, Scan, X } from 'lucide-react';

export interface ScanModeSelectionProps {
    onSelectMode: (mode: 'quick' | 'multi-angle') => void;
    onCancel: () => void;
}

export default function ScanModeSelection({ onSelectMode, onCancel }: ScanModeSelectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-2xl w-full glass-panel p-8 rounded-3xl relative"
            >
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X className="w-6 h-6 text-white/70" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Choose Scan Mode
                    </h2>
                    <p className="text-white/70">
                        Select the type of forensic analysis you need
                    </p>
                </div>

                {/* Mode Options */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Quick Scan */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectMode('quick')}
                        className="glass-panel p-6 rounded-2xl text-left hover:bg-white/10 transition-all border-2 border-transparent hover:border-primary group"
                    >
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Quick Scan</h3>
                        <p className="text-sm text-white/70 mb-4">
                            Fast analysis from a single photo. Ideal for routine verification and quick authenticity checks.
                        </p>
                        <div className="space-y-1 text-xs text-white/50">
                            <p>• 1 photo required</p>
                            <p>• ~5-10 second analysis</p>
                            <p>• 2D forensic report</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <span className="text-sm font-bold text-primary">
                                Recommended for most scans →
                            </span>
                        </div>
                    </motion.button>

                    {/* 3D Verification Scan */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectMode('multi-angle')}
                        className="glass-panel p-6 rounded-2xl text-left hover:bg-white/10 transition-all border-2 border-transparent hover:border-blue-400 group relative overflow-hidden"
                    >
                        {/* Premium Badge */}
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-bold text-white">
                            PREMIUM
                        </div>

                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Scan className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">
                            3D Verification Scan
                        </h3>
                        <p className="text-sm text-white/70 mb-4">
                            Comprehensive multi-angle analysis with 3D reconstruction. For high-security verification and detailed forensic reports.
                        </p>
                        <div className="space-y-1 text-xs text-white/50">
                            <p>• 4-6 photos (guided capture)</p>
                            <p>• ~20-30 second analysis</p>
                            <p>• 3D model + enhanced forensic report</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <span className="text-sm font-bold text-blue-400">
                                Maximum accuracy & detail →
                            </span>
                        </div>
                    </motion.button>
                </div>

                {/* Info Footer */}
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/50 text-center">
                        💡 All scans are stored in the National Ledger for permanent record-keeping
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
