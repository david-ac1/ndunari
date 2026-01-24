'use server';

import { sentinelAgentService, type SentinelDirective } from "@/lib/gemini/sentinel-agent.service";

/**
 * Server Action to analyze surveillance logs using Gemini.
 * This runs securely on the server, protecting the API Key.
 */
export async function analyzeSurveillanceLogsAction(scanList: any[]): Promise<SentinelDirective[]> {
    try {
        console.log("Sentinel Action: Starting analysis on server (secure)...");
        // The service itself will naturally pick up process.env.GEMINI_API_KEY on the server
        const directives = await sentinelAgentService.analyzeSurveillanceLogs(scanList);
        return directives;
    } catch (error) {
        console.error("Sentinel Action Failed:", error);
        // Fallback for silence on error
        return [];
    }
}
