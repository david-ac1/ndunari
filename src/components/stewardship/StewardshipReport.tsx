'use client';

import { useState } from 'react';
import { StewardshipResponse } from '@/lib/agents/stewardship_brain';

interface StewardshipReportProps {
    data: StewardshipResponse;
}

const COLORS = {
    safe: "bg-green-600",
    caution: "bg-yellow-500",
    danger: "bg-red-700",
};

export function StewardshipReport({ data }: StewardshipReportProps) {
    const [showReasoning, setShowReasoning] = useState(false);

    // High-Alert check
    const isReserve = data.classification === 'Reserve';
    const riskKey = data.riskLevel as keyof typeof COLORS;
    const statusColor = isReserve ? COLORS.danger : COLORS[riskKey] || "bg-gray-500";

    const handlePlayAudio = (lang: string, text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-NG";
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className={`rounded-3xl overflow-hidden shadow-2xl ${isReserve ? 'ring-4 ring-red-600 animate-pulse-slow' : ''}`}>

            {/* 1. Header with Classification */}
            <div className={`${statusColor} p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">
                        {data.classification} GROUP
                    </h2>
                    <span className="material-symbols-outlined text-4xl">
                        {isReserve ? 'warning' : 'verified_user'}
                    </span>
                </div>
                <p className="text-white/80 font-medium text-sm">
                    {isReserve
                        ? "CRITICAL ATTENTION: LAST-RESORT ANTIBIOTIC"
                        : "WHO AWaRe Classification 2025"}
                </p>
            </div>

            <div className="bg-white p-6 space-y-6">

                {/* 2. Clinical Justification */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Stewardship Brain Analysis
                    </h3>
                    <p className="text-gray-800 text-lg leading-relaxed font-semibold">
                        {data.clinicalJustification}
                    </p>
                </div>

                {/* 3. Thinking Trace (Collapsible) */}
                <div>
                    <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="flex items-center gap-2 text-xs font-bold text-[#0A4D3C] hover:underline"
                    >
                        <span className="material-symbols-outlined text-sm">psychology</span>
                        {showReasoning ? "Hide Thinking Trace" : "View Agent Reasoning"}
                    </button>

                    {showReasoning && (
                        <div className="mt-3 p-4 bg-gray-100 rounded-xl text-xs font-mono text-gray-600 border border-gray-200">
                            <p className="mb-2 font-bold text-gray-400">THOUGHT_SIGNATURE::{data.thoughtSignature.slice(0, 15)}...</p>
                            <p className="italic">
                                "Analyzing AWaRe status... Checking NCDC resistance patterns... Validating dosage safety..."
                            </p>
                        </div>
                    )}
                </div>

                {/* 4. Multilingual Counselor */}
                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Patient Counseling (Narị AI)
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                        {data.localGuidance.map((guide, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-[#0A4D3C] text-white flex items-center justify-center text-[10px] font-bold">
                                        {guide.language.substring(0, 2).toUpperCase()}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {guide.language} Guidance
                                    </span>
                                </div>
                                <button
                                    onClick={() => handlePlayAudio(guide.language, guide.advice)}
                                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0A4D3C] hover:bg-[#0A4D3C] hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined">volume_up</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
