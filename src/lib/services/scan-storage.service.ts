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
    id?: string; // NEW: Optional ID for tracking
    drugName: string;
    nafdacNumber?: string;
    batchNumber?: string;
    expiryDate?: string;
    authenticityScore: number;
    riskLevel: 'safe' | 'suspicious' | 'counterfeit';
    findings?: any;
    scanMode?: 'single' | 'multi' | '3d-verification';
    anglesScanned?: number;
    imagePreview?: string;
    region?: string;
    packageFingerprint?: string; // For deduplication
    userId?: string; // NEW: Optional user ID for tracking
    timestamp?: string; // NEW: Optional timestamp
    forensicAnalysis?: any; // NEW: Full forensic data
    stewardshipAssessment?: any; // NEW: Stewardship data
    model3D?: any; // NEW: 3D model data
    latitude?: number; // NEW
    longitude?: number; // NEW
}, supabaseClient = supabase): Promise<{ data: Scan | null; error: any }> { // Allow injection
    // === DIAGNOSTIC LOGGING ===
    const callStack = new Error().stack?.split('\n').slice(2, 5).join('\n') || 'N/A';
    console.log('[LEDGER] saveScan CALLED:', {
        scanId: scanData.id || 'NEW',
        drugName: scanData.drugName,
        timestamp: new Date().toISOString(),
        callStack
    });
    // Get current user and privacy preference
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user && !scanData.userId) {
        return { data: null, error: new Error('User not authenticated') };
    }
    const userId = user?.id || scanData.userId!;

    // Check privacy preference
    const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('share_data')
        .eq('id', userId)
        .single();

    const sharingEnabled = profile?.share_data !== false;

    // --- REGION DETERMINATION ---
    // If we have coords but no region, try to map it to a Nigerian city for the heatmap
    let finalRegion = scanData.region;
    if (!finalRegion && scanData.latitude && scanData.longitude && sharingEnabled) {
        finalRegion = getNearestNigerianCity(scanData.latitude, scanData.longitude) || undefined;
    }
    // Default fallback if privacy enabled or no match
    finalRegion = sharingEnabled ? (finalRegion || 'Unknown') : 'REDACTED';

    // --- IDEMPOTENCY CHECK ---
    // If we have a fingerprint, check if this exact drug was scanned by this user in the last 5 minutes
    if (scanData.packageFingerprint) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: existingScan } = await supabaseClient
            .from('scans')
            .select('id, created_at')
            .eq('user_id', userId) // Use consistent userId
            .eq('drug_name', scanData.drugName)
            .eq('nafdac_number', scanData.nafdacNumber || null)
            .eq('batch_number', scanData.batchNumber || null)
            .gt('created_at', fiveMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingScan) {
            console.log("Supabase: Duplicate scan detected via fingerprint. Merging data into existing ID:", existingScan.id);
            // We return the existing scan to prevent a new entry in the UI history too
            return { data: { ...existingScan, ...scanData } as any, error: null };
        }
    }
    // ---------------------------
    console.log("Supabase: Attempting to insert scan for user", userId);

    // Format location for PostGIS if coords provided
    const locationData = (scanData.latitude && scanData.longitude)
        ? `POINT(${scanData.longitude} ${scanData.latitude})`
        : null;

    const { data, error } = await supabaseClient
        .from('scans')
        .insert({
            id: scanData.id,
            user_id: userId,
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
            region: finalRegion,
            location: locationData, // PostGIS field
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase: Error saving scan:', error.message, error.details);
        return { data: null, error };
    }


    console.log("[LEDGER] Scan saved successfully:", {
        scanId: data.id,
        drugName: data.drug_name,
        timestamp: data.created_at
    });

    // === POST-SAVE VERIFICATION ===
    // Check if duplicate was created despite idempotency check
    const { data: duplicateCheck } = await supabaseClient
        .from('scans')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('drug_name', scanData.drugName)
        .eq('nafdac_number', scanData.nafdacNumber || null)
        .order('created_at', { ascending: false })
        .limit(2);

    if (duplicateCheck && duplicateCheck.length > 1) {
        const timeDiff = new Date(duplicateCheck[0].created_at).getTime() -
            new Date(duplicateCheck[1].created_at).getTime();
        if (timeDiff < 10000) { // Within 10 seconds
            console.error('[LEDGER] ⚠️ DUPLICATE DETECTED AFTER SAVE!', {
                scanIds: duplicateCheck.map(s => s.id),
                timestamps: duplicateCheck.map(s => s.created_at),
                timeDiffMs: timeDiff
            });
        }
    }

    // Update user profile stats
    await updateUserStats(userId, 'scan', supabaseClient);

    return { data, error: null };
}

/**
 * Get all scans for current user
 */
export async function getUserScans(limit = 50): Promise<{ data: Scan[] | null; error: any }> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return { data: null, error: new Error('User not authenticated') };
        }

        const { data, error } = await supabase
            .from('scans')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data: data as Scan[], error: null };
    } catch (err: any) {
        console.error('Error fetching scans (Client):', err);
        return { data: null, error: err };
    }
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
async function updateUserStats(userId: string, type: 'scan' | 'prescription', supabaseClient = supabase) {
    const field = type === 'scan' ? 'total_scans' : 'total_prescriptions_analyzed';

    const { error } = await supabaseClient.rpc('increment', {
        row_id: userId,
        field_name: field,
    });

    if (error) {
        // Try alternative method if RPC not available
        const { data: profile } = await supabaseClient
            .from('user_profiles')
            .select(field)
            .eq('id', userId)
            .single();

        if (profile) {
            await supabaseClient
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
export async function saveScanEvidence(scanId: string, evidence: Map<string, string>, supabaseClient = supabase): Promise<{ success: boolean; error: any }> {
    try {
        const evidenceEntries = Array.from(evidence.entries()).map(([angle, data]) => ({
            scan_id: scanId,
            angle_type: angle,
            image_data: data, // In a real prod app, we'd upload to a bucket and store the URL
        }));

        const { error } = await supabaseClient
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

/**
 * Simple reverse geocoding for Nigerian Major Cities
 * Used to bucket scans into regions for the heatmap
 */
function getNearestNigerianCity(lat: number, lon: number): string | null {
    const cities = [
        { name: "Lagos", lat: 6.5244, lon: 3.3792 },
        { name: "Abuja", lat: 9.0765, lon: 7.3986 },
        { name: "Kano", lat: 12.0022, lon: 8.5920 },
        { name: "Port Harcourt", lat: 4.8156, lon: 7.0498 },
        { name: "Ibadan", lat: 7.3775, lon: 3.9470 },
        { name: "Enugu", lat: 6.4584, lon: 7.5464 },
        { name: "Maiduguri", lat: 11.8311, lon: 13.1510 },
        { name: "Kaduna", lat: 10.5105, lon: 7.4165 },
        { name: "Jos", lat: 9.8965, lon: 8.8583 },
        { name: "Benin City", lat: 6.3350, lon: 5.6037 },
        { name: "Sokoto", lat: 13.0059, lon: 5.2476 },
        { name: "Bauchi", lat: 10.3103, lon: 9.8439 }
    ];

    let nearest = null;
    let minDist = Infinity;

    for (const city of cities) {
        const dist = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2));
        if (dist < minDist) {
            minDist = dist;
            nearest = city.name;
        }
    }

    // Threshold: Only map if within ~2 degrees (roughly 200km) to avoid weird mapping for overseas scans
    if (minDist > 3.0) return "International";

    return nearest;
}
