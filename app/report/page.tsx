"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getScanHistory, type ScanHistoryItem } from "@/lib/utils/scan-history";

interface DrugStats {
    name: string;
    count: number;
    avgScore: number;
    riskLevel: "safe" | "suspicious" | "counterfeit";
}

export default function ReportPage() {
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const [safetyIndex, setSafetyIndex] = useState(0);
    const [topDrugs, setTopDrugs] = useState<DrugStats[]>([]);

    useEffect(() => {
        const history = getScanHistory();
        setScanHistory(history);

        // Calculate safety index (0-100)
        if (history.length > 0) {
            const avgScore = history.reduce((sum, scan) => sum + scan.authenticityScore, 0) / history.length;
            setSafetyIndex(Math.round(avgScore));
        }

        // Calculate top scanned drugs
        const drugMap = new Map<string, { count: number; totalScore: number; riskLevel: string }>();
        history.forEach(scan => {
            const existing = drugMap.get(scan.drugName) || { count: 0, totalScore: 0, riskLevel: scan.riskLevel };
            drugMap.set(scan.drugName, {
                count: existing.count + 1,
                totalScore: existing.totalScore + scan.authenticityScore,
                riskLevel: scan.riskLevel,
            });
        });

        const drugs = Array.from(drugMap.entries())
            .map(([name, data]) => ({
                name,
                count: data.count,
                avgScore: Math.round(data.totalScore / data.count),
                riskLevel: data.riskLevel as "safe" | "suspicious" | "counterfeit",
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        setTopDrugs(drugs);
    }, []);

    const stats = {
        total: scanHistory.length,
        safe: scanHistory.filter(s => s.riskLevel === 'safe').length,
        suspicious: scanHistory.filter(s => s.riskLevel === 'suspicious').length,
        counterfeit: scanHistory.filter(s => s.riskLevel === 'counterfeit').length,
    };

    const safePercentage = stats.total > 0 ? Math.round((stats.safe / stats.total) * 100) : 0;
    const suspiciousPercentage = stats.total > 0 ? Math.round((stats.suspicious / stats.total) * 100) : 0;
    const counterfeitPercentage = stats.total > 0 ? Math.round((stats.counterfeit / stats.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
                        <span className="text-2xl">←</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Stewardship Report</h1>
                        <p className="text-sm text-white/70">AMR Surveillance & Safety Dashboard</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {scanHistory.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="text-5xl">📊</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Data Yet</h2>
                        <p className="text-white/70 mb-6">Start scanning drugs to see your stewardship impact</p>
                        <Link
                            href="/scan"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            <span className="text-xl">📷</span>
                            Start Scanning
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Safety Index Hero */}
                        <section className="mb-8">
                            <div className="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
                                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                                    <div className="text-center lg:text-left">
                                        <h2 className="text-lg font-bold text-white/70 mb-2">Community Safety Index</h2>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-6xl font-bold ${safetyIndex >= 85 ? 'text-access-green' :
                                                    safetyIndex >= 60 ? 'text-watch-orange' :
                                                        'text-reserve-red'
                                                }`}>
                                                {safetyIndex}
                                            </span>
                                            <span className="text-3xl text-white/50">/100</span>
                                        </div>
                                        <p className="text-sm text-white/70 mt-2">Based on {stats.total} scans</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center px-6 py-4 rounded-xl bg-white/5">
                                            <p className="text-2xl font-bold text-access-green">{safePercentage}%</p>
                                            <p className="text-xs text-white/70 mt-1">Safe</p>
                                        </div>
                                        <div className="text-center px-6 py-4 rounded-xl bg-white/5">
                                            <p className="text-2xl font-bold text-watch-orange">{suspiciousPercentage}%</p>
                                            <p className="text-xs text-white/70 mt-1">Suspicious</p>
                                        </div>
                                        <div className="text-center px-6 py-4 rounded-xl bg-white/5">
                                            <p className="text-2xl font-bold text-reserve-red">{counterfeitPercentage}%</p>
                                            <p className="text-xs text-white/70 mt-1">Counterfeit</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                            {/* WHO AWaRe Distribution */}
                            <section className="glass-panel p-6 rounded-xl border border-white/10">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">🎯</span> WHO AWaRe Context
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/70">ACCESS (First-line)</span>
                                        <span className="text-access-green font-bold">Preferred</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-access-green" style={{ width: '70%' }} />
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-sm text-white/70">WATCH (Second-line)</span>
                                        <span className="text-watch-orange font-bold">Monitor</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-watch-orange" style={{ width: '25%' }} />
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-sm text-white/70">RESERVE (Last resort)</span>
                                        <span className="text-reserve-red font-bold">Restrict</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-reserve-red" style={{ width: '5%' }} />
                                    </div>
                                </div>
                            </section>

                            {/* AMR Risk Alerts */}
                            <section className="glass-panel p-6 rounded-xl border border-watch-orange/30">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">⚠️</span> AMR Risk Alerts
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="p-3 rounded-lg bg-reserve-red/10 border border-reserve-red/30">
                                        <p className="font-bold text-reserve-red mb-1">High Resistance</p>
                                        <p className="text-white/70">Ciprofloxacin: 68% resistant in UTIs</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-watch-orange/10 border border-watch-orange/30">
                                        <p className="font-bold text-watch-orange mb-1">Rising Concern</p>
                                        <p className="text-white/70">Azithromycin: 42% resistance trend</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-access-green/10 border border-access-green/30">
                                        <p className="font-bold text-access-green mb-1">Still Effective</p>
                                        <p className="text-white/70">Amoxicillin: 15% resistance only</p>
                                    </div>
                                </div>
                            </section>

                            {/* Key Recommendations */}
                            <section className="glass-panel p-6 rounded-xl border border-primary/30">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">💡</span> Key Recommendations
                                </h3>
                                <ul className="space-y-3 text-sm text-white/90">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Use ACCESS antibiotics as first-line treatment</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Avoid fluoroquinolones for simple UTIs</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Reserve carbapenems for hospital use only</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>Complete full antibiotic course as prescribed</span>
                                    </li>
                                </ul>
                            </section>
                        </div>

                        {/* Most Scanned Drugs */}
                        {topDrugs.length > 0 && (
                            <section className="glass-panel p-6 rounded-xl border border-white/10">
                                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">📈</span> Most Scanned Drugs
                                </h3>
                                <div className="space-y-3">
                                    {topDrugs.map((drug, index) => (
                                        <div key={drug.name} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                            <span className="text-2xl font-bold text-white/30 w-8">#{index + 1}</span>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white">{drug.name}</h4>
                                                <p className="text-xs text-white/70">{drug.count} scans</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-full text-sm font-bold ${drug.riskLevel === 'safe' ? 'bg-access-green/20 text-access-green' :
                                                    drug.riskLevel === 'suspicious' ? 'bg-watch-orange/20 text-watch-orange' :
                                                        'bg-reserve-red/20 text-reserve-red'
                                                }`}>
                                                {drug.avgScore}% avg
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* AI Insights */}
                        <section className="mt-8 p-6 rounded-xl bg-primary/10 border border-primary/30">
                            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                <span className="text-xl">🤖</span> AI-Powered Insights
                            </h3>
                            <div className="space-y-3 text-white/90">
                                <p className="leading-relaxed">
                                    <strong className="text-primary">Community Impact:</strong> Your {stats.total} scans contribute to Nigeria's pharmaceutical surveillance network.
                                    {stats.counterfeit > 0 && ` You've helped identify ${stats.counterfeit} potentially counterfeit product${stats.counterfeit > 1 ? 's' : ''}.`}
                                </p>
                                <p className="leading-relaxed">
                                    <strong className="text-primary">AMR Awareness:</strong> By choosing ACCESS antibiotics over WATCH/RESERVE drugs, you help combat antimicrobial resistance and preserve last-resort treatments for future generations.
                                </p>
                                <p className="leading-relaxed">
                                    <strong className="text-primary">Next Steps:</strong> Continue scanning drug packages and analyzing prescriptions. Share this tool with your community to expand our pharmaceutical safety network.
                                </p>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
