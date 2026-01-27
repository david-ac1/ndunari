'use server';

import { sentinelAgentService, type SentinelDirective } from "@/lib/gemini/sentinel-agent.service";
import { getGlobalSurveillanceData } from "@/lib/services/scan-storage.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Server Action to analyze surveillance logs using Gemini.
 * This runs securely on the server, protecting the API Key.
 * Now enhanced with Global Collective Intelligence + Medication Adherence.
 */
export async function analyzeSurveillanceLogsAction(scanList: any[], userId?: string): Promise<SentinelDirective[]> {
    try {
        console.log("Sentinel Action: Fetching Global Intelligence...");
        // 1. Fetch Global Collective Data (Network-wide threats)
        const globalStats = await getGlobalSurveillanceData();

        // 2. Fetch Medication Adherence Data (if user ID provided)
        let medicationData: any[] = [];
        if (userId) {
            const { data } = await supabaseAdmin
                .from('medication_courses')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['active', 'abandoned']);

            medicationData = data || [];
            console.log(`Sentinel Action: Monitoring ${medicationData.length} medication courses.`);
        }

        console.log(`Sentinel Action: Analyst capabilities active. Processing ${scanList.length} personal scans against ${globalStats.length} regional clusters.`);

        // 3. Pass Personal, Global, and Adherence data to the Agent
        const directives = await sentinelAgentService.analyzeSurveillanceLogs(scanList, globalStats, medicationData);
        return directives;
    } catch (error) {
        console.error("Sentinel Action Failed:", error);
        // Fallback for silence on error
        return [];
    }
}
