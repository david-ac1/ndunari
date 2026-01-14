"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getScanHistory, type ScanHistoryItem } from "@/lib/utils/scan-history";
import { VoiceController } from "@/app/components/VoiceController";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { getUserScans } from "@/lib/services/scan-storage.service";
import { supabase } from "@/lib/supabase/client";

export default function HomePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const [stats, setStats] = useState({ total: 0, safe: 0, suspicious: 0, counterfeit: 0 });
    const [isSyncing, setIsSyncing] = useState(false);

    const displayName = profile?.display_name || user?.email?.split('@')[0] || "Health Guardian";

    const loadHistory = useCallback(async () => {
        setIsSyncing(true);
        try {
            // 1. Load from localStorage
            const localHistory = getScanHistory();

            // 2. Load from Supabase
            let combinedHistory = [...localHistory];

            if (user) {
                const { data: cloudScans, error } = await getUserScans();
                if (!error && cloudScans) {
                    const mappedCloudScans: ScanHistoryItem[] = cloudScans.map(s => ({
                        id: s.id,
                        timestamp: new Date(s.created_at).getTime(),
                        drugName: s.drug_name,
                        authenticityScore: s.authenticity_score,
                        riskLevel: s.risk_level,
                        nafdacNumber: s.nafdac_number || undefined,
                        imagePreview: s.image_preview || undefined
                    }));

                    const existingIds = new Set(localHistory.map(l => l.id));
                    const newCloudScans = mappedCloudScans.filter(cs => !existingIds.has(cs.id));
                    combinedHistory = [...localHistory, ...newCloudScans];
                }
            }

            combinedHistory.sort((a, b) => b.timestamp - a.timestamp);
            setScanHistory(combinedHistory.slice(0, 3));

            // Calculate stats (Use profile totals if available for better accuracy, otherwise history)
            const total = profile?.total_scans || combinedHistory.length;
            const safe = combinedHistory.filter(s => s.riskLevel === 'safe').length;
            const suspicious = combinedHistory.filter(s => s.riskLevel === 'suspicious').length;
            const counterfeit = combinedHistory.filter(s => s.riskLevel === 'counterfeit').length;

            setStats({ total, safe, suspicious, counterfeit });
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [user, profile]);

    useEffect(() => {
        if (!authLoading) {
            loadHistory();
        }
    }, [user, authLoading, loadHistory]);

    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden pb-24 lg:pb-8">
            {/* Decorative Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-64 lg:h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />
            <div className="absolute -top-20 -right-20 w-64 h-64 lg:w-96 lg:h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-mint-leaf/30 rounded-full blur-3xl pointer-events-none z-0 hidden lg:block" />

            {/* Header */}
            <header className="relative z-10 px-6 lg:px-8 xl:px-12 pt-8 lg:pt-12 pb-4 lg:pb-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <Link href="/profile" className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-2 border-white dark:border-forest-green shadow-sm overflow-hidden bg-forest-green relative flex items-center justify-center hover:scale-105 transition-transform">
                            <span className="text-2xl lg:text-3xl font-bold text-white">
                                {displayName?.[0] || 'N'}
                            </span>
                        </Link>
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Welcome back,</p>
                            <h1 className="text-xl lg:text-2xl font-bold leading-tight truncate max-w-[150px] lg:max-w-[250px] flex items-center gap-2">
                                {displayName}
                                <Link href="/profile" title={profile?.share_data ? "Contributing to Public Health" : "Privacy Protection Active"}>
                                    {profile?.share_data === false ? (
                                        <span className="text-sm bg-access-green/20 text-access-green px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                            🛡️ <span className="hidden sm:inline text-[10px]">PRIVATE</span>
                                        </span>
                                    ) : (
                                        <span className="text-sm bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                            📡 <span className="hidden sm:inline text-[10px]">SYNCING</span>
                                        </span>
                                    )}
                                </Link>
                            </h1>
                            {user?.is_anonymous && (
                                <Link href="/login" className="text-[10px] lg:text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                    <span>🔐</span> Register to save history
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {user?.is_anonymous && (
                            <Link
                                href="/login"
                                className="hidden sm:flex px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                        <VoiceController />
                        <button className="glass-panel h-10 w-10 lg:h-12 lg:w-12 flex items-center justify-center rounded-full shadow-sm hover:scale-105 transition-transform relative">
                            <span className="text-xl lg:text-2xl">🔔</span>
                            {stats.suspicious + stats.counterfeit > 0 && (
                                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-warning-amber border border-white" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 px-6 lg:px-8 xl:px-12 overflow-y-auto no-scrollbar">
                <div className="max-w-7xl mx-auto pb-6">

                    {/* Alert Chips - Show if suspicious/counterfeit drugs found */}
                    {(stats.suspicious > 0 || stats.counterfeit > 0) && (
                        <section className="mb-6">
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {stats.counterfeit > 0 && (
                                    <div className="flex-shrink-0 px-4 py-2 rounded-full bg-reserve-red/10 border border-reserve-red/30 flex items-center gap-2">
                                        <span className="text-reserve-red text-lg">⚠️</span>
                                        <span className="text-sm font-bold text-reserve-red">
                                            {stats.counterfeit} Counterfeit{stats.counterfeit > 1 ? 's' : ''} Detected
                                        </span>
                                    </div>
                                )}
                                {stats.suspicious > 0 && (
                                    <div className="flex-shrink-0 px-4 py-2 rounded-full bg-watch-orange/10 border border-watch-orange/30 flex items-center gap-2">
                                        <span className="text-watch-orange text-lg">⚡</span>
                                        <span className="text-sm font-bold text-watch-orange">
                                            {stats.suspicious} Suspicious Package{stats.suspicious > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Desktop: Two Column Layout, Mobile: Single Column */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                        {/* Left Column: Main Actions (Desktop: 2/3, Mobile: Full) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Health Shield Status */}
                            <section className="w-full">
                                <div className="glass-panel p-6 lg:p-8 rounded-2xl shadow-glass relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-32 h-32 lg:w-48 lg:h-48 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-all duration-500" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 lg:gap-3 mb-2">
                                                <span className="text-3xl lg:text-4xl">🛡️</span>
                                                <h2 className="text-xl lg:text-2xl font-bold text-forest-green dark:text-white">Health Shield</h2>
                                            </div>
                                            <p className="text-4xl lg:text-5xl font-bold text-primary tracking-tight">Active</p>
                                            <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">
                                                {stats.total > 0 ? `${stats.total} scan${stats.total > 1 ? 's' : ''} completed` : 'AI-powered pharmaceutical protection'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-primary/10 text-primary animate-pulse-slow">
                                            <span className="text-4xl lg:text-5xl">✓</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Primary Actions Grid */}
                            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">

                                {/* Scan Pack Card */}
                                <Link href="/scan" className="group relative flex flex-col justify-between h-56 lg:h-64 rounded-2xl p-6 overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-forest-green">
                                    <div className="absolute -bottom-10 -right-10 w-32 h-32 lg:w-48 lg:h-48 bg-primary rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <div className="relative z-10 w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <span className="text-3xl lg:text-4xl">📷</span>
                                    </div>
                                    <div className="relative z-10 text-left">
                                        <h3 className="text-white text-2xl lg:text-3xl font-bold leading-tight mb-2">Scan<br />Package</h3>
                                        <p className="text-white/60 text-sm lg:text-base font-medium">Multi-angle 3D verification</p>
                                    </div>
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-primary text-2xl">→</span>
                                    </div>
                                </Link>

                                {/* Analyze Prescription Card */}
                                <Link href="/prescription" className="group relative flex flex-col justify-between h-56 lg:h-64 rounded-2xl p-6 overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                    <div className="absolute -top-10 -left-10 w-32 h-32 lg:w-48 lg:h-48 bg-blue-500 rounded-full blur-3xl opacity-5 dark:opacity-10" />
                                    <div className="relative z-10 w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="text-3xl lg:text-4xl">📋</span>
                                    </div>
                                    <div className="relative z-10 text-left">
                                        <h3 className="text-forest-green dark:text-white text-2xl lg:text-3xl font-bold leading-tight mb-2">Analyze<br />Prescription</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base font-medium">WHO AWaRe classification</p>
                                    </div>
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-forest-green dark:text-white text-2xl">→</span>
                                    </div>
                                </Link>

                            </section>

                            {/* Recent Activity */}
                            {scanHistory.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-forest-green dark:text-white flex items-center gap-2">
                                            <span>📊</span> Recent Scans
                                        </h3>
                                        <Link href="/history" className="text-sm font-medium text-primary hover:underline">
                                            View All
                                        </Link>
                                    </div>
                                    <div className="space-y-3">
                                        {scanHistory.map((scan) => (
                                            <div
                                                key={scan.id}
                                                className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-colors"
                                            >
                                                {scan.imagePreview && (
                                                    <img
                                                        src={scan.imagePreview}
                                                        alt={scan.drugName}
                                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-forest-green dark:text-white truncate">{scan.drugName}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(scan.timestamp).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${scan.riskLevel === 'safe' ? 'text-access-green' :
                                                        scan.riskLevel === 'suspicious' ? 'text-watch-orange' :
                                                            'text-reserve-red'
                                                        }`}>
                                                        {scan.authenticityScore}%
                                                    </span>
                                                    <span className="text-lg">
                                                        {scan.riskLevel === 'safe' ? '✅' :
                                                            scan.riskLevel === 'suspicious' ? '⚠️' : '❌'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Secondary Actions */}
                            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                                <Link href="/report" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">📈</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">Report</span>
                                </Link>
                                <Link href="/profile" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">👤</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">Profile</span>
                                </Link>
                                <Link href="/history" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">📜</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">History</span>
                                </Link>
                                <Link href="/map" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">🗺️</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">Map</span>
                                </Link>
                            </section>

                        </div>

                        {/* Right Column: Info & Stats (Desktop: 1/3, Mobile: Full) */}
                        <div className="space-y-6 lg:col-span-1">

                            {/* Mission Section */}
                            <section className="p-5 lg:p-6 rounded-xl bg-mint-leaf dark:bg-primary/10 border border-primary/20 shadow-sm">
                                <h3 className="font-bold text-base lg:text-lg text-forest-green dark:text-white mb-3 flex items-center gap-2">
                                    <span className="text-xl">🎯</span> Mission
                                </h3>
                                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Protecting 140M Nigerians from counterfeit drugs and antimicrobial resistance using AI-powered pharmaceutical surveillance.
                                </p>
                            </section>

                            {/* Stats Section - Desktop Only */}
                            <section className="hidden lg:block p-5 lg:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-base lg:text-lg text-forest-green dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">📊</span> Your Impact
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{stats.total}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Scans Completed</p>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-gray-700" />
                                    <div>
                                        <p className="text-2xl font-bold text-access-green">{stats.safe}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Verified Authentic</p>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-gray-700" />
                                    <div>
                                        <p className="text-2xl font-bold text-reserve-red">{stats.suspicious + stats.counterfeit}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Flagged for Risk</p>
                                    </div>
                                </div>
                            </section>

                            {/* Quick Links - Desktop Only */}
                            <section className="hidden lg:block p-5 lg:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-base lg:text-lg text-forest-green dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">🔗</span> Resources
                                </h3>
                                <div className="space-y-2">
                                    <a href="https://www.who.int/teams/integrated-health-services/antimicrobial-resistance/aware-classification" target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">WHO AWaRe Database</a>
                                    <a href="https://www.nafdac.gov.ng" target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">NAFDAC Registry</a>
                                    <a href="mailto:report@ndunari.health" className="block text-sm text-primary hover:underline">Report Counterfeit</a>
                                    <Link href="/help" className="block text-sm text-primary hover:underline">Help & Support</Link>
                                </div>
                            </section>

                        </div>

                    </div>
                </div>
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <nav className="fixed bottom-6 left-6 right-6 z-50 lg:hidden">
                <div className="glass-panel h-16 rounded-full flex items-center justify-between px-2 shadow-2xl max-w-md mx-auto">
                    <Link href="/" className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                        <span className="text-2xl">🏠</span>
                    </Link>
                    <Link href="/history" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white transition-colors">
                        <span className="text-2xl">📜</span>
                    </Link>
                    <Link href="/scan" className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-forest-green text-white shadow-lg border-4 border-white dark:border-background-dark transform transition-transform active:scale-95 hover:shadow-xl">
                        <span className="text-3xl">🔍</span>
                    </Link>
                    <Link href="/report" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white transition-colors">
                        <span className="text-2xl">📈</span>
                    </Link>
                    <Link href="/profile" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white transition-colors">
                        <span className="text-2xl">👤</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
