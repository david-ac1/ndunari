"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getScanHistory, deleteScanFromHistory, clearScanHistory, type ScanHistoryItem } from "@/lib/utils/scan-history";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { getUserScans, deleteScan, deleteAllScans } from "@/lib/services/scan-storage.service";
import { type Scan } from "@/lib/supabase/client";

export default function HistoryPage() {
    const { user, loading } = useAuth();
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<ScanHistoryItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'safe' | 'suspicious' | 'counterfeit'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'score'>('recent');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadHistory = useCallback(async () => {
        setIsSyncing(true);
        try {
            // 1. Load from localStorage (Legacy)
            const localHistory = getScanHistory();

            // 2. Load from Supabase (Cloud)
            let combinedHistory = [...localHistory];

            if (user) {
                const { data: cloudScans, error } = await getUserScans();
                if (!error && cloudScans) {
                    // Map cloud scans to local format
                    const mappedCloudScans: ScanHistoryItem[] = cloudScans.map(s => ({
                        id: s.id, // Supabase UUID
                        timestamp: new Date(s.created_at).getTime(),
                        drugName: s.drug_name,
                        authenticityScore: s.authenticity_score,
                        riskLevel: s.risk_level,
                        nafdacNumber: s.nafdac_number || undefined,
                        imagePreview: s.image_preview || undefined
                    }));

                    // Simple de-duplication (heuristic: same drug, same score, same timestamp within 5s)
                    const existingIds = new Set(localHistory.map(l => l.id));
                    const newCloudScans = mappedCloudScans.filter(cs => !existingIds.has(cs.id));

                    combinedHistory = [...localHistory, ...newCloudScans];
                }
            }

            // Sort by timestamp initially
            combinedHistory.sort((a, b) => b.timestamp - a.timestamp);
            setScanHistory(combinedHistory);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [user]);

    useEffect(() => {
        if (!loading) {
            loadHistory();
        }
    }, [user, loading, loadHistory]);

    useEffect(() => {
        // Apply filters
        let filtered = [...scanHistory];

        if (filter !== 'all') {
            filtered = filtered.filter(scan => scan.riskLevel === filter);
        }

        // Apply sorting
        if (sortBy === 'recent') {
            filtered.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            filtered.sort((a, b) => b.authenticityScore - a.authenticityScore);
        }

        setFilteredHistory(filtered);
    }, [scanHistory, filter, sortBy]);

    const handleDelete = async (scanId: string) => {
        // 1. Delete from localStorage (if it exists there)
        deleteScanFromHistory(scanId);

        // 2. Delete from Supabase (if it's a UUID)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{10,12}$/i.test(scanId);
        if (isUuid && user) {
            await deleteScan(scanId);
        }

        loadHistory();
    };

    const handleClearAll = async () => {
        // 1. Clear local
        clearScanHistory();

        // 2. Clear cloud
        if (user) {
            await deleteAllScans();
        }

        loadHistory();
        setShowClearConfirm(false);
    };

    const stats = {
        total: scanHistory.length,
        safe: scanHistory.filter(s => s.riskLevel === 'safe').length,
        suspicious: scanHistory.filter(s => s.riskLevel === 'suspicious').length,
        counterfeit: scanHistory.filter(s => s.riskLevel === 'counterfeit').length,
    };

    return (
        <div className="min-h-screen bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
                            <span className="text-2xl">←</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Scan History</h1>
                            <p className="text-sm text-white/70">{stats.total} total scans</p>
                        </div>
                    </div>
                    {scanHistory.length > 0 && (
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="text-sm text-reserve-red hover:underline"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {scanHistory.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="text-5xl">📭</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Scan History Yet</h2>
                        <p className="text-white/70 mb-6">Start scanning drug packages to build your history</p>
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
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="glass-panel p-4 rounded-xl border border-white/10">
                                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                                <p className="text-xs text-white/70 mt-1">Total Scans</p>
                            </div>
                            <div className="glass-panel p-4 rounded-xl border border-access-green/30">
                                <p className="text-3xl font-bold text-access-green">{stats.safe}</p>
                                <p className="text-xs text-white/70 mt-1">Verified Safe</p>
                            </div>
                            <div className="glass-panel p-4 rounded-xl border border-watch-orange/30">
                                <p className="text-3xl font-bold text-watch-orange">{stats.suspicious}</p>
                                <p className="text-xs text-white/70 mt-1">Suspicious</p>
                            </div>
                            <div className="glass-panel p-4 rounded-xl border border-reserve-red/30">
                                <p className="text-3xl font-bold text-reserve-red">{stats.counterfeit}</p>
                                <p className="text-xs text-white/70 mt-1">Counterfeit</p>
                            </div>
                        </div>

                        {/* Filters & Sort */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            {/* Filter */}
                            <div className="flex-1">
                                <label className="text-xs text-white/70 mb-2 block">Filter by Risk</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                            ? 'bg-primary text-white'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('safe')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'safe'
                                            ? 'bg-access-green text-white'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        Safe
                                    </button>
                                    <button
                                        onClick={() => setFilter('suspicious')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'suspicious'
                                            ? 'bg-watch-orange text-white'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        Suspicious
                                    </button>
                                    <button
                                        onClick={() => setFilter('counterfeit')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'counterfeit'
                                            ? 'bg-reserve-red text-white'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        Counterfeit
                                    </button>
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="text-xs text-white/70 mb-2 block">Sort by</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'score')}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-white border border-white/10 focus:border-primary focus:outline-none"
                                >
                                    <option value="recent">Most Recent</option>
                                    <option value="score">Highest Score</option>
                                </select>
                            </div>
                        </div>

                        {/* Scan List */}
                        <div className="space-y-4">
                            {filteredHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-white/70">No scans match your filter</p>
                                </div>
                            ) : (
                                filteredHistory.map((scan) => (
                                    <div
                                        key={scan.id}
                                        className="glass-panel p-6 rounded-xl border border-white/10 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Image Preview */}
                                            {scan.imagePreview && (
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={scan.imagePreview}
                                                        alt={scan.drugName}
                                                        className="w-full lg:w-32 h-32 rounded-lg object-cover"
                                                    />
                                                </div>
                                            )}

                                            {/* Scan Details */}
                                            <div className="flex-1 min-w-0">
                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold text-white mb-1">{scan.drugName}</h3>
                                                        <p className="text-sm text-white/70">
                                                            {new Date(scan.timestamp).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(scan.id)}
                                                        className="text-reserve-red hover:text-reserve-red/70 transition-colors p-2"
                                                        title="Delete scan"
                                                    >
                                                        <span className="text-xl">🗑️</span>
                                                    </button>
                                                </div>

                                                {/* Score Badge */}
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${scan.riskLevel === 'safe' ? 'bg-access-green/20 border border-access-green/30' :
                                                        scan.riskLevel === 'suspicious' ? 'bg-watch-orange/20 border border-watch-orange/30' :
                                                            'bg-reserve-red/20 border border-reserve-red/30'
                                                        }`}>
                                                        <span className="text-2xl">
                                                            {scan.riskLevel === 'safe' ? '✅' :
                                                                scan.riskLevel === 'suspicious' ? '⚠️' : '❌'}
                                                        </span>
                                                        <div>
                                                            <p className={`text-lg font-bold ${scan.riskLevel === 'safe' ? 'text-access-green' :
                                                                scan.riskLevel === 'suspicious' ? 'text-watch-orange' :
                                                                    'text-reserve-red'
                                                                }`}>
                                                                {scan.authenticityScore}%
                                                            </p>
                                                            <p className="text-xs text-white/70 uppercase">
                                                                {scan.riskLevel}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* NAFDAC Info */}
                                                {scan.nafdacNumber && (
                                                    <div className="mb-3">
                                                        <span className="text-xs text-white/50 uppercase">NAFDAC Reg.</span>
                                                        <p className="text-white font-mono">{scan.nafdacNumber}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Clear All History?</h2>
                        <p className="text-white/70 mb-6">
                            This will permanently delete all {stats.total} scan{stats.total > 1 ? 's' : ''} from your history. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 py-3 bg-reserve-red text-white rounded-xl font-bold hover:bg-reserve-red/80 transition-colors"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
