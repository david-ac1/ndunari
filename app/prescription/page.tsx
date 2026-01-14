"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { savePrescription } from "@/lib/services/prescription-storage.service";

interface StewardshipResult {
    drugName: string;
    awareCategory: "ACCESS" | "WATCH" | "RESERVE" | "UNKNOWN";
    riskLevel: "low" | "medium" | "high" | "critical";
    recommendations: string[];
    alternatives?: string[];
    counseling: {
        english: string;
        pidgin?: string;
        yoruba?: string;
        hausa?: string;
        igbo?: string;
    };
    warningFlags: string[];
}

export default function PrescriptionPage() {
    const { user } = useAuth();
    const { speak, stop, speaking, enabled } = useVoiceGuide();
    const [drugName, setDrugName] = useState("");
    const [indication, setIndication] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<StewardshipResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Auto-read result when it arrives
    useEffect(() => {
        if (result && enabled) {
            handleReadResult('english');
        }
    }, [result, enabled]);

    const handleReadResult = useCallback((lang: 'english' | 'pidgin' = 'english') => {
        if (!result) return;
        const summary = `${result.drugName} is classified by WHO as ${result.awareCategory}. The risk level is ${result.riskLevel}. ${result.counseling[lang as keyof typeof result.counseling] || result.counseling.english}`;
        speak(summary, lang as any);
    }, [result, speak]);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!drugName.trim()) {
            setError("Please enter a drug name");
            return;
        }

        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drugName: drugName.trim(),
                    indication: indication.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }


            setResult(data.data);

            // Save to Supabase (Cloud Storage)
            if (user && data.data) {
                await savePrescription({
                    drugName: data.data.drugName,
                    indication: indication.trim() || undefined,
                    awareCategory: data.data.awareCategory,
                    riskLevel: data.data.riskLevel,
                    recommendations: data.data.recommendations,
                    alternatives: data.data.alternatives,
                    warningFlags: data.data.warningFlags,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze prescription');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setDrugName("");
        setIndication("");
        setResult(null);
        setError(null);
    };

    const getAwaReBadgeColor = (category: string) => {
        switch (category) {
            case 'ACCESS': return 'bg-access-green/20 border-access-green text-access-green';
            case 'WATCH': return 'bg-watch-orange/20 border-watch-orange text-watch-orange';
            case 'RESERVE': return 'bg-reserve-red/20 border-reserve-red text-reserve-red';
            default: return 'bg-gray-500/20 border-gray-500 text-gray-500';
        }
    };

    const getRiskBadgeColor = (level: string) => {
        switch (level) {
            case 'low': return 'bg-access-green/20 border-access-green text-access-green';
            case 'medium': return 'bg-watch-orange/20 border-watch-orange text-watch-orange';
            case 'high': return 'bg-reserve-red/20 border-reserve-red text-reserve-red';
            case 'critical': return 'bg-reserve-red border-reserve-red text-white';
            default: return 'bg-gray-500/20 border-gray-500 text-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
                        <span className="text-2xl">←</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Prescription Analyzer</h1>
                        <p className="text-sm text-white/70">WHO AWaRe Classification & Stewardship</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">

                {/* Input Form */}
                <section className="glass-panel p-6 lg:p-8 rounded-2xl mb-8 border border-white/10">
                    <form onSubmit={handleAnalyze} className="space-y-6">
                        {/* Drug Name */}
                        <div>
                            <label htmlFor="drugName" className="block text-sm font-bold text-white mb-2">
                                Drug Name <span className="text-reserve-red">*</span>
                            </label>
                            <input
                                id="drugName"
                                type="text"
                                value={drugName}
                                onChange={(e) => setDrugName(e.target.value)}
                                placeholder="e.g., Ciprofloxacin, Amoxicillin, Azithromycin"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
                                disabled={analyzing}
                            />
                        </div>

                        {/* Indication (Optional) */}
                        <div>
                            <label htmlFor="indication" className="block text-sm font-bold text-white mb-2">
                                Medical Indication <span className="text-white/50">(Optional)</span>
                            </label>
                            <input
                                id="indication"
                                type="text"
                                value={indication}
                                onChange={(e) => setIndication(e.target.value)}
                                placeholder="e.g., Urinary tract infection, Pneumonia"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
                                disabled={analyzing}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-xl bg-reserve-red/10 border border-reserve-red/30">
                                <p className="text-sm text-reserve-red font-medium">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={analyzing || !drugName.trim()}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {analyzing ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <span>🔍</span>
                                    Analyze Prescription
                                </>
                            )}
                        </button>
                    </form>
                </section>

                {/* Results */}
                {result && (
                    <div className="space-y-6">
                        {/* Classification Header */}
                        <section className="glass-panel p-6 lg:p-8 rounded-2xl border border-white/10">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-3xl font-bold text-white">{result.drugName}</h2>
                                        <button
                                            onClick={() => speaking ? stop() : handleReadResult('english')}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${speaking ? 'bg-primary animate-pulse text-white' : 'bg-white/10 text-primary hover:bg-primary/20'}`}
                                            title="Read Result (English)"
                                        >
                                            {speaking ? '⏹️' : '🔊'}
                                        </button>
                                        {result.counseling.pidgin && (
                                            <button
                                                onClick={() => speaking ? stop() : handleReadResult('pidgin')}
                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60 flex items-center gap-1.5 transition-colors"
                                                title="Read in Pidgin"
                                            >
                                                🇳🇬 Pidgin
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-white/70">Antibiotic Stewardship Assessment</p>
                                </div>
                                <div className="flex gap-3">
                                    {/* AWaRe Badge */}
                                    <div className={`px-6 py-3 rounded-xl border-2 ${getAwaReBadgeColor(result.awareCategory)}`}>
                                        <p className="text-xs font-bold uppercase mb-1">WHO AWaRe</p>
                                        <p className="text-2xl font-bold">{result.awareCategory}</p>
                                    </div>
                                    {/* Risk Badge */}
                                    <div className={`px-6 py-3 rounded-xl border-2 ${getRiskBadgeColor(result.riskLevel)}`}>
                                        <p className="text-xs font-bold uppercase mb-1">Risk Level</p>
                                        <p className="text-2xl font-bold capitalize">{result.riskLevel}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Warning Flags */}
                        {result.warningFlags && result.warningFlags.length > 0 && (
                            <section className="p-6 rounded-xl bg-reserve-red/10 border-2 border-reserve-red/30">
                                <h3 className="font-bold text-lg text-reserve-red mb-4 flex items-center gap-2">
                                    <span className="text-2xl">⚠️</span> Warning Flags
                                </h3>
                                <ul className="space-y-2">
                                    {result.warningFlags.map((flag, i) => (
                                        <li key={i} className="text-white/90 flex items-start gap-2">
                                            <span className="text-reserve-red mt-1">•</span>
                                            <span>{flag}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Recommendations */}
                        <section className="glass-panel p-6 rounded-xl border border-white/10">
                            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                <span className="text-xl">💡</span> Recommendations
                            </h3>
                            <ul className="space-y-3">
                                {result.recommendations.map((rec, i) => (
                                    <li key={i} className="text-white/90 flex items-start gap-3">
                                        <span className="text-primary mt-1">✓</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Safer Alternatives */}
                        {result.alternatives && result.alternatives.length > 0 && (
                            <section className="glass-panel p-6 rounded-xl border border-access-green/30">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">🔄</span> Safer Alternatives
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.alternatives.map((alt, i) => (
                                        <span
                                            key={i}
                                            className="px-4 py-2 rounded-full bg-access-green/10 border border-access-green/30 text-access-green font-medium text-sm"
                                        >
                                            {alt}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Multilingual Counseling */}
                        <section className="space-y-4">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <span className="text-xl">🗣️</span> Patient Counseling
                            </h3>

                            {/* English */}
                            <div className="glass-panel p-6 rounded-xl border border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl">🇬🇧</span>
                                    <h4 className="font-bold text-white">English</h4>
                                </div>
                                <p className="text-white/90 leading-relaxed">{result.counseling.english}</p>
                            </div>

                            {/* Nigerian Pidgin */}
                            {result.counseling.pidgin && (
                                <div className="glass-panel p-6 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">🇳🇬</span>
                                        <h4 className="font-bold text-white">Nigerian Pidgin</h4>
                                    </div>
                                    <p className="text-white/90 leading-relaxed">{result.counseling.pidgin}</p>
                                </div>
                            )}
                        </section>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleReset}
                                className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
                            >
                                Analyze Another
                            </button>
                            <Link
                                href="/"
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors text-center"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
