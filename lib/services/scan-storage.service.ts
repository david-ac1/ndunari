import { supabase, type Scan } from '../supabase/client';
import { type ScanHistoryItem } from '../utils/scan-history';

/**
 * Scan Storage Service
 * Handles CRUD operations for drug package scans
 */

/**
 * Save a scan to Supabase
 */
export async function saveScan(scanData: {
    drugName: string;
    nafdacNumber?: string;
    batchNumber?: string;
    expiryDate?: string;
    authenticityScore: number;
    riskLevel: 'safe' | 'suspicious' | 'counterfeit';
    findings?: any;
    scanMode?: 'single' | 'multi';
    anglesScanned?: number;
    imagePreview?: string;
    region?: string;
}): Promise<{ data: Scan | null; error: any }> {
    // Get current user and privacy preference
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: new Error('User not authenticated') };
    }

    // Check privacy preference
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('share_data')
        .eq('id', user.id)
        .single();

    const sharingEnabled = profile?.share_data !== false;

    // Insert scan (redact region if sharing is disabled)
    console.log("Supabase: Attempting to insert scan for user", user.id);
    const { data, error } = await supabase
        .from('scans')
        .insert({
            user_id: user.id,
            drug_name: scanData.drugName,
            nafdac_number: scanData.nafdacNumber || null,
            batch_number: scanData.batchNumber || null,
            expiry_date: scanData.expiryDate || null,
            authenticity_score: scanData.authenticityScore,
            risk_level: scanData.riskLevel,
            findings: scanData.findings || null,
            scan_mode: scanData.scanMode || 'single',
            angles_scanned: scanData.anglesScanned || 1,
            image_preview: scanData.imagePreview || null,
            region: sharingEnabled ? (scanData.region || null) : 'REDACTED',
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase: Error saving scan:', error.message, error.details);
        return { data: null, error };
    }

    console.log("Supabase: Scan saved successfully with ID", data.id);

    // Update user profile stats
    await updateUserStats(user.id, 'scan');

    return { data, error: null };
}

/**
 * Get all scans for current user
 */
export async function getUserScans(limit = 50): Promise<{ data: Scan[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching scans:', error);
        return { data: null, error };
    }

    return { data, error: null };
}

/**
 * Delete a scan
 */
export async function deleteScan(scanId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId);

    if (error) {
        console.error('Error deleting scan:', error);
        return { error };
    }

    return { error: null };
}

/**
 * Delete all scans for current user
 */
export async function deleteAllScans(): Promise<{ error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
        .from('scans')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting all scans:', error);
        return { error };
    }

    return { error: null };
}

/**
 * Get scan statistics for user
 */
export async function getScanStats(): Promise<{
    total: number;
    safe: number;
    suspicious: number;
    counterfeit: number;
}> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { total: 0, safe: 0, suspicious: 0, counterfeit: 0 };
    }

    const { data } = await supabase
        .from('scans')
        .select('risk_level')
        .eq('user_id', user.id);

    if (!data) {
        return { total: 0, safe: 0, suspicious: 0, counterfeit: 0 };
    }

    return {
        total: data.length,
        safe: data.filter(s => s.risk_level === 'safe').length,
        suspicious: data.filter(s => s.risk_level === 'suspicious').length,
        counterfeit: data.filter(s => s.risk_level === 'counterfeit').length,
    };
}

/**
 * Update user profile statistics
 */
async function updateUserStats(userId: string, type: 'scan' | 'prescription') {
    const field = type === 'scan' ? 'total_scans' : 'total_prescriptions_analyzed';

    const { error } = await supabase.rpc('increment', {
        row_id: userId,
        field_name: field,
    });

    if (error) {
        // Try alternative method if RPC not available
        const { data: profile } = await supabase
            .from('user_profiles')
            .select(field)
            .eq('id', userId)
            .single();

        if (profile) {
            await supabase
                .from('user_profiles')
                .update({ [field]: (profile[field as keyof typeof profile] as number) + 1 })
                .eq('id', userId);
        }
    }
}

/**
 * Get global surveillance data (De-identified)
 * Used for the health map
 */
export async function getGlobalSurveillanceData(): Promise<{
    region: string;
    safe: number;
    suspicious: number;
    counterfeit: number;
    total: number;
    lastDetected: string;
}[]> {
    const { data, error } = await supabase
        .from('scans')
        .select('region, risk_level, created_at');

    if (error || !data) {
        console.error('Error fetching surveillance data:', error);
        return [];
    }

    // Group by region
    const regionalData: Record<string, any> = {};

    data.forEach(scan => {
        const region = scan.region || 'Unknown';
        if (!regionalData[region]) {
            regionalData[region] = {
                region,
                safe: 0,
                suspicious: 0,
                counterfeit: 0,
                total: 0,
                lastDetected: scan.created_at,
            };
        }

        regionalData[region].total++;
        if (scan.risk_level === 'safe') regionalData[region].safe++;
        else if (scan.risk_level === 'suspicious') regionalData[region].suspicious++;
        else if (scan.risk_level === 'counterfeit') regionalData[region].counterfeit++;

        if (new Date(scan.created_at) > new Date(regionalData[region].lastDetected)) {
            regionalData[region].lastDetected = scan.created_at;
        }
    });

    return Object.values(regionalData).sort((a, b) => b.total - a.total);
}

/**
 * Save multi-angle evidence images to the temporary vault
 */
export async function saveScanEvidence(scanId: string, evidence: Map<string, string>): Promise<{ success: boolean; error: any }> {
    try {
        const evidenceEntries = Array.from(evidence.entries()).map(([angle, data]) => ({
            scan_id: scanId,
            angle_type: angle,
            image_data: data, // In a real prod app, we'd upload to a bucket and store the URL
        }));

        const { error } = await supabase
            .from('scan_evidence')
            .insert(evidenceEntries);

        if (error) {
            console.error('Error saving scan evidence:', error);
            return { success: false, error };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Failed to save scan evidence:', err);
        return { success: false, error: err };
    }
}

/**
 * Get evidence for a specific scan
 */
export async function getScanEvidence(scanId: string): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
        .from('scan_evidence')
        .select('*')
        .eq('scan_id', scanId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching scan evidence:', error);
        return { data: null, error };
    }

    return { data, error: null };
}

/**
 * Synchronize local scans to Supabase
 */
export async function syncLocalScans(localScans: ScanHistoryItem[]): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || localScans.length === 0) return 0;

    // Get existing scan IDs from cloud to avoid duplicates
    const { data: cloudScans } = await getUserScans();
    const cloudIds = new Set(cloudScans?.map(s => s.id) || []);

    const toSync = localScans.filter(ls => !cloudIds.has(ls.id));
    if (toSync.length === 0) return 0;

    let syncCount = 0;
    for (const scan of toSync) {
        const { error } = await saveScan({
            drugName: scan.drugName,
            nafdacNumber: scan.nafdacNumber,
            authenticityScore: scan.authenticityScore,
            riskLevel: scan.riskLevel,
            findings: [], // Findings aren't stored in local history currently
            scanMode: 'single', // Default for legacy sync
            anglesScanned: 1,
            imagePreview: scan.imagePreview
        });
        if (!error) syncCount++;
    }

    return syncCount;
}
