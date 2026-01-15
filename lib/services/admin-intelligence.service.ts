import { supabaseAdmin } from '../supabase/admin';
import { sentinelAgentService, type RiskMask, type RecallNotice, type ForensicCluster, type UnifiedIntelligence } from '../gemini/sentinel-agent.service';

export interface AdminStats {
    totalScans: number;
    safeScans: number;
    suspiciousScans: number;
    counterfeitScans: number;
    totalPrescriptions: number;
    awareDistribution: {
        access: number;
        watch: number;
        reserve: number;
    };
    regionalActivity: Record<string, number>;
}

export class AdminIntelligenceService {
    /**
     * Fetch global aggregate statistics
     */
    async getGlobalStats(): Promise<AdminStats> {
        try {
            // 1. Fetch scan summaries
            const { data: scans, error: scanError } = await supabaseAdmin
                .from('scans')
                .select('risk_level, region');

            if (scanError) throw scanError;

            // 2. Fetch prescription summaries
            const { data: prescriptions, error: presError } = await supabaseAdmin
                .from('prescriptions')
                .select('aware_category');

            if (presError) throw presError;

            // 3. Process Scans
            const stats: AdminStats = {
                totalScans: scans?.length || 0,
                safeScans: scans?.filter(s => s.risk_level === 'safe').length || 0,
                suspiciousScans: scans?.filter(s => s.risk_level === 'suspicious').length || 0,
                counterfeitScans: scans?.filter(s => s.risk_level === 'counterfeit').length || 0,
                totalPrescriptions: prescriptions?.length || 0,
                awareDistribution: {
                    access: prescriptions?.filter(p => p.aware_category === 'ACCESS').length || 0,
                    watch: prescriptions?.filter(p => p.aware_category === 'WATCH').length || 0,
                    reserve: prescriptions?.filter(p => p.aware_category === 'RESERVE').length || 0,
                },
                regionalActivity: {},
            };

            // Calculate regional activity
            scans?.forEach(s => {
                if (s.region) {
                    stats.regionalActivity[s.region] = (stats.regionalActivity[s.region] || 0) + 1;
                }
            });

            return stats;
        } catch (error) {
            console.error("Admin Intelligence Service Error:", error);
            throw error;
        }
    }

    /**
     * Fetch live signal stream (Recent Forensic Activity)
     */
    async getLiveForensicStream(limit = 10) {
        const { data, error } = await supabaseAdmin
            .from('scans')
            .select(`
                id,
                drug_name,
                risk_level,
                authenticity_score,
                region,
                created_at,
                batch_number
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    /**
     * Fetch critical alerts cluster
     */
    async getActiveAlertClusters() {
        const { data, error } = await supabaseAdmin
            .from('counterfeit_alerts')
            .select('*')
            .eq('status', 'active')
            .order('report_count', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getDeepIntelligence(): Promise<UnifiedIntelligence> {
        const { data: scans, error } = await supabaseAdmin
            .from('scans')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return sentinelAgentService.getUnifiedIntelligence(scans || []);
    }
}

export const adminIntelligenceService = new AdminIntelligenceService();
