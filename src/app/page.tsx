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
import AnimatedCounter from "@/app/components/AnimatedCounter";
import ParticleBackground from "@/app/components/ParticleBackground";
import Footer from "@/app/components/Footer";
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

                const newDirectives = await analyzeSurveillanceLogsAction(scanList.slice(0, 50), user?.id);
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
                < div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Primary Content (8 Columns) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. Hero Section - Enhanced with Glassmorphism */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden rounded-3xl p-8 glass-panel-strong border-2 border-primary/30"
                        >
                            <ParticleBackground count={20} />
                            <div className="relative z-10 flex items-center gap-6">
                                <motion.div
                                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-float shadow-glow-primary"
                                >
                                    <ShieldCheck size={32} className="text-white" />
                                </motion.div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-black text-forest-green dark:text-white mb-1">Your Health is Protected</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">The Ndunari AI safety system is live and monitoring your medical security in real-time.</p>
                                </div>
                            </div>
                        </motion.section>

                        {/* 2. Autonomous Directives - Enhanced with Animations */}
                        <section className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    Autonomous Directives
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-pulse-glow">LIVE</span>
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {directives.length > 0 ? (
                                        directives.map((directive, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`p-5 rounded-2xl bg-white dark:bg-surface-dark border shadow-sm flex items-start gap-4 hover:shadow-lg transition-all relative overflow-hidden group card-3d ${directive.priority === 'critical' ? 'border-reserve-red/50 hover:border-reserve-red shadow-glow-danger' :
                                                    directive.priority === 'high' ? 'border-watch-orange/50 hover:border-watch-orange shadow-glow-warning' :
                                                        'border-primary/20 hover:border-primary/50'
                                                    }`}
                                            >
                                                {/* Background Glow */}
                                                {directive.priority === 'critical' && (
                                                    <div className="absolute inset-0 bg-reserve-red/5 animate-pulse-glow" />
                                                )}

                                                {/* Source Watermark */}
                                                {directive.source === 'GLOBAL' && (
                                                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <Globe size={80} />
                                                    </div>
                                                )}

                                                <div className={`p-3 rounded-xl z-10 ${directive.priority === 'critical' ? 'gradient-danger text-white shadow-glow-danger' :
                                                    directive.priority === 'high' ? 'gradient-warning text-white shadow-glow-warning' :
                                                        'gradient-primary text-white shadow-glow-primary'
                                                    }`}>
                                                    <Shield size={20} />
                                                </div>
                                                <div className="z-10 flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${directive.priority === 'critical' ? 'bg-reserve-red text-white' :
                                                            'bg-gray-100 dark:bg-white/10 text-gray-500'
                                                            }`}>
                                                            {directive.type.replace(/_/g, " ")}
                                                        </span>

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
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="col-span-full p-6 rounded-2xl glass-panel border border-dashed border-primary/20 flex items-center justify-center gap-4 opacity-70"
                                        >
                                            <div className="h-10 w-10 rounded-full gradient-success flex items-center justify-center text-white animate-float">
                                                <CheckCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-forest-green dark:text-white">All Systems Nominal</p>
                                                <p className="text-xs text-gray-400">Sentinel has detected no active threats in your region.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>

                        {/* 3. Action Cards - Enhanced 3D Interactive */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Forensic Scanner */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Link href="/scan" className="group relative h-64 rounded-[2rem] bg-forest-green overflow-hidden transition-all hover:scale-[1.04] active:scale-95 shadow-xl hover:shadow-xl-glow block card-3d">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=1000')] bg-cover opacity-10 mix-blend-overlay" />
                                    <div className="absolute inset-0 gradient-animated opacity-30" />

                                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                        <motion.div
                                            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-14 h-14 rounded-2xl glass-panel-strong border border-white/30 flex items-center justify-center shadow-glow-primary"
                                        >
                                            <Scan size={28} className="text-white" />
                                        </motion.div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white leading-none mb-2 group-hover:tracking-wider transition-all">FORENSIC<br />SCANNER</h3>
                                            <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.2em]">Launch Multimodal Eye</p>
                                        </div>
                                        <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-forest-green transition-all group-hover:rotate-45">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Stewardship Auditor */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link href="/prescription" className="group relative h-64 rounded-[2rem] bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 overflow-hidden transition-all hover:scale-[1.04] active:scale-95 shadow-xl hover:shadow-xl-glow block card-3d">
                                    <div className="absolute inset-0 bg-gradient-to-br from-access-green/5 to-transparent" />
                                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                        <motion.div
                                            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-14 h-14 rounded-2xl gradient-success border border-access-green/20 flex items-center justify-center shadow-glow-success"
                                        >
                                            <Activity size={28} className="text-white" />
                                        </motion.div>
                                        <div>
                                            <h3 className="text-3xl font-black text-forest-green dark:text-white leading-none mb-2 group-hover:tracking-wider transition-all">STEWARDSHIP<br />AUDITOR</h3>
                                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">BETA v3.0 | AMR Shield</p>
                                        </div>
                                        <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-access-green group-hover:text-white transition-all group-hover:rotate-45">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        </div>

                        {/* 4. Recent Activity - Staggered Animations */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-extrabold text-forest-green dark:text-white">Recent Safety Activity</h3>
                                <Link className="text-sm font-bold text-primary hover:underline hover:translate-x-1 transition-all inline-flex items-center gap-1" href="/history">
                                    View All History <ArrowRight size={14} />
                                </Link>
                            </div>

                            <div className="flex flex-col gap-3">
                                {scans.length === 0 ? (
                                    <div className="p-8 text-center glass-panel rounded-2xl border border-dashed border-primary/20">
                                        <p className="text-gray-400 font-medium">No recent activity found.</p>
                                        <p className="text-sm text-gray-500 mt-1">Your scans will appear here.</p>
                                    </div>
                                ) : (
                                    scans.slice(0, 3).map((scan, idx) => (
                                        <motion.div
                                            key={scan.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + idx * 0.1 }}
                                            className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary/30 hover:shadow-lg transition-all shadow-sm group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${scan.risk_level === 'safe'
                                                    ? 'gradient-success text-white shadow-glow-success'
                                                    : scan.risk_level === 'suspicious'
                                                        ? 'gradient-warning text-white shadow-glow-warning'
                                                        : 'gradient-danger text-white shadow-glow-danger'
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
                                            <button className="text-gray-400 hover:text-primary transition-colors group-hover:rotate-90 transition-transform">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </motion.div>
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

                        {/* 2. Guardian Impact - Animated Stats */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel-strong p-6 rounded-[2rem] border-2 border-primary/20 space-y-6 shadow-glass"
                        >
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Guardian Impact</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Verified</p>
                                        <AnimatedCounter
                                            value={stats.total}
                                            className="text-4xl font-black text-transparent bg-clip-text gradient-primary"
                                        />
                                    </div>
                                    <div className="relative w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stats.safe / Math.max(stats.total, 1)) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full gradient-primary shadow-glow-primary"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="text-access-green flex items-center gap-1">
                                            <CheckCircle size={12} /> Safe: <AnimatedCounter value={stats.safe} />
                                        </span>
                                        <span className="text-reserve-red flex items-center gap-1">
                                            <AlertCircle size={12} /> Risk: <AnimatedCounter value={stats.counterfeit + stats.suspicious} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Link href="/map" className="block p-4 rounded-2xl gradient-primary text-white hover:opacity-90 transition-all group shadow-glow-primary">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapIcon size={18} className="animate-float" />
                                        <span className="text-xs font-black uppercase tracking-widest">Surveillance Map</span>
                                    </div>
                                    <TrendingUp size={16} className="group-hover:translate-x-1 group-hover:rotate-45 transition-transform" />
                                </div>
                            </Link>
                        </motion.section>

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
            </main >

            {/* Footer */}
            <Footer />

            {/* Mobile Navigation */}
            < MobileNav />
        </div >
    );
}

// Add these missing imports to top of file
// import { Map as MapIcon, TrendingUp, Database, BookOpen, Globe } from "lucide-react";
// Already added in main imports block
