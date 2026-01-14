"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getScanHistory, type ScanHistoryItem } from "@/lib/utils/scan-history";
import { VoiceController } from "@/app/components/VoiceController";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { getUserScans } from "@/lib/services/scan-storage.service";
import { sentinelAgentService, type SentinelDirective } from "@/lib/gemini/sentinel-agent.service";
import { ThinkingPanel } from "@/app/components/ThinkingPanel";
import { Shield, Activity, Search, AlertCircle, Zap, TrendingUp, Map as MapIcon, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const [stats, setStats] = useState({ total: 0, safe: 0, suspicious: 0, counterfeit: 0 });
    const [isSyncing, setIsSyncing] = useState(false);

    // Sentinel State
    const [directives, setDirectives] = useState<SentinelDirective[]>([]);
    const [isSentinelThinking, setIsSentinelThinking] = useState(false);
    const [sentinelThoughts, setSentinelThoughts] = useState<{ id: string, text: string, level: 'forensic' | 'sentinel' | 'system', timestamp: Date }[]>([]);

    const displayName = profile?.display_name || user?.email?.split('@')[0] || "Health Guardian";

    const loadHistoryAndAnalyze = useCallback(async () => {
        setIsSyncing(true);
        setIsSentinelThinking(true);
        setSentinelThoughts([{ id: '1', text: "Sentinel Node Online. Initiating historical audit...", level: 'system', timestamp: new Date() }]);

        try {
            // 1. Load History
            const localHistory = getScanHistory();
            let combinedHistory = [...localHistory];

            if (user) {
                const { data: cloudScans } = await getUserScans();
                if (cloudScans) {
                    const mapped = cloudScans.map(s => ({
                        id: s.id,
                        timestamp: new Date(s.created_at).getTime(),
                        drugName: s.drug_name,
                        authenticityScore: s.authenticity_score,
                        riskLevel: s.risk_level,
                        nafdacNumber: s.nafdac_number || undefined,
                        imagePreview: s.image_preview || undefined
                    }));
                    const existingIds = new Set(localHistory.map(l => l.id));
                    combinedHistory = [...localHistory, ...mapped.filter(cs => !existingIds.has(cs.id))];
                }
            }

            combinedHistory.sort((a, b) => b.timestamp - a.timestamp);
            setScanHistory(combinedHistory.slice(0, 3));

            setStats({
                total: profile?.total_scans || combinedHistory.length,
                safe: combinedHistory.filter(s => s.riskLevel === 'safe').length,
                suspicious: combinedHistory.filter(s => s.riskLevel === 'suspicious').length,
                counterfeit: combinedHistory.filter(s => s.riskLevel === 'counterfeit').length
            });

            // 2. Autonomous Sentinel Analysis
            setSentinelThoughts(prev => [...prev, { id: '2', text: "Identifying regional pattern anomalies...", level: 'sentinel', timestamp: new Date() }]);
            const newDirectives = await sentinelAgentService.analyzeSurveillanceLogs(combinedHistory.slice(0, 50));
            setDirectives(newDirectives);
            setSentinelThoughts(prev => [...prev, { id: '3', text: `Audit complete. ${newDirectives.length} directives issued.`, level: 'system', timestamp: new Date() }]);

        } catch (error) {
            console.error('Sentinel failure:', error);
        } finally {
            setIsSyncing(false);
            setIsSentinelThinking(false);
        }
    }, [user, profile]);

    useEffect(() => {
        if (!authLoading) loadHistoryAndAnalyze();
    }, [user, authLoading, loadHistoryAndAnalyze]);

    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden pb-24 lg:pb-8 bg-background-dark text-white">
            {/* Background Aesthetics */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="relative z-20 px-6 py-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-2xl text-primary hover:scale-105 transition-all">
                            {displayName?.[0] || 'N'}
                        </Link>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                {displayName}
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            </h1>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Sentinel Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <VoiceController />
                        <Link href="/notifications" className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center hover:bg-white/10 transition-all">
                            <Activity size={20} className="text-white/60" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 px-6 max-w-7xl mx-auto w-full space-y-8 pb-10">

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Primary Flow (8 Columns) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Sentinel Directives (Autonomous Engine Results) */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Autonomous Directives</h2>
                                {isSentinelThinking && <span className="text-[10px] font-bold text-white/30 animate-pulse italic">Sentinel Scanning...</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {directives.length > 0 ? (
                                        directives.map((directive, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={idx}
                                                className={`p-5 rounded-3xl border-2 glass-panel ${directive.type === 'REGIONAL_ALERT' ? 'border-reserve-red/30 bg-reserve-red/5' :
                                                    directive.type === 'SUPPLY_CHAIN_AUDIT' ? 'border-watch-orange/30 bg-watch-orange/5' :
                                                        'border-primary/30 bg-primary/5'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${directive.type === 'REGIONAL_ALERT' ? 'bg-reserve-red text-white' :
                                                        'bg-primary text-black'
                                                        }`}>
                                                        {directive.type.replace('_', ' ')}
                                                    </span>
                                                    <div className="text-[10px] font-bold text-white/30">{directive.priority.toUpperCase()}</div>
                                                </div>
                                                <h3 className="text-sm font-black mb-1 line-clamp-1">{directive.rationale}</h3>
                                                <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{directive.proposedAction}</p>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="col-span-full h-32 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center grayscale opacity-30">
                                            <Shield size={32} className="mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">No Critical Threats Detected</span>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>

                        {/* Action Nodes */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Link href="/scan" className="group relative h-64 rounded-[2.5rem] bg-primary overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=1000')] bg-cover opacity-20 mix-blend-overlay" />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
                                <div className="relative h-full p-8 flex flex-col justify-between">
                                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-inner">
                                        <Search size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white leading-none mb-2">FORENSIC<br />SCANNER</h3>
                                        <p className="text-black/60 font-black text-[10px] uppercase tracking-[0.2em]">Launch Multimodal Eye</p>
                                    </div>
                                    <ChevronRight className="absolute top-8 right-8 text-white/40 group-hover:text-white transition-colors" />
                                </div>
                            </Link>

                            <Link href="/prescription" className="group relative h-64 rounded-[2.5rem] bg-zinc-900 border-2 border-white/5 overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                                <div className="relative h-full p-8 flex flex-col justify-between">
                                    <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Activity size={32} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white leading-none mb-2">STEWARDSHIP<br />AUDITOR</h3>
                                        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em]">BETA v3.0 | AMR Shield</p>
                                    </div>
                                    <ChevronRight className="absolute top-8 right-8 text-white/20 group-hover:text-primary transition-colors" />
                                </div>
                            </Link>
                        </section>

                        {/* Recent History Segment */}
                        {scanHistory.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Recent Logs</h2>
                                    <Link href="/history" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View Ledger</Link>
                                </div>
                                <div className="space-y-3">
                                    {scanHistory.map(scan => (
                                        <div key={scan.id} className="glass-panel p-4 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-primary/40 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${scan.riskLevel === 'safe' ? 'bg-access-green/10 text-access-green' : 'bg-reserve-red/10 text-reserve-red'
                                                    }`}>
                                                    {scan.authenticityScore}%
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-tight">{scan.drugName}</p>
                                                    <p className="text-[10px] font-bold text-white/30">{new Date(scan.timestamp).toDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Side Intelligence (4 Columns) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Thinking Stream */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 px-2">Thought Signature</h2>
                            <ThinkingPanel thoughts={sentinelThoughts} isAnalyzing={isSentinelThinking} />
                        </section>

                        {/* Network Stats */}
                        <section className="glass-panel p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">Guardian Impact</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-white/30 uppercase">Total Verified</p>
                                        <p className="text-2xl font-black">{stats.total}</p>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${(stats.safe / Math.max(stats.total, 1)) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="text-access-green">Safe: {stats.safe}</span>
                                        <span className="text-reserve-red">Risk: {stats.counterfeit + stats.suspicious}</span>
                                    </div>
                                </div>
                            </div>

                            <Link href="/map" className="block p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapIcon size={18} className="text-primary" />
                                        <span className="text-xs font-black uppercase tracking-widest">Surveillance Map</span>
                                    </div>
                                    <TrendingUp size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </section>

                        {/* AI Research Hub */}
                        <section className="p-6 rounded-[2.5rem] bg-zinc-900 border border-white/5">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 px-2">Research Hub</h2>
                            <div className="space-y-3">
                                <a href="https://www.who.int" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase text-white/60">
                                    <AlertCircle size={14} className="text-primary" /> WHO AWaRe Database
                                </a>
                                <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase text-white/60">
                                    <Zap size={14} className="text-primary" /> Nigerian AMR Trends
                                </a>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Mobile Navigation */}
            <nav className="fixed bottom-6 left-6 right-6 z-50 lg:hidden">
                <div className="glass-panel h-16 rounded-full flex items-center justify-between px-6 shadow-2xl border border-white/10 bg-black/60 backdrop-blur-3xl">
                    <Link href="/" className="text-primary"><Activity size={24} /></Link>
                    <Link href="/scan" className="w-14 h-14 -mt-10 rounded-2xl bg-primary flex items-center justify-center shadow-xl border-4 border-background-dark"><Search size={24} className="text-black" /></Link>
                    <Link href="/map" className="text-white/40"><MapIcon size={24} /></Link>
                </div>
            </nav>
        </div>
    );
}
