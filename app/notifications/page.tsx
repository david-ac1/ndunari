"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Shield, AlertTriangle, ArrowLeft, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { sentinelAgentService } from "@/lib/gemini/sentinel-agent.service";
import { getUserScans } from "@/lib/services/scan-storage.service";
import { useAuth } from "@/app/components/providers/AuthProvider";

export default function NotificationsPage() {
    const { user } = useAuth();
    const [directives, setDirectives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function pulseSentinel() {
            if (!user) return;
            setLoading(true);
            try {
                const { data: scans } = await getUserScans(50);
                if (scans && scans.length > 0) {
                    const mapped = (scans as any[]).map(s => ({
                        id: s.id,
                        drugName: (s.analysis as any)?.identification?.name || 'Unknown',
                        riskLevel: s.risk_level,
                        location: s.location_name,
                        timestamp: new Date(s.created_at).getTime()
                    }));

                    const newDirectives = await sentinelAgentService.analyzeSurveillanceLogs(mapped);
                    setDirectives(newDirectives);
                }
            } catch (error) {
                console.error("Sentinel Intelligence failure:", error);
            } finally {
                setLoading(false);
            }
        }

        pulseSentinel();
    }, [user]);

    return (
        <div className="min-h-screen bg-background-dark text-white pb-20 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-30 pt-6 px-4 mb-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between p-4 glass-panel rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                    <Link href="/" className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-sm font-black tracking-[0.2em] uppercase italic">Intelligence Feed</h1>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                            {loading ? "Decrypting Signals..." : "Sentinel Analysis Live"}
                        </p>
                    </div>
                    <div className="w-10 h-10" /> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 space-y-6">
                {/* Stats / Status Chips */}
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${directives.length > 0 ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                            {directives.length} Active Directives
                        </span>
                    </div>
                    <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                        <Globe size={12} className="text-white/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">National Node Active</span>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-40 glass-panel rounded-3xl animate-pulse bg-white/5 border border-white/10" />
                                ))}
                            </div>
                        ) : directives.length > 0 ? (
                            directives.map((d, idx) => (
                                <motion.div
                                    key={idx}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative glass-panel p-6 rounded-3xl border-2 border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${d.priority === 'critical' || d.priority === 'high' ? 'bg-reserve-red/20 text-reserve-red' :
                                            'bg-primary/20 text-primary'
                                            }`}>
                                            {d.type === 'REGIONAL_ALERT' ? <AlertTriangle size={20} /> : <Shield size={20} />}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-black uppercase tracking-tight text-sm text-white">
                                                    {d.type.replace('_', ' ')}
                                                </h3>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${d.priority === 'critical' ? 'bg-reserve-red text-white' : 'text-white/30'
                                                    }`}>
                                                    {d.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed font-medium mb-3">
                                                {d.rationale}
                                            </p>

                                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
                                                <p className="text-[9px] font-black uppercase text-primary/60 mb-1.5 tracking-widest">Proposed Autonomous Action</p>
                                                <p className="text-xs text-white/90 leading-relaxed font-bold">{d.proposedAction}</p>
                                            </div>

                                            <div className="flex items-center gap-4 pt-4">
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                                    <Globe size={12} className="text-primary" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{d.region} Signal</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">ID: {d.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] animate-pulse" />
                                </motion.div>
                            ))
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-30">
                                <Bell size={48} />
                                <div className="text-center">
                                    <p className="text-sm font-black uppercase tracking-widest">Sentinel Network Quiet</p>
                                    <p className="text-[10px] mt-2 max-w-[250px] leading-relaxed mx-auto">
                                        We need more forensic signals to generate autonomous intelligence. Perform pharmaceutical scans to activate the network.
                                    </p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Insight */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/20 text-center">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">Technical Insight</p>
                    <p className="text-xs text-white/60 font-medium italic max-w-md mx-auto leading-relaxed">
                        "The Intelligence Feed utilizes Gemini 3 Pro to perform real-time autonomous reasoning across your local and regional scan history."
                    </p>
                </div>
            </main>
        </div>
    );
}
