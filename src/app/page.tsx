"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useScanData } from "@/lib/contexts/ScanDataContext";
import { type SentinelDirective } from "@/lib/gemini/sentinel-agent.service";
import { analyzeSurveillanceLogsAction } from "@/app/actions/sentinel";
import {
    ShieldCheck,
    ArrowRight,
    HeartPulse,
    Scan,
    FileText,
    CheckCircle,
    MoreHorizontal,
    Activity,
    Shield,
    Clock,
    Map as MapIcon,
    TrendingUp,
    Database,
    BookOpen,
    Globe,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "@/app/components/SplashScreen";
import Header from "@/app/components/Header";
import MobileNav from "@/app/components/MobileNav";
import { ThinkingPanel } from "@/app/components/ThinkingPanel";
import { AlertCircle } from "lucide-react";

export default function HomePage() {
    const { user, loading: authLoading } = useAuth();
    const { scans, refreshScans } = useScanData();
    const [stats, setStats] = useState({ total: 0, safe: 0, suspicious: 0, counterfeit: 0 });

    // Sentinel State
    const [directives, setDirectives] = useState<SentinelDirective[]>([]);
    // Agentic Thinking State
    const [isSentinelThinking, setIsSentinelThinking] = useState(false);
    const [sentinelThoughts, setSentinelThoughts] = useState<{ id: string, text: string, level: 'forensic' | 'sentinel' | 'system', timestamp: Date }[]>([]);

    const loadHistoryAndAnalyze = useCallback(async () => {
        setIsSentinelThinking(true);
        const thought1Id = Math.random().toString(36).substring(7);
        setSentinelThoughts([{ id: thought1Id, text: "Sentinel Node Online. Initiating historical audit...", level: 'system', timestamp: new Date() }]);

        try {
            // Stats are calculated from scans provided by ScanDataContext
            const scanList = scans.map(s => ({
                id: s.id,
                timestamp: new Date(s.created_at).getTime(),
                drugName: s.drug_name,
                authenticityScore: s.authenticity_score,
                riskLevel: s.risk_level,
                nafdacNumber: s.nafdac_number || undefined,
                imagePreview: s.image_preview || undefined
            }));

            setStats({
                total: scanList.length,
                safe: scanList.filter(s => s.riskLevel === 'safe').length,
                suspicious: scanList.filter(s => s.riskLevel === 'suspicious').length,
                counterfeit: scanList.filter(s => s.riskLevel === 'counterfeit').length
            });

            // Autonomous Sentinel Analysis (Client-side trigger for now)
            if (scanList.length > 0) {
                const thought2Id = Math.random().toString(36).substring(7);
                setSentinelThoughts(prev => [...prev, { id: thought2Id, text: "Analyzing regional threat vectors...", level: 'sentinel', timestamp: new Date() }]);

                const newDirectives = await analyzeSurveillanceLogsAction(scanList.slice(0, 50));
                setDirectives(newDirectives);

                const thought3Id = Math.random().toString(36).substring(7);
                setSentinelThoughts(prev => [...prev, { id: thought3Id, text: `Threat assessment complete. ${newDirectives.length} directives active.`, level: 'system', timestamp: new Date() }]);
            } else {
                const thought2Id = Math.random().toString(36).substring(7);
                setSentinelThoughts(prev => [...prev, { id: thought2Id, text: "No anomalous patterns in recent logs.", level: 'system', timestamp: new Date() }]);
            }
        } finally {
            setIsSentinelThinking(false);
        }
    }, [scans]);

    useEffect(() => {
        if (authLoading) return;
        loadHistoryAndAnalyze();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadHistoryAndAnalyze();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        let scanSubscription: any = null;
        if (user) {
            scanSubscription = supabase
                .channel(`public:scans:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'scans',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    refreshScans();
                })
                .subscribe();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (scanSubscription) supabase.removeChannel(scanSubscription);
        };
    }, [user?.id, authLoading, loadHistoryAndAnalyze, refreshScans]);


    return (
        <div className="relative min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-forest-green dark:text-white transition-colors duration-300">
            <SplashScreen />
            <Header />

            {/* Note: Added id="main-content" for accessibility */}
            <main id="main-content" className="flex-1 w-full max-w-[1240px] mx-auto px-4 py-8 md:px-8 space-y-8 pb-24 lg:pb-12">

                {/* 12-Column Grid Layout - Restored Functional Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Primary Content (8 Columns) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. Autonomous Directives (Moved to Top) */}
                        <section className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    Autonomous Directives
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">LIVE</span>
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {directives.length > 0 ? (
                                    directives.map((directive, idx) => (
                                        <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-primary/20 shadow-sm flex items-start gap-4 hover:border-primary/50 transition-colors relative overflow-hidden group">
                                            {/* Source Indicator Watermark (Subtle) */}
                                            {directive.source === 'GLOBAL' && (
                                                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Globe size={80} />
                                                </div>
                                            )}

                                            <div className={`p-3 rounded-xl z-10 ${directive.priority === 'critical' ? 'bg-reserve-red/10 text-reserve-red' :
                                                directive.priority === 'high' ? 'bg-watch-orange/10 text-watch-orange' :
                                                    'bg-primary/10 text-primary'
                                                }`}>
                                                <Shield size={20} />
                                            </div>
                                            <div className="z-10 flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    {/* Type Badge */}
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${directive.priority === 'critical' ? 'bg-reserve-red text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                                                        }`}>
                                                        {directive.type.replace(/_/g, " ")}
                                                    </span>

                                                    {/* Source Badge (NEW) */}
                                                    {directive.source === 'GLOBAL' ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                                            <Globe size={10} /> Global Intel
                                                        </span>
                                                    ) : directive.source === 'PERSONAL' && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded">
                                                            Personal
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-bold text-forest-green dark:text-white leading-tight">{directive.rationale}</h4>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{directive.proposedAction}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full p-6 rounded-2xl bg-white dark:bg-surface-dark border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center gap-4 opacity-70">
                                        <div className="h-10 w-10 rounded-full bg-access-green/10 flex items-center justify-center text-access-green">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-forest-green dark:text-white">All Systems Nominal</p>
                                            <p className="text-xs text-gray-400">Sentinel has detected no active threats in your region.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. Action Cards (Large - Restored Functional Prominence) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Forensic Scanner */}
                            <Link href="/scan" className="group relative h-64 rounded-[2rem] bg-forest-green overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-2xl">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=1000')] bg-cover opacity-10 mix-blend-overlay" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                                <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                                        <Scan size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white leading-none mb-2">FORENSIC<br />SCANNER</h3>
                                        <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.2em]">Launch Multimodal Eye</p>
                                    </div>
                                    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-forest-green transition-all">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>

                            {/* Stewardship Auditor */}
                            <Link href="/prescription" className="group relative h-64 rounded-[2rem] bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-transparent" />
                                <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-forest-green/10 border border-forest-green/20 flex items-center justify-center">
                                        <Activity size={28} className="text-forest-green dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-forest-green dark:text-white leading-none mb-2">STEWARDSHIP<br />AUDITOR</h3>
                                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">BETA v3.0 | AMR Shield</p>
                                    </div>
                                    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-forest-green group-hover:text-white transition-all">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* 3. Recent Activity Section (List View) */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-extrabold text-forest-green dark:text-white">Recent Safety Activity</h3>
                                <Link className="text-sm font-bold text-primary hover:underline" href="/history">View All History</Link>
                            </div>

                            <div className="flex flex-col gap-3">
                                {scans.length === 0 ? (
                                    <div className="p-8 text-center bg-white dark:bg-surface-dark rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                                        <p className="text-gray-400 font-medium">No recent activity found.</p>
                                        <p className="text-sm text-gray-500 mt-1">Your scans will appear here.</p>
                                    </div>
                                ) : (
                                    scans.slice(0, 3).map((scan) => (
                                        <div key={scan.id} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary/20 transition-colors shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${scan.risk_level === 'safe'
                                                    ? 'bg-access-green/10 text-access-green'
                                                    : scan.risk_level === 'suspicious'
                                                        ? 'bg-watch-orange/10 text-watch-orange'
                                                        : 'bg-reserve-red/10 text-reserve-red'
                                                    }`}>
                                                    {scan.risk_level === 'safe' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-forest-green dark:text-white text-sm">{scan.drug_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="capitalize">{scan.risk_level}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(scan.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-gray-400 hover:text-forest-green dark:hover:text-white transition-colors">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Intelligence (4 Columns - Restored Sidebars) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 1. Thought Signature (Thinking Panel) */}
                        <section className="w-full">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary/60">Live Intelligence</h2>
                                {isSentinelThinking && <span className="text-[10px] font-bold text-primary animate-pulse italic">Thinking...</span>}
                            </div>
                            <ThinkingPanel thoughts={sentinelThoughts} isAnalyzing={isSentinelThinking} agentName="Ndunari Guardian" />
                        </section>

                        {/* 2. Guardian Impact (Stats) */}
                        <section className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 space-y-6 shadow-sm">
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Guardian Impact</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Verified</p>
                                        <p className="text-3xl font-black text-forest-green dark:text-white">{stats.total}</p>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${(stats.safe / Math.max(stats.total, 1)) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="text-access-green">Safe: {stats.safe}</span>
                                        <span className="text-reserve-red">Risk: {stats.counterfeit + stats.suspicious}</span>
                                    </div>
                                </div>
                            </div>
                            <Link href="/map" className="block p-4 rounded-2xl bg-forest-green text-white hover:bg-forest-green/90 transition-all group shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapIcon size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Surveillance Map</span>
                                    </div>
                                    <TrendingUp size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </section>

                        {/* 3. National Research Hub */}
                        <section className="p-6 rounded-[2rem] bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">National Research Hub</h2>
                            <div className="space-y-2">
                                <a href="https://www.who.int/groups/aware/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-[10px] font-black uppercase text-gray-500 dark:text-white/60">
                                    <Globe size={14} className="text-primary" /> WHO AWaRe Portal
                                </a>
                                <a href="https://greenbook.nafdac.gov.ng/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-[10px] font-black uppercase text-gray-500 dark:text-white/60">
                                    <Database size={14} className="text-primary" /> NAFDAC Greenbook
                                </a>
                                <a href="https://ncdc.gov.ng/diseases/sitreps/?cat=15&name=Antimicrobial%20Resistance" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-[10px] font-black uppercase text-gray-500 dark:text-white/60">
                                    <Activity size={14} className="text-primary" /> Nigeria AMR Strategy
                                </a>
                                <a href="https://dashboard.globalamrhub.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-[10px] font-black uppercase text-gray-500 dark:text-white/60">
                                    <BookOpen size={14} className="text-primary" /> Global AMR Intelligence
                                </a>
                            </div>
                        </section>

                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    );
}

// Add these missing imports to top of file
// import { Map as MapIcon, TrendingUp, Database, BookOpen, Globe } from "lucide-react";
// Already added in main imports block
