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
 * Forensic Cluster Schema
 * Represents a group of related suspicious scans
 */
export const ForensicClusterSchema = z.object({
    id: z.string(),
    title: z.string(),
    threatLevel: z.enum(["low", "medium", "high", "critical"]),
    evidenceSignature: z.string(), // Description of the shared anomaly
    affectedBrands: z.array(z.string()),
    geoConcentration: z.string(),
    scanCount: z.number(),
    reasoning: z.string(),
});

export type ForensicCluster = z.infer<typeof ForensicClusterSchema>;

/**
 * Risk Mask Schema (Geo-fenced threat layer)
 */
export const RiskMaskSchema = z.object({
    id: z.string(),
    region: z.string(),
    center: z.object({ lat: z.number(), lng: z.number() }),
    radius: z.number(), // in km
    intensity: z.number().min(0).max(1), // 0 to 1
    detectedThreat: z.string(),
});

export type RiskMask = z.infer<typeof RiskMaskSchema>;

/**
 * Recall Notice Schema
 */
export const RecallNoticeSchema = z.object({
    id: z.string(),
    drugName: z.string(),
    batchNumber: z.string(),
    reason: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]),
    scope: z.string(), // "Regional" or "National"
    publishedAt: z.string(),
});

export type RecallNotice = z.infer<typeof RecallNoticeSchema>;

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
     * Generate risk masks for the national map
     */
    async generateRiskMasks(scanLogs: any[]): Promise<RiskMask[]> {
        const logContext = JSON.stringify(scanLogs.slice(0, 50));
        const prompt = `You are a Geo-Spatial Epidemiologist. Analyze these drug scan results and identify regional hotspots for counterfeit activity.
        
        DATA: ${logContext}
        
        TASK:
        Generate 2-3 "Risk Masks" (circular threat areas) for Nigeria.
        For each mask, provide center coordinates (approximate for Nigeria states) and radius.
        
        NIGERIA COORD HINTS:
        - Lagos: {lat: 6.5244, lng: 3.3792}
        - Abuja: {lat: 9.0765, lng: 7.3986}
        - Kano: {lat: 12.0022, lng: 8.5920}
        - Port Harcourt: {lat: 4.8156, lng: 7.0498}
        
        RESPONSE FORMAT (JSON Array):
        [{
          "id": "MASK-001",
          "region": "State Name",
          "center": {"lat": number, "lng": number},
          "radius": number (km),
          "intensity": 0.0-1.0,
          "detectedThreat": "Brief description of the threat at this cluster"
        }]`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonText = text.match(/\[[\s\S]*\]/)?.[0] || "[]";
            return JSON.parse(jsonText);
        } catch (error) {
            console.error("Sentinel Risk Mask failure:", error);
            return [];
        }
    }

    /**
     * Generate official AI-drafted recall notices
     */
    async generateRecallNotices(scanLogs: any[]): Promise<RecallNotice[]> {
        const suspiciousLogs = scanLogs.filter(s => s.risk_level === 'counterfeit' || s.risk_level === 'suspicious');
        if (suspiciousLogs.length === 0) return [];

        const logContext = JSON.stringify(suspiciousLogs.slice(0, 30));
        const prompt = `You are the NAFDAC Autonomous Recall Orchestrator.
        
        EVIDENCE LOGS: ${logContext}
        
        TASK:
        Draft formal Pharmaceutical Recall Notices for drugs with high-confidence counterfeit signatures.
        
        RESPONSE FORMAT (JSON Array):
        [{
          "id": "RECALL-2024-NNN",
          "drugName": "Exact Drug Name",
          "batchNumber": "Batch/Lot",
          "reason": "Detailed forensic reason for recall",
          "severity": "low" | "medium" | "high" | "critical",
          "scope": "Regional" | "National",
          "publishedAt": "ISO Date"
        }]`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonText = text.match(/\[[\s\S]*\]/)?.[0] || "[]";
            return JSON.parse(jsonText);
        } catch (error) {
            console.error("Sentinel Recall Notice failure:", error);
            return [];
        }
    }

    /**
     * Generate real-time "Guardian Guidance" for the camera view
     * This uses multimodal vision to "see" the live frame
     */
    async generateLiveGuidance(base64Image: string): Promise<string> {
        const prompt = `You are a Forensic Director guiding a field worker through a drug scan. 
        Look at this camera frame and provide ONE short, proactive instruction (max 10 words) to help them get a perfect scan.
        
        Focus on:
        - Positioning (closer/further)
        - Alignment (center the package)
        - Lighting (glare/shadows)
        - Forensic features (hologram, expiry, batch code)
        
        Example: "Hold steady, scanning NAFDAC hologram now..."
        Example: "Tilt slightly left to capture the expiry date."
        Example: "Move closer to focus on the batch code."`;

        try {
            // Remove header if present
            const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: cleanBase64,
                        mimeType: "image/jpeg"
                    }
                }
            ]);
            return result.response.text();
        } catch (error) {
            console.error("Live Guidance failed:", error);
            return "Positioning package...";
        }
    }

    /**
     * Detect systematic forensic clusters across multiple scans
     */
    async detectForensicClusters(scanLogs: any[]): Promise<ForensicCluster[]> {
        const prompt = `You are a Global Forensic Lead. Review these national scan logs and identify "Forensic Clusters"—groups of independent scans that share the SAME anomaly or manufacturing defect (e.g., identical label typos, hologram shifts, or batch patterns).
        
        DATA: ${JSON.stringify(scanLogs.slice(0, 50))} 
        
        Based on the data, return a JSON array of clusters:
        [
          {
            "id": "cluster-<unique>",
            "title": "<short descriptive title>",
            "threatLevel": "low" | "medium" | "high" | "critical",
            "evidenceSignature": "<detailed shared anomaly, e.g. 'Kerning error in Amoxicillin label v2.1'>",
            "affectedBrands": ["<brand1>", "<brand2>"],
            "geoConcentration": "<region names>",
            "scanCount": <number of related scans>,
            "reasoning": "<why these scans are linked>"
          }
        ]
        
        If no clear clusters exist, return an empty array. Focus on pattern matching across DIFFERENT user accounts.`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (error) {
            console.error("Cluster detection failed:", error);
            return [];
        }
    }
}

export const sentinelAgentService = new SentinelAgentService();
