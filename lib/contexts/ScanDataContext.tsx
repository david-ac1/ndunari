"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserScans, saveScan, deleteScan, deleteAllScans } from '@/lib/services/scan-storage.service';
import { saveScanToHistory, getScanHistory, deleteScanFromHistory, clearScanHistory } from '@/lib/utils/scan-history';

interface ScanDataContextType {
    scans: any[];
    isLoading: boolean;
    error: string | null;
    refreshScans: () => Promise<void>;
    addScan: (scanData: any) => Promise<{ success: boolean; scanId?: string; error?: any }>;
    removeScan: (scanId: string) => Promise<void>;
    clearAll: () => Promise<void>;
    syncWithServer: () => Promise<void>;
}

const ScanDataContext = createContext<ScanDataContextType | null>(null);

/**
 * Centralized Scan Data Provider
 * Single source of truth for all scan data across the application
 */
export function ScanDataProvider({ children }: { children: React.ReactNode }) {
    const [scans, setScans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Refresh scans from Supabase (single source of truth)
     */
    const refreshScans = useCallback(async () => {
        console.log('[SCAN_CONTEXT] Refreshing scans from Supabase...');
        try {
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await getUserScans();

            if (fetchError) {
                console.error('[SCAN_CONTEXT] Error fetching scans:', fetchError);
                setError(fetchError.message);
                // Fallback to localStorage if Supabase fails
                const localScans = getScanHistory();
                setScans(localScans);
            } else {
                console.log(`[SCAN_CONTEXT] Loaded ${data?.length || 0} scans from Supabase`);
                setScans(data || []);

                // Sync to localStorage for offline access
                if (data && data.length > 0) {
                    // Update localStorage to match server state
                    const historyItems = data.map(scan => ({
                        id: scan.id,
                        timestamp: new Date(scan.created_at).getTime(),
                        drugName: scan.drug_name,
                        authenticityScore: scan.authenticity_score,
                        riskLevel: scan.risk_level,
                        nafdacNumber: scan.nafdac_number ?? undefined,
                        imagePreview: scan.image_preview ?? undefined
                    }));
                    localStorage.setItem('ndunari_scan_history', JSON.stringify(historyItems));
                }
            }
        } catch (err: any) {
            console.error('[SCAN_CONTEXT] Fatal error refreshing scans:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Add a new scan (saves to Supabase ONCE, then updates local state)
     */
    const addScan = useCallback(async (scanData: any): Promise<{ success: boolean; scanId?: string; error?: any }> => {
        console.log('[SCAN_CONTEXT] Adding new scan:', scanData.drugName);

        try {
            // Save to Supabase (single save, no duplicates)
            const { data, error: saveError } = await saveScan({
                drugName: scanData.drugName || scanData.forensicAnalysis?.drugName,
                nafdacNumber: scanData.nafdacNumber || scanData.forensicAnalysis?.nafdacNumber,
                batchNumber: scanData.batchNumber,
                expiryDate: scanData.expiryDate,
                authenticityScore: scanData.authenticityScore || scanData.forensicAnalysis?.authenticityScore || 0,
                riskLevel: scanData.riskLevel || scanData.forensicAnalysis?.riskLevel || 'suspicious',
                findings: scanData.findings || scanData.forensicAnalysis?.findings,
                scanMode: scanData.scanMode || 'single',
                anglesScanned: scanData.anglesScanned || 1,
                imagePreview: scanData.imagePreview,
                packageFingerprint: scanData.packageFingerprint,
                forensicAnalysis: scanData.forensicAnalysis,
                stewardshipAssessment: scanData.stewardshipAssessment,
                model3D: scanData.model3D
            });

            if (saveError) {
                console.error('[SCAN_CONTEXT] Error saving scan:', saveError);
                return { success: false, error: saveError };
            }

            if (!data) {
                console.error('[SCAN_CONTEXT] No data returned from saveScan');
                return { success: false, error: 'No data returned' };
            }

            console.log('[SCAN_CONTEXT] Scan saved successfully:', data.id);

            // Optimistically update local state (no need to refetch)
            setScans(prev => [data, ...prev]);

            // Also save to localStorage for offline access
            saveScanToHistory({
                id: data.id,
                timestamp: new Date(data.created_at).getTime(),
                drugName: data.drug_name,
                authenticityScore: data.authenticity_score,
                riskLevel: data.risk_level,
                nafdacNumber: data.nafdac_number ?? undefined,
                imagePreview: data.image_preview ?? undefined
            });

            // Broadcast update event for cross-tab synchronization
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('scan-added', { detail: data }));
                localStorage.setItem('scan-update-timestamp', Date.now().toString());
            }

            return { success: true, scanId: data.id };
        } catch (err: any) {
            console.error('[SCAN_CONTEXT] Fatal error adding scan:', err);
            return { success: false, error: err };
        }
    }, []);

    /**
     * Remove a scan
     */
    const removeScan = useCallback(async (scanId: string) => {
        console.log('[SCAN_CONTEXT] Removing scan:', scanId);

        const { error } = await deleteScan(scanId);

        if (error) {
            console.error('[SCAN_CONTEXT] Error deleting scan:', error);
            setError(error.message);
            return;
        }

        // Update local state
        setScans(prev => prev.filter(s => s.id !== scanId));

        // Remove from localStorage
        deleteScanFromHistory(scanId);

        // Broadcast update
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('scan-removed', { detail: { scanId } }));
        }
    }, []);

    /**
     * Clear all scans
     */
    const clearAll = useCallback(async () => {
        console.log('[SCAN_CONTEXT] Clearing all scans...');

        const { error } = await deleteAllScans();

        if (error) {
            console.error('[SCAN_CONTEXT] Error clearing scans:', error);
            setError(error.message);
            return;
        }

        setScans([]);
        clearScanHistory();

        // Broadcast update
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('scans-cleared'));
        }
    }, []);

    /**
     * Sync localStorage scans to server
     */
    const syncWithServer = useCallback(async () => {
        console.log('[SCAN_CONTEXT] Syncing localStorage to server...');
        const localScans = getScanHistory();

        for (const scan of localScans) {
            // Check if scan exists in server
            const exists = scans.some(s => s.id === scan.id);
            if (!exists) {
                console.log('[SCAN_CONTEXT] Syncing local scan to server:', scan.id);
                await addScan(scan);
            }
        }

        await refreshScans();
    }, [scans, addScan, refreshScans]);

    // Initial load
    useEffect(() => {
        refreshScans();
    }, [refreshScans]);

    // Listen for cross-tab updates
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'scan-update-timestamp') {
                console.log('[SCAN_CONTEXT] Cross-tab update detected, refreshing...');
                refreshScans();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refreshScans]);

    const value: ScanDataContextType = {
        scans,
        isLoading,
        error,
        refreshScans,
        addScan,
        removeScan,
        clearAll,
        syncWithServer
    };

    return (
        <ScanDataContext.Provider value={value}>
            {children}
        </ScanDataContext.Provider>
    );
}

/**
 * Hook to use scan data context
 */
export function useScanData() {
    const context = useContext(ScanDataContext);
    if (!context) {
        throw new Error('useScanData must be used within ScanDataProvider');
    }
    return context;
}
