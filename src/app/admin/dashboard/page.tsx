"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Map, Box, Activity, AlertTriangle, Eye } from "lucide-react";
import NotificationPanel from "@/components/notifications/NotificationPanel";

type AdminStats = {
    total_scans: number;
    counterfeit_count: number;
    reserve_prescriptions: number;
    active_clusters: number;
    active_guardians: number;
};

type RecentScan = {
    id: string;
    drug_name: string;
    risk_level: 'safe' | 'suspicious' | 'counterfeit';
    created_at: string;
    location: any;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats>({
        total_scans: 0,
        counterfeit_count: 0,
        reserve_prescriptions: 0,
        active_clusters: 0,
        active_guardians: 0
    });
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);

            // 1. Get Aggregates
            const { count: scanCount } = await supabase.from('scans').select('*', { count: 'exact', head: true });
            const { count: fakeCount } = await supabase.from('scans').select('*', { count: 'exact', head: true }).eq('risk_level', 'counterfeit');
            const { count: reserveCount } = await supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('aware_category', 'RESERVE');
            const { count: guardianCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // 2. Get Recent Activity
            const { data: scans } = await supabase
                .from('scans')
                .select('id, drug_name, risk_level, created_at, location')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                total_scans: scanCount || 0,
                counterfeit_count: fakeCount || 0,
                reserve_prescriptions: reserveCount || 0,
                active_clusters: Math.ceil((fakeCount || 0) / 5),
                active_guardians: guardianCount || 0
            });

            if (scans) setRecentScans(scans);

        } catch (e) {
            console.error("Admin fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-zinc-500 animate-pulse">Initializing Command Center...</div>;
    }

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Monitor Dashboard</h1>
                    <p className="text-zinc-500">Live surveillance feed across all active zones.</p>
                </div>
                <div className="relative">
                    <NotificationPanel />
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <KpiCard
                    label="Active Clusters"
                    value={stats.active_clusters}
                    icon={Map}
                    color="text-reserve-red"
                    trend={stats.active_clusters > 0 ? "+2 today" : "Stable"}
                />
                <KpiCard
                    label="Active Guardians"
                    value={stats.active_guardians}
                    icon={Eye}
                    color="text-access-green"
                    subtext="Reporters"
                />
                <KpiCard
                    label="Counterfeit Reports"
                    value={stats.counterfeit_count}
                    icon={AlertTriangle}
                    color="text-orange-500"
                    subtext={`${((stats.counterfeit_count / (stats.total_scans || 1)) * 100).toFixed(1)}% rate`}
                />
                <KpiCard
                    label="Reserve Escalations"
                    value={stats.reserve_prescriptions}
                    icon={Activity}
                    color="text-yellow-400"
                    subtext="Requires Audit"
                />
                <KpiCard
                    label="Total Scans"
                    value={stats.total_scans}
                    icon={Activity}
                    color="text-primary"
                    subtext="National Intake"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Map Area (Mock) */}
                <div className="lg:col-span-2 glass-panel border border-zinc-800 bg-zinc-900/50 rounded-2xl p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Map size={18} className="text-primary" />
                        Live Heatmap
                    </h3>
                    <div className="flex-1 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                        {/* Mock Map UI */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Nigeria_adm_location_map.svg/1024px-Nigeria_adm_location_map.svg.png')] bg-cover bg-center grayscale mix-blend-overlay"></div>
                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-reserve-red/20 text-reserve-red rounded-full animate-pulse border border-reserve-red/30 mb-2">
                                <span className="w-2 h-2 bg-reserve-red rounded-full"></span>
                                Live Feed Active
                            </div>
                            <p className="text-zinc-500 text-sm">Rendering PostGIS Layers...</p>
                        </div>

                        {/* Mock Hotspots */}
                        <div className="absolute top-[30%] left-[40%] text-reserve-red animate-ping">●</div>
                        <div className="absolute bottom-[40%] right-[30%] text-reserve-red animate-ping delay-75">●</div>
                        <div className="absolute top-[50%] left-[20%] text-reserve-red animate-ping delay-150">●</div>
                    </div>
                </div>

                {/* 3D Forensic Vault & Recent Activity */}
                <div className="space-y-6">
                    {/* 3D Vault Link */}
                    <div className="glass-panel border border-primary/20 bg-primary/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Box size={100} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">3D Forensic Vault</h3>
                        <p className="text-zinc-400 text-sm mb-4">Access digital twins of seized contraband for volumetric analysis.</p>
                        <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg text-sm hover:scale-105 transition-transform">
                            Open Vault →
                        </button>
                    </div>

                    {/* Recent Stream */}
                    <div className="glass-panel border border-zinc-800 bg-zinc-900/50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Incoming Telemetry</h3>
                        <div className="space-y-4">
                            {recentScans.map((scan) => (
                                <div key={scan.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div>
                                        <div className="text-white font-medium text-sm">{scan.drug_name}</div>
                                        <div className="text-zinc-500 text-xs">{new Date(scan.created_at).toLocaleTimeString()}</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${scan.risk_level === 'safe' ? 'bg-access-green/20 text-access-green' :
                                        scan.risk_level === 'counterfeit' ? 'bg-reserve-red/20 text-reserve-red' :
                                            'bg-yellow-500/20 text-yellow-500'
                                        }`}>
                                        {scan.risk_level}
                                    </div>
                                </div>
                            ))}
                            {recentScans.length === 0 && (
                                <div className="text-zinc-600 text-center italic text-sm py-4">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, icon: Icon, color, trend, subtext }: any) {
    return (
        <div className="glass-panel border border-zinc-800 bg-zinc-900/50 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${color}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold bg-white/5 text-zinc-400 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-black text-white mb-1 tracking-tight">{value}</div>
            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">{label}</div>
            {subtext && <div className={`text-xs ${color} opacity-80`}>{subtext}</div>}
        </div>
    );
}
