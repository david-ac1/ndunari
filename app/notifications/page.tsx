"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Shield, Info, AlertTriangle, ArrowLeft, CheckCircle2, Factory, Globe } from "lucide-react";
import { useState } from "react";

interface Notification {
    id: string;
    type: 'critical' | 'info' | 'sentinel';
    title: string;
    description: string;
    timestamp: string;
    region?: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'critical',
        title: 'Counterfeit Cluster Detected: Batch B4-G2',
        description: 'Forensic Eye has flagged a high volume of counterfeit Amartem in the Lagos Metropolitan area. All field workers are advised to prioritize barcode and hologram audits.',
        timestamp: '15m ago',
        region: 'Lagos',
        read: false
    },
    {
        id: '2',
        type: 'sentinel',
        title: 'Sentinel Directive: Supply Chain Audit Initiated',
        description: 'Autonomous pattern recognition has detected an anomaly in antibiotic distribution curves. Initiating mandatory stewardship audit for all Watch-category drugs in Kano.',
        timestamp: '1h ago',
        region: 'Kano',
        read: false
    },
    {
        id: '3',
        type: 'info',
        title: 'System Optimization Complete',
        description: 'Ndunari Health Shield has been updated to use Gemini 3 Pro Preview across all forensic and stewardship modules for enhanced razonamiento accuracy.',
        timestamp: '4h ago',
        read: true
    },
    {
        id: '4',
        type: 'sentinel',
        title: 'New Regional Signal: Port Harcourt',
        description: 'Stable pharmaceutical circulation detected. Vigilance score: 98%. NAFDAC Registry alignment verified.',
        timestamp: '6h ago',
        region: 'Port Harcourt',
        read: true
    },
    {
        id: '5',
        type: 'critical',
        title: 'AMR Escalation Alert',
        description: 'Unjustified use of Reserve-category antibiotics detected in community pharmacies in Abuja. Emergency stewardship guidelines issued.',
        timestamp: '1d ago',
        region: 'Abuja',
        read: true
    }
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="min-h-screen bg-background-dark text-white pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 pt-6 px-4 mb-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between p-4 glass-panel rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                    <Link href="/" className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-sm font-black tracking-[0.2em] uppercase italic">Intelligence Feed</h1>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Sentinel Network Notifications</p>
                    </div>
                    <button onClick={markAllRead} className="text-[10px] font-black uppercase text-white/40 hover:text-primary transition-colors pr-2">
                        Mark All Read
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 space-y-6">
                {/* Stats / Status Chips */}
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-reserve-red animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">2 Critical Threats</span>
                    </div>
                    <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Active Sentinel Node</span>
                    </div>
                    <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                        <Globe size={12} className="text-white/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">5 National Signals</span>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`relative glass-panel p-6 rounded-3xl border-2 transition-all ${!n.read ? 'border-primary/20 bg-primary/5' : 'border-white/5 bg-black/20 opacity-70'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.type === 'critical' ? 'bg-reserve-red/20 text-reserve-red' :
                                                n.type === 'sentinel' ? 'bg-primary/20 text-primary' :
                                                    'bg-white/10 text-white/60'
                                            }`}>
                                            {n.type === 'critical' && <AlertTriangle size={20} />}
                                            {n.type === 'sentinel' && <Shield size={20} />}
                                            {n.type === 'info' && <Bell size={20} />}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-black uppercase tracking-tight text-sm ${!n.read ? 'text-white' : 'text-white/60'}`}>
                                                    {n.title}
                                                </h3>
                                                <span className="text-[10px] font-bold text-white/30">{n.timestamp}</span>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed font-medium">
                                                {n.description}
                                            </p>

                                            <div className="flex items-center gap-4 pt-3">
                                                {n.region && (
                                                    <div className="flex items-center gap-1.5">
                                                        <CheckCircle2 size={10} className="text-primary" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{n.region} Signal</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="text-[10px] font-black uppercase text-white/20 hover:text-reserve-red transition-colors"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unread Dot */}
                                    {!n.read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-30">
                                <Bell size={48} />
                                <p className="text-sm font-black uppercase tracking-widest">No Intelligence Updates</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Insight */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/20 text-center">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">Network Security Advice</p>
                    <p className="text-xs text-white/60 font-medium italic">
                        "The Sentinel Agent is currently monitoring 14 regional nodes. Stable pharmaceutical circulation detected across 82% of the network."
                    </p>
                </div>
            </main>
        </div>
    );
}
