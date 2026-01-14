import { getStewardshipBrainModel, retryWithBackoff } from "./config";
import { z } from "zod";

/**
 * Sentinel Directive Schema
 * Represents an autonomous action planned by the agent
 */
export const SentinelDirectiveSchema = z.object({
    id: z.string(),
    type: z.enum(["REGIONAL_ALERT", "SUPPLY_CHAIN_AUDIT", "COMMUNITY_NOTIFICATION", "REGULATORY_ESCALATION"]),
    region: z.string(),
    confidence: z.number().min(0).max(100),
    rationale: z.string(),
    evidence: z.array(z.string()),
    proposedAction: z.string(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    timestamp: z.string(),
});

export type SentinelDirective = z.infer<typeof SentinelDirectiveSchema>;

/**
 * Sentinel Agent Service
 * The "Orchestrator" that plans and executes surveillance tasks
 */
export class SentinelAgentService {
    private _model: ReturnType<typeof getStewardshipBrainModel> | null = null;

    private get model() {
        if (!this._model) {
            this._model = getStewardshipBrainModel();
        }
        return this._model;
    }

    /**
     * Analyze recent scan logs to identify patterns
     * This is an "Action Era" marathon task
     */
    async analyzeSurveillanceLogs(scanLogs: any[]): Promise<SentinelDirective[]> {
        const logContext = JSON.stringify(scanLogs.slice(0, 50)); // Analyze last 50

        const prompt = `You are THE SENTINEL, an autonomous public health orchestrator for Nigeria's pharmaceutical supply chain.
        
        CURRENT SURVEILLANCE DATA:
        ${logContext}
        
        TASK:
        Act as a Marathon Agent. Analyze these scan results for supply chain fractures, counterfeit clusters, or AMR (Anti-Microbial Resistance) risks.
        
        CRITICAL REASONING STEPS:
        1. Identify regional clusters of 'counterfeit' or 'suspicious' results.
        2. Detect batch number anomalies (e.g., the same batch appearing in distant regions simultaneously).
        3. Flag "Watch" or "Reserve" antibiotics being used for minor indications.
        4. Plan autonomous interventions based on findings.
        
        RESPONSE FORMAT (JSON Array of Directives):
        [{
          "id": "DIR-YYYY-NNNN",
          "type": "REGIONAL_ALERT" | "SUPPLY_CHAIN_AUDIT" | "COMMUNITY_NOTIFICATION" | "REGULATORY_ESCALATION",
          "region": "State Name",
          "confidence": 0-100,
          "rationale": "Why this directive is needed",
          "evidence": ["Evidence 1", "Evidence 2"],
          "proposedAction": "Next autonomous step to execute",
          "priority": "low" | "medium" | "high" | "critical",
          "timestamp": "ISO Date"
        }]
        
        Respond ONLY with a valid JSON array.`;

        try {
            const result = await retryWithBackoff(() => this.model.generateContent(prompt));
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("Sentinel failed to generate directives");

            const directives = JSON.parse(jsonMatch[0]);
            return z.array(SentinelDirectiveSchema).parse(directives);
        } catch (error) {
            console.error("Sentinel Analysis failed:", error);
            return []; // Fail gracefully in background
        }
    }

    /**
     * Generate real-time "Guardian Guidance" for the camera view
     */
    async generateLiveGuidance(currentFrameContext: string): Promise<string> {
        const prompt = `You are a Forensic Director guiding a field worker through a drug scan.
        CONTEXT: ${currentFrameContext}
        Provide ONE short, proactive instruction (max 10 words).
        Example: "Hold steady, scanning NAFDAC hologram now..."
        Example: "Tilt slightly left to capture expiry date."`;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch {
            return "Scanning package details...";
        }
    }
}

export const sentinelAgentService = new SentinelAgentService();
