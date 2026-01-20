"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGlobalSurveillanceData } from "@/lib/services/scan-storage.service";

interface RegionSignal {
    region: string;
    safe: number;
    suspicious: number;
    counterfeit: number;
    total: number;
    lastDetected: string;
}

// Map coordinates for Nigerian regions (viewBox="0 0 1000 800")
const regionCoords: Record<string, { x: number, y: number }> = {
    "Lagos": { x: 120, y: 680 },
    "Abuja": { x: 480, y: 420 },
    "Kano": { x: 580, y: 140 },
    "Port Harcourt": { x: 460, y: 740 },
    "Ibadan": { x: 160, y: 620 },
    "Enugu": { x: 540, y: 680 },
    "Maiduguri": { x: 920, y: 100 },
    "Kaduna": { x: 460, y: 280 },
    "Jos": { x: 600, y: 380 },
    "Benin City": { x: 340, y: 680 },
    "Sokoto": { x: 280, y: 100 },
    "Bauchi": { x: 720, y: 280 },
    "Unknown": { x: 500, y: 400 }, // Default center
};

export default function MapPage() {
    const [signals, setSignals] = useState<RegionSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState<RegionSignal | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getGlobalSurveillanceData();
            setSignals(data);
            setLoading(false);
            if (data.length > 0) setSelectedRegion(data[0]);
        }
        load();
    }, []);

    const totalSignals = signals.reduce((sum, s) => sum + s.total, 0);
    const totalRisk = signals.reduce((sum, s) => sum + s.counterfeit + s.suspicious, 0);

    return (
        <div className="min-h-screen bg-background-dark text-white">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
                            <span className="text-2xl">←</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Surveillance Map</h1>
                            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Ndunari Health Shield | Nigeria</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-white/40 uppercase font-bold">Total Signals</p>
                            <p className="text-xl font-bold text-primary">{totalSignals}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-white/40 uppercase font-bold">Risk Alerts</p>
                            <p className="text-xl font-bold text-reserve-red">{totalRisk}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
                {/* Map Sidebar */}
                <aside className="w-full lg:w-96 bg-white/5 border-r border-white/10 overflow-y-auto p-6 lg:h-full">
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                LIVE SIGNAL STREAM
                            </h3>
                            <div className="space-y-3">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                                    ))
                                ) : signals.length === 0 ? (
                                    <p className="text-sm text-white/40 italic">Waiting for regional signals...</p>
                                ) : (
                                    signals.map((signal) => (
                                        <button
                                            key={signal.region}
                                            onClick={() => setSelectedRegion(signal)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedRegion?.region === signal.region
                                                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                                                : 'bg-white/5 border-transparent hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold">{signal.region}</h4>
                                                <span className="text-[10px] text-white/40 font-mono">
                                                    {new Date(signal.lastDetected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-access-green"
                                                            style={{ width: `${(signal.safe / signal.total) * 100}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-access-green font-bold mt-1">{signal.safe} Safe</p>
                                                </div>
                                                <div className="flex-1 text-right">
                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-reserve-red"
                                                            style={{ width: `${((signal.suspicious + signal.counterfeit) / signal.total) * 100}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-reserve-red font-bold mt-1">{signal.suspicious + signal.counterfeit} Alerts</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Public Health Warning */}
                        <section className="p-4 rounded-xl bg-watch-orange/10 border border-watch-orange/30">
                            <h4 className="text-watch-orange font-bold text-sm mb-2">⚠️ Regional Watch</h4>
                            <p className="text-xs text-white/70 leading-relaxed">
                                High frequency of suspicious scans detected in {signals[0]?.region || 'Urban Clusters'}. Communities are advised to scan all packages via Forensic Eye.
                            </p>
                        </section>
                    </div>
                </aside>

                {/* Map Interface */}
                <section className="flex-1 relative bg-[#0a1a0a] overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />

                    {/* SVG Map of Nigeria (Simplified Shape) */}
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <svg
                            viewBox="0 0 1000 800"
                            className="w-full h-full max-w-4xl opacity-40"
                            style={{ filter: 'drop-shadow(0 0 40px rgba(34, 197, 94, 0.1))' }}
                        >
                            <path
                                d="M120,680 L80,500 L120,300 L250,100 L450,80 L650,60 L850,80 L950,250 L920,450 L850,650 L700,750 L500,780 L250,750 Z"
                                fill="none"
                                stroke="rgba(34, 197, 94, 0.4)"
                                strokeWidth="2"
                                strokeDasharray="10 5"
                            />

                            {/* Region Indicators */}
                            {signals.map((signal) => {
                                const coords = regionCoords[signal.region] || regionCoords["Unknown"];
                                const isSelected = selectedRegion?.region === signal.region;
                                const hasRisk = signal.counterfeit > 0 || signal.suspicious > 0;

                                return (
                                    <g key={signal.region} className="cursor-pointer group" onClick={() => setSelectedRegion(signal)}>
                                        {/* Pulse Halo */}
                                        <circle
                                            cx={coords.x}
                                            cy={coords.y}
                                            r={isSelected ? 30 : 20}
                                            className={`${hasRisk ? 'fill-reserve-red/20' : 'fill-primary/20'} animate-ping`}
                                            style={{ animationDuration: '3s' }}
                                        />
                                        {/* Signal Dot */}
                                        <circle
                                            cx={coords.x}
                                            cy={coords.y}
                                            r={isSelected ? 10 : 6}
                                            className={`${hasRisk ? 'fill-reserve-red shadow-lg shadow-reserve-red/50' : 'fill-primary shadow-lg shadow-primary/50'} transition-all duration-300`}
                                        />
                                        {/* Label */}
                                        <text
                                            x={coords.x + 15}
                                            y={coords.y + 5}
                                            className={`text-[12px] font-bold ${isSelected ? 'fill-white' : 'fill-white/40'} pointer-events-none group-hover:fill-white transition-colors`}
                                        >
                                            {signal.region}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* Float Overlay: Selected Region Info */}
                    {selectedRegion && (
                        <div className="absolute bottom-8 right-8 w-80 glass-panel p-6 rounded-2xl border border-white/10 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold">{selectedRegion.region}</h3>
                                    <p className="text-xs text-white/50">Regional Diagnostics Active</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${selectedRegion.counterfeit > 0 ? 'bg-reserve-red/20 text-reserve-red' : 'bg-primary/20 text-primary'
                                    }`}>
                                    {selectedRegion.counterfeit > 0 ? 'CRITICAL RISK' : 'STABLE'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Authentic</p>
                                    <p className="text-xl font-bold text-access-green">{selectedRegion.safe}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Counterfeit</p>
                                    <p className="text-xl font-bold text-reserve-red">{selectedRegion.counterfeit}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold">
                                    <span className="text-white/40">Vigilance Score</span>
                                    <span className="text-white">{((selectedRegion.safe / selectedRegion.total) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${(selectedRegion.safe / selectedRegion.total) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">
                                GENERATE REGIONAL REPORT
                            </button>
                        </div>
                    )}

                    {/* Map Legend */}
                    <div className="absolute top-8 right-8 flex flex-col gap-2 p-4 bg-background-dark/80 backdrop-blur-md rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary" />
                            <span>SAFE CLUSTER</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-reserve-red shadow-sm shadow-reserve-red" />
                            <span>FAKE ANTICIPATED</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-watch-orange shadow-sm shadow-watch-orange" />
                            <span>SUSPICIOUS TREND</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
