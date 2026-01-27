"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Brain, Shield, ShieldAlert, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export interface ReasoningStep {
    step: number;
    text: string;
    confidence?: number; // 0-100
    dataSource?: string; // e.g., "NAFDAC API", "WHO Guidelines"
    timestamp: Date;
    status?: 'pending' | 'active' | 'complete';
}

export interface FinalVerdict {
    status: 'SAFE' | 'SUSPICIOUS' | 'COUNTERFEIT' | 'APPROVED' | 'FLAGGED';
    confidence: number;
    reasoning: string;
}

interface AgentThoughtStreamProps {
    agentName: string;
    agentType: 'forensic' | 'stewardship' | 'sentinel' | 'guardian' | 'counselor';
    steps: ReasoningStep[];
    isThinking: boolean;
    finalVerdict?: FinalVerdict;
    compact?: boolean;
}

const AGENT_COLORS = {
    forensic: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', icon: 'text-yellow-500' },
    stewardship: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
    sentinel: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
    guardian: { bg: 'bg-reserve-red/10', border: 'border-reserve-red/20', text: 'text-reserve-red', icon: 'text-reserve-red' },
    counselor: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
};

const AGENT_ICONS = {
    forensic: Zap,
    stewardship: Brain,
    sentinel: Shield,
    guardian: ShieldAlert,
    counselor: MessageSquare,
};

export function AgentThoughtStream({
    agentName,
    agentType,
    steps,
    isThinking,
    finalVerdict,
    compact = false
}: AgentThoughtStreamProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const colors = AGENT_COLORS[agentType];
    const AgentIcon = AGENT_ICONS[agentType];

    return (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden backdrop-blur-sm`}>
            {/* Header */}
            <div
                className="px-4 py-3 border-b border-current/10 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                        <AgentIcon size={16} className={colors.icon} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-wider ${colors.text}`}>
                            {agentName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {isThinking ? 'Processing...' : `${steps.length} reasoning steps`}
                        </p>
                    </div>
                </div>

                {isThinking && (
                    <div className="flex items-center gap-2">
                        <Loader2 size={16} className={`${colors.text} animate-spin`} />
                        <span className={`text-xs font-bold uppercase ${colors.text}`}>Analyzing</span>
                    </div>
                )}
            </div>

            {/* Reasoning Steps */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={`p-4 space-y-3 ${compact ? 'max-h-60 overflow-y-auto' : ''}`}>
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.step}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex gap-3"
                                >
                                    {/* Step Number */}
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                                        {step.status === 'complete' ? (
                                            <CheckCircle size={14} className={colors.icon} />
                                        ) : (
                                            <span className={`text-xs font-bold ${colors.text}`}>{step.step}</span>
                                        )}
                                    </div>

                                    {/* Step Content */}
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white leading-relaxed">
                                            {step.text}
                                        </p>

                                        {/* Metadata Row */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {step.dataSource && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-bold border ${colors.border}`}>
                                                    📊 {step.dataSource}
                                                </span>
                                            )}
                                            {step.confidence !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${step.confidence}%` }}
                                                            className={`h-full ${step.confidence > 80 ? 'bg-access-green' : step.confidence > 50 ? 'bg-watch-orange' : 'bg-reserve-red'}`}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                                        {step.confidence}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isThinking && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono pl-9"
                                >
                                    <span className="animate-pulse">▋</span>
                                    <span>Processing data...</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Final Verdict */}
                        {finalVerdict && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`border-t ${colors.border} p-4 ${finalVerdict.status === 'SAFE' || finalVerdict.status === 'APPROVED'
                                        ? 'bg-access-green/10'
                                        : finalVerdict.status === 'SUSPICIOUS' || finalVerdict.status === 'FLAGGED'
                                            ? 'bg-watch-orange/10'
                                            : 'bg-reserve-red/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-black uppercase tracking-wider">
                                        Final Verdict
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${finalVerdict.confidence}%` }}
                                                className={`h-full ${finalVerdict.confidence > 80 ? 'bg-access-green' :
                                                        finalVerdict.confidence > 50 ? 'bg-watch-orange' : 'bg-reserve-red'
                                                    }`}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{finalVerdict.confidence}%</span>
                                    </div>
                                </div>
                                <div className={`text-lg font-black mb-1 ${finalVerdict.status === 'SAFE' || finalVerdict.status === 'APPROVED'
                                        ? 'text-access-green'
                                        : finalVerdict.status === 'SUSPICIOUS' || finalVerdict.status === 'FLAGGED'
                                            ? 'text-watch-orange'
                                            : 'text-reserve-red'
                                    }`}>
                                    {finalVerdict.status}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {finalVerdict.reasoning}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
