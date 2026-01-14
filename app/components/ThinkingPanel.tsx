"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Brain, Shield, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface Thought {
    id: string;
    text: string;
    level: "forensic" | "sentinel" | "system";
    timestamp: Date;
}

interface ThinkingPanelProps {
    thoughts: Thought[];
    isAnalyzing: boolean;
    agentName?: string;
}

export function ThinkingPanel({ thoughts, isAnalyzing, agentName = "Ndunari Sentinel" }: ThinkingPanelProps) {
    const [displayThoughts, setDisplayThoughts] = useState<Thought[]>([]);

    useEffect(() => {
        // Only show last 5 thoughts to keep it clean
        setDisplayThoughts(thoughts.slice(-5));
    }, [thoughts]);

    return (
        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden bg-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{agentName} Monologue</span>
                </div>
                {isAnalyzing && (
                    <div className="flex items-center gap-1">
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                        />
                        <span className="text-[10px] text-primary/80 font-medium">THINKING</span>
                    </div>
                )}
            </div>

            {/* Thought Stream */}
            <div className="p-4 space-y-3 min-h-[140px] font-mono">
                <AnimatePresence mode="popLayout">
                    {displayThoughts.length === 0 && !isAnalyzing ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-6 text-white/20"
                        >
                            <Brain size={24} className="mb-2 opacity-10" />
                            <span className="text-[10px] uppercase tracking-tighter italic">Awaiting Signal</span>
                        </motion.div>
                    ) : (
                        displayThoughts.map((thought, index) => (
                            <motion.div
                                key={thought.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex gap-3 text-[11px]"
                            >
                                <div className="mt-0.5">
                                    {thought.level === 'forensic' && <Zap size={12} className="text-yellow-400" />}
                                    {thought.level === 'sentinel' && <Shield size={12} className="text-primary" />}
                                    {thought.level === 'system' && <Terminal size={12} className="text-white/40" />}
                                </div>
                                <div className="flex-1">
                                    <span className={`font-bold mr-2 ${thought.level === 'forensic' ? 'text-yellow-400/80' :
                                            thought.level === 'sentinel' ? 'text-primary/80' : 'text-white/40'
                                        }`}>
                                        [{thought.level.toUpperCase()}]
                                    </span>
                                    <span className="text-white/90 leading-relaxed shadow-sm">
                                        {thought.text}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>

                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-[10px] text-primary/40 font-mono"
                    >
                        <span className="animate-pulse">_</span>
                        <span>Iterating on supply chain vectors...</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
