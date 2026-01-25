'use server';

import { sentinelAgentService, type SentinelDirective } from "@/lib/gemini/sentinel-agent.service";
import { getGlobalSurveillanceData } from "@/lib/services/scan-storage.service";

/**
 * Server Action to analyze surveillance logs using Gemini.
 * This runs securely on the server, protecting the API Key.
 * Now enhanced with Global Collective Intelligence.
 */
export async function analyzeSurveillanceLogsAction(scanList: any[]): Promise<SentinelDirective[]> {
    try {
        console.log("Sentinel Action: Fetching Global Intelligence...");
        // 1. Fetch Global Collective Data (Network-wide threats)
        // Note: In a real deploy, this might be cached or fetched from a dedicated analytics service
        const globalStats = await getGlobalSurveillanceData();

        console.log(`Sentinel Action: Analyst capabilities active. Processing ${scanList.length} personal scans against ${globalStats.length} regional clusters.`);

        // 2. Pass both Personal and Global data to the Agent
        const directives = await sentinelAgentService.analyzeSurveillanceLogs(scanList, globalStats);
        return directives;
    } catch (error) {
        console.error("Sentinel Action Failed:", error);
        // Fallback for silence on error
        return [];
    }
}
