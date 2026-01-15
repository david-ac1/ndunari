"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Activity, Globe, AlertTriangle,
    ArrowLeft, TrendingUp, Search, Layers,
    MessageSquare, Zap, BarChart3, Database,
    Download, AlertCircle, Fingerprint, Microscope, Users
} from "lucide-react";

export default function AdminPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [analyzing, setAnalyzing] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);

    // Security Guard: Redirect non-admins
    useEffect(() => {
        if (!authLoading && profile?.role !== 'admin') {
            router.push('/');
        }
    }, [profile, authLoading, router]);

    const fetchStats = async (deep = false) => {
        if (deep) setAnalyzing(true);
        setAdminError(null);
        try {
            const res = await fetch(`/api/admin/stats${deep ? '?deep=true' : ''}`, {
                cache: 'no-store'
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                setAdminError(json.error || "National Grid Offline");
            }
        } catch (e) {
            console.error("Admin stats fetch failed:", e);
            setAdminError("Failed to synchronize with National Intelligence Grid.");
        } finally {
            setLoading(false);
            if (deep) setAnalyzing(false);
        }
    };

    useEffect(() => {
        if (profile?.role === 'admin') {
            fetchStats();
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [profile]);

    const handleSeed = async () => {
        if (!confirm("🚀 Inject National Intelligence Data?\n\nThis will populate the dashboard with realistic de-identified forensic clusters and AMR trends for demo purposes.")) return;
        setSeeding(true);
        try {
            const res = await fetch('/api/admin/seed', { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                alert("SUCCESS: National Intelligence Grid Injected!");
                fetchStats();
            } else {
                alert("Error: " + json.error);
            }
        } catch (e) {
            alert("Injection failed. Check console.");
        } finally {
            setSeeding(false);
        }
    };

    const handleIssueDirective = async (drugName?: string) => {
        const name = typeof drugName === 'string' ? drugName : prompt("Enter Drug Name for National Alert:");
        if (!name) return;

        try {
            const res = await fetch('/api/admin/directive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drugName: name,
                    severity: 'high',
                    region: 'National Cluster',
                    batchNumber: 'ALL_SUSPICIOUS'
                })
            });
            const json = await res.json();
            if (json.success) {
                alert(`📡 MISSION CRITICAL: National Directive Issued for ${name}. Guardian nodes notified!`);
                fetchStats();
            }
        } catch (e) {
            alert("Failed to issue directive");
        }
    };

    if (authLoading || (loading && !data && !adminError)) {
        return (
            <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-primary font-black uppercase tracking-[0.3em] animate-pulse">Decrypting National Signals...</p>
            </div>
        );
    }

    if (adminError && !data) {
        return (
            <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center space-y-4 p-6 text-center">
                <AlertCircle size={48} className="text-reserve-red mb-4" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Signal Interrupted</h2>
                <p className="text-white/40 max-w-md">{adminError}</p>
                <button
                    onClick={() => fetchStats()}
                    className="mt-6 px-8 py-3 bg-primary text-black font-black uppercase tracking-widest rounded-xl"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    const stats = data?.summary || {
        totalScans: 0,
        safeScans: 0,
        suspiciousScans: 0,
        counterfeitScans: 0,
        totalPrescriptions: 0,
        awareDistribution: { access: 0, watch: 0, reserve: 0 }
    };

    return (
        <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-black">
            {/* National Command Header */}
            <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center hover:bg-white/10 transition-all">
                            <ArrowLeft size={20} className="text-white/60" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-black uppercase tracking-[0.2em] italic">Intelligence Center</h1>
                                <span className="px-2 py-0.5 rounded-md bg-reserve-red text-[8px] font-black uppercase tracking-widest animate-pulse">Internal Use Only</span>
                            </div>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-60">Ndunari National Sentinel Network | Nigeria Node</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Demo Mode Controller */}
                        {stats.totalScans === 0 && (
                            <button
                                onClick={handleSeed}
                                disabled={seeding}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50"
                            >
                                <Download size={14} className={seeding ? "animate-bounce" : ""} />
                                {seeding ? "Injecting..." : "Seed Demo Data"}
                            </button>
                        )}

                        <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/5">
                            {['overview', 'forensics', 'recalls', 'detective'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-black' : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-8 space-y-8">

                {/* 1. National Impact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="National Scans"
                        value={stats.totalScans}
                        icon={<Database size={20} />}
                        color="text-primary"
                        sub="Cross-Account Telemetry"
                    />
                    <StatCard
                        title="AI Risk Masks"
                        value={data?.riskMasks?.length || 0}
                        icon={<Globe size={20} />}
                        color="text-watch-orange"
                        sub="Autonomous Geo-Fencing"
                    />
                    <StatCard
                        title="Drafted Recalls"
                        value={data?.recallNotices?.length || 0}
                        icon={<Shield size={20} />}
                        color="text-reserve-red"
                        sub="Regulatory Interventions"
                    />
                    <StatCard
                        title="Vigilance Score"
                        value={Math.round((stats.safeScans / (stats.totalScans || 1)) * 100)}
                        icon={<Zap size={20} />}
                        color="text-access-green"
                        sub="National Safety Rating"
                        isPercentage
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* 2. Main Intelligence Loop (Left/Center) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Conditional Views based on Tabs */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* National Command Radar (Map Overlay Simulated) */}
                                <section className="glass-panel rounded-[2.5rem] border-2 border-primary/20 bg-black/40 relative overflow-hidden h-[400px]">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                                    <div className="absolute top-8 left-8 z-10">
                                        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                            <Globe className="text-primary animate-spin-slow" size={20} />
                                            National Command Radar
                                        </h2>
                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight mt-1">Autonomous Regional Monitoring Active</p>
                                    </div>

                                    {/* Mock Map Background */}
                                    <div className="absolute inset-0 flex items-center justify-center grayscale opacity-10">
                                        <Globe size={300} strokeWidth={1} />
                                    </div>

                                    {/* Animated Risk Masks */}
                                    <div className="absolute inset-0">
                                        {data?.riskMasks?.map((mask: any, i: number) => (
                                            <motion.div
                                                key={mask.id}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute border-2 border-reserve-red rounded-full flex items-center justify-center group cursor-help"
                                                style={{
                                                    top: `${40 + (i * 15)}%`,
                                                    left: `${30 + (i * 20)}%`,
                                                    width: `${mask.radius * 2}px`,
                                                    height: `${mask.radius * 2}px`,
                                                    backgroundColor: `rgba(239, 68, 68, ${mask.intensity * 0.2})`,
                                                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                                                }}
                                            >
                                                <div className="absolute -top-8 bg-reserve-red text-white text-[8px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    THREAT: {mask.detectedThreat}
                                                </div>
                                                <div className="w-2 h-2 bg-reserve-red rounded-full animate-ping" />
                                            </motion.div>
                                        ))}

                                        {!data?.riskMasks?.length && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">No Active Risk Masks</p>
                                                <button
                                                    onClick={() => fetchStats(true)}
                                                    disabled={analyzing}
                                                    className="px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/20 transition-all flex items-center gap-3"
                                                >
                                                    {analyzing ? <Activity className="animate-spin" size={14} /> : <Zap size={14} />}
                                                    {analyzing ? "Sentinel Reasoning..." : "Run Deep Sentinel Analysis"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Live Forensic Stream */}
                                <section className="glass-panel rounded-[2.5rem] border-2 border-white/5 overflow-hidden">
                                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                                <Activity className="text-primary" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest">Live Forensic Signal Stream</h2>
                                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">Real-time Cross-Market Surveillance</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2 overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead className="text-[10px] font-black uppercase text-white/20">
                                                <tr>
                                                    <th className="p-4">Timestamp</th>
                                                    <th className="p-4">Drug Item</th>
                                                    <th className="p-4">Region</th>
                                                    <th className="p-4 text-center">Risk</th>
                                                    <th className="p-4 text-right">Authenticity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs">
                                                {data?.feed?.map((item: any) => (
                                                    <tr key={item.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                        <td className="p-4 text-white/40 font-mono">
                                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-bold text-white group-hover:text-primary transition-colors">{item.drug_name}</div>
                                                            <div className="text-[10px] text-white/30 font-mono">Batch: {item.batch_number || 'UNKNOWN'}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <Globe size={12} className="text-white/20" />
                                                                <span className="font-bold uppercase tracking-tight">{item.region || 'National'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex justify-center">
                                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.risk_level === 'counterfeit' ? 'bg-reserve-red/20 text-reserve-red' :
                                                                    item.risk_level === 'suspicious' ? 'bg-watch-orange/20 text-watch-orange' :
                                                                        'bg-access-green/20 text-access-green'
                                                                    }`}>
                                                                    {item.risk_level}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right font-black italic text-sm text-white/80">
                                                            {item.authenticity_score}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'recalls' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {data?.recallNotices?.length > 0 ? (
                                    data.recallNotices.map((recall: any) => (
                                        <motion.div
                                            key={recall.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="glass-panel p-8 rounded-[2.5rem] border-2 border-reserve-red/20 space-y-4 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 px-4 py-2 bg-reserve-red text-white text-[8px] font-black uppercase tracking-widest italic">
                                                AI-Drafted Recall
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-black text-white italic">{recall.drugName}</h3>
                                                    <p className="text-[10px] text-reserve-red font-black uppercase tracking-widest">BATCH: {recall.batchNumber}</p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-reserve-red/10 text-reserve-red border border-reserve-red/20`}>
                                                    {recall.severity}
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                                                <p className="text-[10px] text-white/60 font-medium leading-relaxed italic line-clamp-3">"{recall.reason}"</p>
                                            </div>
                                            <div className="flex justify-between items-center pt-4">
                                                <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">SCOPE: {recall.scope}</div>
                                                <button className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all">
                                                    Publish Notice
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-2 h-[400px] rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center space-y-6 grayscale opacity-30">
                                        <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center animate-pulse">
                                            <Shield size={40} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase tracking-[0.3em] mb-2">No Active Recall Directives</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Sentinel Agent has not detected critical supply chain fractures.</p>
                                        </div>
                                        <button
                                            onClick={() => fetchStats(true)}
                                            disabled={analyzing}
                                            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3"
                                        >
                                            {analyzing ? <Activity className="animate-spin" size={14} /> : <Zap size={14} />}
                                            {analyzing ? "Running Intelligence Cycle..." : "Verify Supply Chain Integrity"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'detective' && (
                            <div className="space-y-8">
                                <section className="glass-panel p-8 rounded-[2.5rem] border-2 border-primary/10 bg-black/20">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <Microscope className="text-primary" size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest">Forensic Detective Board</h2>
                                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">AI-Identified Manufacturing Signature Clusters</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => fetchStats(true)}
                                            className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/30 transition-all flex items-center gap-2"
                                        >
                                            <Zap size={14} /> Refresh Clusters
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {data?.forensicClusters?.length > 0 ? (
                                            data.forensicClusters.map((cluster: any) => (
                                                <motion.div
                                                    key={cluster.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-primary/30 transition-all relative overflow-hidden group bg-white/5"
                                                >
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <Fingerprint size={60} className="text-primary" />
                                                    </div>

                                                    <div className="relative z-10 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="text-lg font-black italic text-white">{cluster.title}</h3>
                                                                <div className="flex gap-2 mt-1">
                                                                    {cluster.affectedBrands.map((brand: string) => (
                                                                        <span key={brand} className="text-[8px] font-black uppercase text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded">
                                                                            {brand}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${cluster.threatLevel === 'critical' ? 'bg-reserve-red text-white' :
                                                                cluster.threatLevel === 'high' ? 'bg-reserve-red/20 text-reserve-red' :
                                                                    'bg-watch-orange/20 text-watch-orange'
                                                                }`}>
                                                                {cluster.threatLevel}
                                                            </span>
                                                        </div>

                                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                                            <div className="text-[8px] font-black uppercase text-white/30 mb-1">Evidence Signature</div>
                                                            <p className="text-[11px] text-white/80 font-medium leading-relaxed italic">
                                                                "{cluster.evidenceSignature}"
                                                            </p>
                                                        </div>

                                                        <div className="flex justify-between items-end">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-[9px] text-white/40 font-bold uppercase">
                                                                    <Globe size={10} /> {cluster.geoConcentration}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[9px] text-white/40 font-bold uppercase">
                                                                    <Users size={10} /> {cluster.scanCount} Independent Scans
                                                                </div>
                                                            </div>
                                                            <button className="p-2 rounded-xl bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary transition-all">
                                                                <Search size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 h-64 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center space-y-4 grayscale opacity-40">
                                                <Microscope size={40} />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">No Forensic Clusters Detected</p>
                                                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">Run deep analysis to connect the dots across the federation.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* System Reasoning Node */}
                                <section className="glass-panel p-8 rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                        <Zap className="text-primary" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest italic text-primary">Cross-Scan Context Engine Active</h3>
                                        <p className="text-[11px] text-white/60 font-medium leading-relaxed mt-1">
                                            The Sentinel Agent is currently performing multi-document reasoning over {stats.totalScans} scans. It is searching for shared manufacturing signatures, batch pattern fractures, and systematic forensic anomalies across 36 regional nodes.
                                        </p>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* AMR Stewardship Scorecard */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div className="glass-panel p-8 rounded-[2.5rem] border-2 border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <BarChart3 className="text-watch-orange" size={20} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">AMR Distribution (WHO AWaRe)</h3>
                                </div>
                                <div className="space-y-6">
                                    <AwareCategoryBar
                                        label="Access (Low Risk)"
                                        count={stats.awareDistribution.access}
                                        total={stats.totalPrescriptions}
                                        color="bg-access-green"
                                    />
                                    <AwareCategoryBar
                                        label="Watch (Moderate Risk)"
                                        count={stats.awareDistribution.watch}
                                        total={stats.totalPrescriptions}
                                        color="bg-watch-orange"
                                    />
                                    <AwareCategoryBar
                                        label="Reserve (Highest Restriction)"
                                        count={stats.awareDistribution.reserve}
                                        total={stats.totalPrescriptions}
                                        color="bg-reserve-red"
                                    />
                                </div>
                            </div>

                            <div className="glass-panel p-8 rounded-[2.5rem] border-2 border-primary/20 flex flex-col justify-center text-center space-y-4">
                                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Shield className="text-primary" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase italic">National Vigilance Score</h3>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">AI-Computed Safety Rating</p>
                                </div>
                                <div className="text-5xl font-black text-primary italic">
                                    {Math.round((stats.safeScans / (stats.totalScans || 1)) * 100)}%
                                </div>
                                <p className="text-[10px] text-white/30 max-w-[200px] mx-auto leading-relaxed">
                                    Based on real-time de-identified forensic signals across the federation.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* 3. National Alerts & Sentinel Intelligence (Right) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* High-Risk Alerts Cluster */}
                        <section className="glass-panel p-8 rounded-[2.5rem] border-2 border-reserve-red/20 bg-reserve-red/[0.03]">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="text-reserve-red" size={20} />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Active Threat Clusters</h2>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-reserve-red text-[8px] font-black uppercase text-white tracking-widest italic animate-pulse">Live Radar</span>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {data?.alerts?.length > 0 ? (
                                    data.alerts.map((alert: any) => (
                                        <div key={alert.id} className="p-4 rounded-2xl bg-black/40 border border-reserve-red/10 space-y-2 hover:bg-reserve-red/[0.05] transition-all cursor-crosshair group">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xs font-black uppercase text-white group-hover:text-reserve-red transition-colors">{alert.drug_name}</h3>
                                                <span className="text-[10px] font-bold text-reserve-red">{alert.report_count} Hits</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{alert.region}</p>
                                                <button
                                                    onClick={() => handleIssueDirective(alert.drug_name)}
                                                    className="w-8 h-8 rounded-lg bg-reserve-red/20 flex items-center justify-center hover:bg-reserve-red text-reserve-red hover:text-white transition-all"
                                                >
                                                    <Zap size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-48 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center grayscale opacity-30 gap-3">
                                        <Shield size={32} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-center px-8 leading-relaxed">No National Counterfeit Outbreaks Detected by Sentinel Agent</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleIssueDirective()}
                                className="w-full mt-6 py-4 bg-reserve-red text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                            >
                                Issue Global Directive
                            </button>
                        </section>

                        {/* Sentinel Regional Intelligence */}
                        <section className="glass-panel p-8 rounded-[2.5rem] border-2 border-primary/20 bg-primary/[0.03] space-y-6">
                            <div className="flex items-center gap-3">
                                <Zap className="text-primary" size={20} />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Regional Node Activity</h2>
                            </div>

                            <div className="space-y-4">
                                {Object.keys(stats.regionalActivity).length > 0 ? (
                                    Object.entries(stats.regionalActivity).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6).map(([region, count]) => (
                                        <div key={region} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                                                <span className="text-[10px] font-black uppercase text-white/60 group-hover:text-white transition-colors">{region}</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-primary font-bold">
                                                {count as number} <span className="text-[8px] text-white/20 uppercase">Units</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-white/20 italic text-center py-4">Waiting for regional pings...</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/5 flex gap-3">
                                <AlertCircle size={14} className="text-primary shrink-0" />
                                <p className="text-[9px] text-white/30 leading-relaxed italic">
                                    Sentinel Agent is currently monitoring de-identified telemetry from all active field nodes. Regional normalization applied.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, icon, color, sub, isPercentage }: { title: string, value: number, icon: any, color: string, sub: string, isPercentage?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 rounded-[2.5rem] border-2 border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
        >
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={`w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-colors group-hover:bg-primary/20 ${color}`}>
                    {icon}
                </div>
                <TrendingUp size={16} className="text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
            <div className={`text-5xl font-black tracking-tighter mb-2 relative z-10 italic ${color}`}>
                {value.toLocaleString()}{isPercentage ? '%' : ''}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 relative z-10">{title}</div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 italic relative z-10">{sub}</div>

            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 transition-opacity group-hover:opacity-20 ${color === 'text-reserve-red' ? 'bg-reserve-red' : color === 'text-primary' ? 'bg-primary' : 'bg-access-green'}`} />
        </motion.div>
    );
}

function AwareCategoryBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">{label}</span>
                <span className="text-[10px] font-bold text-white/60">{Math.round(percentage)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className={`h-full ${color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                />
            </div>
        </div>
    );
}
