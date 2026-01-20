"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { normalizeError, getUserMessage, logError } from "@/lib/errors/app-errors";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { savePrescription } from "@/lib/services/prescription-storage.service";
import { Shield, Search, FileText, AlertTriangle, Info, CheckCircle2, TrendingUp, Users, Activity } from "lucide-react";

interface StewardshipResult {
    drugName: string;
    awareCategory: "ACCESS" | "WATCH" | "RESERVE" | "UNKNOWN";
    riskLevel: "low" | "medium" | "high" | "critical";
    recommendations: string[];
    regulatoryGuidelines?: string[];
    counseling: {
        english: string;
        pidgin?: string;
    };
    warningFlags: string[];
    futureImpact?: {
        projection2030: string;
        communityRisk: string;
        publicHealthSafetyScore: number;
    };
}

export default function PrescriptionPage() {
    const { user } = useAuth();
    const { speak, stop, speaking, enabled } = useVoiceGuide();
    const [drugName, setDrugName] = useState("");
    const [context, setContext] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<StewardshipResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleReadResult = useCallback((lang: 'english' | 'pidgin' = 'english') => {
        if (!result) return;
        const summary = `Stewardship Audit for ${result.drugName}. WHO Classification is ${result.awareCategory}. ${result.counseling[lang as keyof typeof result.counseling] || result.counseling.english}`;
        speak(summary, lang as any);
    }, [result, speak]);

    useEffect(() => {
        if (result && enabled) {
            handleReadResult('english');
        }
    }, [result, enabled, handleReadResult]);

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!drugName.trim()) return setError("Drug name required for audit");

        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drugName: drugName.trim(),
                    indication: context.trim() || undefined
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Audit failed');

            setResult(data.data);

            if (user) {
                await savePrescription({
                    drugName: data.data.drugName,
                    indication: context.trim() || undefined,
                    awareCategory: data.data.awareCategory,
                    riskLevel: data.data.riskLevel,
                    recommendations: data.data.recommendations,
                    warningFlags: data.data.warningFlags,
                });
            }
        } catch (err) {
            console.error("RAW PRE-NORMALIZATION ERROR:", err);
            const error = normalizeError(err);
            console.error("Stewardship Analysis failed:", error.message);
            setError(getUserMessage(error));
            logError(error, 'PrescriptionPage.analyzePrescription');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setDrugName("");
        setContext("");
        setError(null);
        stop();
    };

    const getAwaReStyle = (cat: string) => {
        switch (cat) {
            case 'ACCESS': return 'text-access-green border-access-green bg-access-green/10';
            case 'WATCH': return 'text-watch-orange border-watch-orange bg-watch-orange/10';
            case 'RESERVE': return 'text-reserve-red border-reserve-red bg-reserve-red/10';
            default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-white">
            <header className="sticky top-0 z-30 pt-6 px-4 mb-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between p-4 glass-panel rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                    <Link href="/" className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                        <span className="text-xl">←</span>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-sm font-black tracking-[0.2em] uppercase italic">AMR Stewardship Auditor</h1>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Regulatory Intelligence Node</p>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pb-20">
                {/* Audit Form */}
                <section className="glass-panel p-8 rounded-3xl border border-white/10 mb-8 bg-black/20">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-primary" size={24} />
                        <h2 className="text-lg font-black uppercase tracking-tight text-white/90">Audit Parameters</h2>
                    </div>

                    <form onSubmit={handleAudit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-1">Antibiotic Molecule</label>
                                <input
                                    value={drugName}
                                    onChange={e => setDrugName(e.target.value)}
                                    placeholder="e.g. Meropenem, Amoxicillin"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary outline-none transition-all placeholder:text-white/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-1">Justification/Context</label>
                                <input
                                    value={context}
                                    onChange={e => setContext(e.target.value)}
                                    placeholder="e.g. Hospital use, Community circulation"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary outline-none transition-all placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        {error && <p className="text-reserve-red text-xs font-bold px-1">{error}</p>}

                        <button
                            disabled={analyzing}
                            className="w-full py-5 bg-primary rounded-2xl font-black uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {analyzing ? (
                                <><span className="animate-spin">🔄</span> Generating Audit Directive...</>
                            ) : (
                                <><Search size={18} /> Run Stewardship Audit</>
                            )}
                        </button>
                    </form>
                </section>

                {/* Audit Result View */}
                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Card */}
                        <div className="glass-panel p-8 rounded-3xl border-2 border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <CheckCircle2 className="text-primary opacity-20" size={80} />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-black uppercase tracking-tighter">{result.drugName}</h2>
                                        <button onClick={() => speaking ? stop() : handleReadResult()} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                                            {speaking ? <span className="animate-pulse">⏹️</span> : <Info size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-white/50 uppercase tracking-widest">Regulatory Classification Report</p>
                                </div>

                                <div className="flex gap-4">
                                    <div className={`px-6 py-4 rounded-2xl border-2 ${getAwaReStyle(result.awareCategory)}`}>
                                        <p className="text-[10px] font-black uppercase mb-1">WHO AWaRe</p>
                                        <p className="text-xl font-black">{result.awareCategory}</p>
                                    </div>
                                    <div className="px-6 py-4 rounded-2xl border-2 border-white/10 bg-white/5">
                                        <p className="text-[10px] font-black uppercase mb-1">Risk Rating</p>
                                        <p className="text-xl font-black capitalize">{result.riskLevel}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Regulatory Alerts */}
                        {result.warningFlags.length > 0 && (
                            <div className="bg-reserve-red/10 border-2 border-reserve-red/30 p-6 rounded-3xl space-y-4">
                                <h3 className="flex items-center gap-2 text-reserve-red font-black uppercase text-sm">
                                    <AlertTriangle size={18} /> Stewardship Red Flags
                                </h3>
                                <ul className="space-y-3">
                                    {result.warningFlags.map((flag, i) => (
                                        <li key={i} className="text-sm font-medium text-white/80 flex items-start gap-3">
                                            <span className="text-reserve-red mt-1 text-lg">•</span>
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Stewardship Framework */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/20">
                                <h3 className="flex items-center gap-2 text-primary font-black uppercase text-xs mb-4">
                                    <FileText size={16} /> Audit Directives
                                </h3>
                                <ul className="space-y-3">
                                    {result.recommendations.map((rec, i) => (
                                        <li key={i} className="text-xs font-medium text-white/70 leading-relaxed border-l-2 border-primary/30 pl-3">
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/20">
                                <h3 className="flex items-center gap-2 text-white/50 font-black uppercase text-xs mb-4">
                                    <Shield size={16} /> Regulatory Guidelines
                                </h3>
                                <ul className="space-y-3">
                                    {result.regulatoryGuidelines?.map((guide, i) => (
                                        <li key={i} className="text-xs font-bold text-white/40 italic flex gap-2">
                                            <span>§</span> {guide}
                                        </li>
                                    )) || <li className="text-xs text-white/20 italic">No specific regional guidelines found.</li>}
                                </ul>
                            </div>
                        </div>

                        {/* Predictive AMR Simulator */}
                        {result.futureImpact && (
                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-2">Predictive AMR Simulator (Projected 2030)</h3>
                                <div className="glass-panel p-8 rounded-[2.5rem] border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
                                    {/* Animated grid background */}
                                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                                        style={{ backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="flex flex-col items-center justify-center text-center p-4">
                                            <div className="relative w-24 h-24 mb-4">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                        strokeDasharray={251.2}
                                                        strokeDashoffset={251.2 - (251.2 * result.futureImpact.publicHealthSafetyScore) / 100}
                                                        className="text-primary transition-all duration-1000 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-black">{result.futureImpact.publicHealthSafetyScore}</span>
                                                    <span className="text-[8px] font-black uppercase text-white/40">Safety</span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Community Safety Score</p>
                                        </div>

                                        <div className="md:col-span-2 space-y-6">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp size={14} className="text-reserve-red" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Resistance Projection</span>
                                                    </div>
                                                    <span className="text-sm font-black text-reserve-red">{result.futureImpact.projection2030}</span>
                                                </div>
                                                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                                    <div className="h-full bg-gradient-to-r from-primary to-reserve-red animate-pulse" style={{ width: '70%' }} />
                                                </div>
                                            </div>

                                            <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                                <div className="p-2 rounded-xl bg-primary/10 h-fit">
                                                    <Users size={20} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Community Risk Simulation</p>
                                                    <p className="text-xs font-medium text-white/80 leading-relaxed italic">
                                                        "{result.futureImpact.communityRisk}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action HUD Accent */}
                                    <div className="absolute top-0 right-0 p-4">
                                        <Activity size={24} className="text-primary/20 animate-pulse" />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Public Health Narrative */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-2">Public Health Signal (Multilingual)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <p className="text-[10px] font-black uppercase text-primary mb-3">English Narrative</p>
                                    <p className="text-sm text-white/80 leading-relaxed font-medium">{result.counseling.english}</p>
                                </div>
                                {result.counseling.pidgin && (
                                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                        <p className="text-[10px] font-black uppercase text-primary mb-3">Pidgin Narrative</p>
                                        <p className="text-sm text-white/80 leading-relaxed font-medium">{result.counseling.pidgin}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <button onClick={handleReset} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                            Initiate New Audit Cycle
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
