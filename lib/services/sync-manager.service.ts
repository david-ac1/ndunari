import { getScanHistory, clearScanHistory } from '../utils/scan-history';
import { saveScan } from './scan-storage.service';
import { supabase } from '../supabase/client';

export interface SyncResult {
    synced: number;
    failed: number;
    errors: string[];
}

/**
 * Sync Manager Service
 * Bridges LocalStorage and Supabase Cloud
 */
export const syncManager = {
    /**
     * Synchronize local scans to cloud
     * Called after successful login
     */
    async syncLocalToCloud(): Promise<SyncResult> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { synced: 0, failed: 0, errors: ['No user authenticated'] };

        const localHistory = getScanHistory();
        if (localHistory.length === 0) return { synced: 0, failed: 0, errors: [] };

        console.log(`SyncManager: Found ${localHistory.length} local scans to sync.`);

        const result: SyncResult = { synced: 0, failed: 0, errors: [] };

        // Process sequentially to avoid race conditions or overwhelming the RPC increment
        for (const scan of localHistory) {
            try {
                const { error } = await saveScan({
                    drugName: scan.drugName,
                    nafdacNumber: scan.nafdacNumber,
                    authenticityScore: scan.authenticityScore,
                    riskLevel: scan.riskLevel,
                    imagePreview: scan.imagePreview,
                    // Note: We don't have findings in simple history storage, 
                    // in a real app we might store findings in a separate local key
                });

                if (error) {
                    result.failed++;
                    result.errors.push(`Failed to sync ${scan.drugName}: ${error.message}`);
                } else {
                    result.synced++;
                }
            } catch (e: any) {
                result.failed++;
                result.errors.push(`Error syncing ${scan.drugName}: ${e.message}`);
            }
        }

        if (result.synced > 0) {
            console.log(`SyncManager: Successfully synced ${result.synced} items. Clearing local cache.`);
            // Once synced to cloud, we can clear local to prevent duplicates 
            // since the home page pulls from both but prioritizes cloud IDs
            clearScanHistory();
        }

        return result;
    }
};
