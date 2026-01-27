import { getStewardshipBrainModel, retryWithBackoff } from "./config";
import { z } from "zod";

/**
 * Sentinel Directive Schema
 * Represents an autonomous action planned by the agent
 */
export const SentinelDirectiveSchema = z.object({
    id: z.string().optional(),
    type: z.enum(["IMMEDIATE_WARNING", "SURVEILLANCE_UPDATE", "STEWARDSHIP_ACTION", "REGIONAL_ALERT", "SUPPLY_CHAIN_AUDIT"]),
    region: z.string().optional(),
    confidence: z.number().min(0).max(100).optional(),
    source: z.enum(["PERSONAL", "GLOBAL", "SYSTEM"]).optional(),
    rationale: z.string(),
    evidence: z.array(z.string()).optional(),
    proposedAction: z.string(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    timestamp: z.string().optional(),
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
 * Unified National Intelligence Schema
 */
export const UnifiedIntelligenceSchema = z.object({
    riskMasks: z.array(RiskMaskSchema),
    recallNotices: z.array(RecallNoticeSchema),
    forensicClusters: z.array(ForensicClusterSchema),
    strategicDirectives: z.array(SentinelDirectiveSchema)
});

export type UnifiedIntelligence = z.infer<typeof UnifiedIntelligenceSchema>;

/**
 * Sentinel Agent Service
 * The "Orchestrator" that plans and executes surveillance tasks
 */
export class SentinelAgentService {
    private _model: ReturnType<typeof getStewardshipBrainModel> | null = null;

    private get model() {
        if (!this._model) {
            this._model = getStewardshipBrainModel(true); // Always use JSON mode for Sentinel Agent
        }
        return this._model;
    }

    /**
     * Helper to clean and parse JSON from Gemini
     */
    private safeParseJson(text: string, fallback: any = []) {
        try {
            // Native JSON mode usually returns clean JSON, but we'll trim just in case
            const cleanText = text.trim();
            return JSON.parse(cleanText);
        } catch (error) {
            // Fallback to regex if for some reason it's not pure JSON
            const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error("Critical JSON parse failure:", e);
                }
            }
            return fallback;
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
            const json = this.safeParseJson(text, []);
            return z.array(RiskMaskSchema).parse(json);
        } catch (error) {
            console.error("Sentinel Recall Notice failure:", error);
            return [];
        }
    }

    /**
     * Analyze surveillance logs and global data to generate actionable stewardship directives.
     * Uses Gemini 1.5 Pro (Thinking Model) concept for deep pattern correlation.
     * NOW ENHANCED: Monitors medication adherence to detect AMR risk behaviors.
     */
    async analyzeSurveillanceLogs(scanHistory: any[], globalStats: any[] = [], medicationData: any[] = []): Promise<SentinelDirective[]> {
        try {
            const model = this.model;

            // Format medication data for the prompt
            const activeCourses = medicationData.filter(m => m.status === 'active');
            const abandonedCourses = medicationData.filter(m => m.status === 'abandoned');

            // Detect overdue doses
            const now = new Date();
            const overdueCourses = activeCourses.filter(m => {
                if (m.next_dose_due) {
                    const due = new Date(m.next_dose_due);
                    const hoursDiff = (now.getTime() - due.getTime()) / (1000 * 60 * 60);
                    return hoursDiff > 48; // More than 48h overdue
                }
                return false;
            });

            const medicationContext = medicationData.length > 0 ? `
            **MEDICATION ADHERENCE DATA:**
            - Active Courses: ${activeCourses.map(m => `${m.drug_name} (${m.category}): ${m.doses_taken}/${m.total_doses} doses`).join(', ') || 'None'}
            - Abandoned Courses: ${abandonedCourses.map(m => `${m.drug_name} (${m.category}): Stopped at ${Math.round((m.doses_taken / m.total_doses) * 100)}%`).join(', ') || 'None'}
            - Severely Overdue: ${overdueCourses.map(m => `${m.drug_name}: ${Math.floor((now.getTime() - new Date(m.next_dose_due!).getTime()) / (1000 * 60 * 60))}h late`).join(', ') || 'None'}
            
            ADHERENCE DIRECTIVE RULES:
            - If there are Abandoned Courses (especially Antibiotics/Antimalarials): Issue a **STEWARDSHIP_ACTION** directive explaining the AMR risk.
            - If there are Severely Overdue doses: Issue an **IMMEDIATE_WARNING** about therapeutic failure.
            ` : '';

            const prompt = `
            You are the Ndunari Sentinel, an autonomous AI steward for medication safety in Nigeria.
            
            OBJECTIVE:
            Analyze the provided surveillance logs to identify active threats and generate strategic stewardship directives.
            You possess "collective intelligence" - you must correlate the User's Personal History with Global Regional Trends AND Medication Adherence Behavior.

            INPUTS:
            1. PERSONAL_LOGS: The user's recent scan history.
            2. GLOBAL_INTELLIGENCE: Aggregated threat levels by region (De-identified).
            3. MEDICATION_ADHERENCE: Active and abandoned medication courses.

            ANALYSIS LOGIC:
            - **Personal Anomalies**: If the user scans a high-risk drug repeatedly, warn them directly.
            - **Global Covariance**: If the user is in a region (e.g., "Lagos") where GLOBAL_INTELLIGENCE shows a surge in counterfeits, but the user has only scanned "Safe" items so far, PRE-EMPTIVELY warn them.
            - **Stewardship**: Recommend actions that help the collective (e.g., "Report this batch to NAFDAC").
            - **NON-ADHERENCE DETECTION**: If the user abandoned an antibiotic course early, this creates AMR risk. Issue a CRITICAL directive.

            DATA:
            PERSONAL_LOGS: ${JSON.stringify(scanHistory)}
            GLOBAL_INTELLIGENCE: ${JSON.stringify(globalStats)}
            ${medicationContext}

            OUTPUT FORMAT:
            Return a JSON array of "Directives". Each directive must have:
            - type: "IMMEDIATE_WARNING" | "SURVEILLANCE_UPDATE" | "STEWARDSHIP_ACTION" | "REGIONAL_ALERT"
            - priority: "critical" | "high" | "medium" | "low"
            - source: "PERSONAL" (from user's own scans/behavior) or "GLOBAL" (from collective intelligence) or "SYSTEM" (from internal system logic)
            - rationale: "Why is this directive issued? Be specific about the threat correlation."
            - proposedAction: "What should the user do?"

            Example:
            [
              {
                "type": "STEWARDSHIP_ACTION",
                "priority": "critical",
                "source": "PERSONAL",
                "rationale": "You abandoned your Amoxicillin course at 30% completion. Incomplete antibiotic treatment creates resistant bacteria that can spread to your community.",
                "proposedAction": "Resume your Amoxicillin course immediately or consult a doctor for an alternative. Never stop antibiotics early."
              }
            ]

            Generate 2-4 high-value directives based on the data. If no threats, return a "SURVEILLANCE_UPDATE" confirming nominal status.
            `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Clean markdown wrapping if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const rawDirectives = z.array(SentinelDirectiveSchema).parse(JSON.parse(cleanText));

            // Post-hydrate directives with missing system fields
            return rawDirectives.map(d => ({
                ...d,
                id: d.id || Math.random().toString(36).substring(7),
                timestamp: d.timestamp || new Date().toISOString()
            })) as SentinelDirective[];

        } catch (error) {
            console.error("Sentinel Analysis Error:", error);
            // Fallback safe directive
            return [{
                id: 'sys-err',
                type: 'SURVEILLANCE_UPDATE' as const,
                priority: 'low' as const,
                source: 'SYSTEM' as const,
                region: 'System',
                confidence: 0,
                evidence: [],
                timestamp: new Date().toISOString(),
                rationale: 'Sentinel update services temporarily unavailable.',
                proposedAction: 'Continue manual verification.'
            }];
        }
    }

    /**
     * Generate real-time "Guardian Guidance" for the camera view
     * This uses multimodal vision to "see" the live frame
     */
    async generateLiveGuidance(base64Image: string): Promise<string> {
        // Safeguard: Do not attempt vision analysis if no image is provided
        if (!base64Image || base64Image.length < 100) {
            console.log("Sentinel Agent: Null or invalid vision signal. Skipping guidance.");
            return "Positioning package...";
        }

        const prompt = `You are a Senior Forensic Director at NAFDAC. 
        Analyze this LIVE camera frame and provide ONE sharp, tactical, proactive instruction (strictly max 12 words).
        
        Focus on these CRITICAL bottlenecks:
        - HOLOGRAM: If blurry or has glare, tell them to tilt for diffraction check.
        - PRINT: If too far, tell them to move closer for microscopic kerning analysis.
        - ALIGNMENT: If drug name or batch code is clipped, tell them to center vertically.
        - STABILITY: If motion blur detected, tell them to hold for forensic lock.
        
        TONE: Urgent, authoritative, technical (Action Era). No conversational filler.
        
        Example: "Tilt 15 degrees left to capture NAFDAC hologram diffraction."
        Example: "Move 3cm closer. Micro-print analysis requires higher resolution."
        Example: "Center batch code vertically for forensic OCR validation."`;

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
     * Unified Intelligence Marathon
     * Performs a single, deep reasoning pass over national telemetry to generate all directives, masks, and clusters.
     * This is significantly faster and more coherent than separate calls.
     */
    async getUnifiedIntelligence(scanLogs: any[]): Promise<UnifiedIntelligence> {
        const dataContext = JSON.stringify(scanLogs.slice(0, 60));
        const prompt = `You are THE SENTINEL, the autonomous national health orchestrator for Nigeria.
        
        INPUT TELEMETRY:
        ${dataContext}
        
        TASK:
        Perform a UNIFIED FORENSIC AUDIT. Connect the dots across every scan to identify manufacturing defects, regional outbreaks, and supply chain fractures.
        
        OUTPUT SCHEMA (JSON):
        {
            "riskMasks": [{ "id": "M1", "region": "...", "center": {"lat": 9.0, "lng": 7.0}, "radius": 50, "intensity": 0.8, "detectedThreat": "..." }],
            "recallNotices": [{ "id": "R1", "drugName": "...", "batchNumber": "...", "reason": "...", "severity": "high", "scope": "National", "publishedAt": "..." }],
            "forensicClusters": [{ "id": "C1", "title": "...", "threatLevel": "high", "evidenceSignature": "...", "affectedBrands": [], "geoConcentration": "...", "scanCount": 5, "reasoning": "..." }],
            "strategicDirectives": [{ "id": "D1", "type": "REGIONAL_ALERT", "region": "...", "confidence": 95, "rationale": "...", "evidence": [], "proposedAction": "...", "priority": "high", "timestamp": "..." }]
        }
        
        RULES:
        - Logic coherence: Ensure your risk masks align with your forensic clusters.
        - Precision: Only flag clusters where valid manufacture-level patterns exist.
        - Response: Return ONLY valid JSON matching the schema above.`;

        try {
            const result = await retryWithBackoff(() => this.model.generateContent(prompt));
            const response = await result.response;
            const text = response.text();
            const json = this.safeParseJson(text, { riskMasks: [], recallNotices: [], forensicClusters: [], strategicDirectives: [] });
            return UnifiedIntelligenceSchema.parse(json);
        } catch (error) {
            console.error("Unified Sentinel Intelligence failed:", error);
            return { riskMasks: [], recallNotices: [], forensicClusters: [], strategicDirectives: [] };
        }
    }
}

export const sentinelAgentService = new SentinelAgentService();
