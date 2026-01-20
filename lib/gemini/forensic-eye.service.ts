import { getForensicEyeModel, MOCK_MODE, retryWithBackoff } from "./config";
import { z } from "zod";
import { ForensicLogger } from "../utils/forensic-logger";
import { rateLimitManager } from "@/lib/utils/rate-limit-manager";

/**
 * Forensic Evidence Bounding Box
 */
export const EvidenceBoxSchema = z.object({
    box_2d: z.array(z.number()), // [ymin, xmin, ymax, xmax]
    label: z.string(),
});

export type EvidenceBox = z.infer<typeof EvidenceBoxSchema>;

/**
 * Forensic Analysis Result Schema
 */
export const ForensicAnalysisSchema = z.object({
    authenticityScore: z.number().min(0).max(100),
    drugName: z.string(),
    nafdacNumber: z.string().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    findings: z.array(z.string()),
    riskLevel: z.enum(["safe", "suspicious", "counterfeit"]),
    thoughtProcess: z.array(z.string()),
    packageFingerprint: z.string(), // Deterministic hash of identity features
    evidenceBoxes: z.array(EvidenceBoxSchema).optional(),
});

export type ForensicAnalysis = z.infer<typeof ForensicAnalysisSchema>;

/**
 * Forensic Eye Service
 * Uses Gemini 3 Pro Preview with high-resolution image processing
 * NO image compression - full resolution for microscopic detail detection
 */
export class ForensicEyeService {
    private _model: ReturnType<typeof getForensicEyeModel> | null = null;

    private get model() {
        // Dynamic getter ensures we always use the latest config model ID
        // useJsonMode=true to enforce JSON responses
        return getForensicEyeModel(true);
    }

    /**
     * Hyper-resilient JSON extraction
     */
    private safeParseJson(text: string, fallback: any = null) {
        try {
            if (!text) return fallback;
            // Aggressive cleansing of control characters and trailing noise
            let cleanText = text.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

            // Stage 1: Direct Parse
            try { return JSON.parse(cleanText); } catch (e) { }

            // Stage 2: Markdown Cleansing
            let jsonPart = cleanText
                .replace(/^```json\s*/g, '')
                .replace(/```\s*$/g, '')
                .replace(/^```\s*/g, '')
                .trim();

            try { return JSON.parse(jsonPart); } catch (e) { }

            // Stage 3: Deep Match Heuristics
            // Find the outermost { } or [ ]
            const firstBrace = jsonPart.indexOf('{');
            const lastBrace = jsonPart.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const innerJson = jsonPart.substring(firstBrace, lastBrace + 1);
                try { return JSON.parse(innerJson); } catch (e) { }
            }

            // Stage 4: Regex Extraction
            const match = jsonPart.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                try { return JSON.parse(match[0]); } catch (e) { }
            }

            console.error("Hyper-Resilient JSON extraction failed. Raw sample:", text.substring(0, 1000));
            return fallback;
        } catch (error) {
            console.error("Forensic JSON extraction error:", error);
            return fallback;
        }
    }

    /**
     * Scan drug package for authenticity
     * @param imageData - Base64 encoded image or Buffer
     * @param mimeType - The mime type of the image
     * @returns Forensic analysis with authenticity score
     */
    async scanPackage(imageData: string | Buffer, mimeType: string = "image/jpeg"): Promise<ForensicAnalysis> {
        const startTime = Date.now();

        // Mock mode for development/testing
        if (MOCK_MODE) {
            console.log("[MOCK MODE] Simulating forensic scan...");
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate processing
            return {
                authenticityScore: 87.5,
                drugName: "Ciprofloxacin 500mg",
                nafdacNumber: "NAF-2019-45678",
                batchNumber: "LOT-2024-001",
                expiryDate: "12/2025",
                findings: [
                    "Hologram placement 2mm off-center (suspicious)",
                    "Font kerning inconsistent with authentic batches",
                    "NAFDAC number format valid BUT print quality degraded",
                    "Package seal shows signs of tampering",
                ],
                riskLevel: "safe",
                packageFingerprint: "CIPRO500-NAF201945678-LOT2024001-122025",
                thoughtProcess: [
                    "Analyzing hologram structure...",
                    "Checking NAFDAC number format...",
                    "Evaluating print quality...",
                    "Detecting security feature anomalies",
                ],
                evidenceBoxes: [
                    { box_2d: [450, 200, 550, 400], label: "Misaligned Hologram" },
                    { box_2d: [100, 100, 200, 300], label: "Degraded Printing" }
                ]
            };
        }

        try {
            // Convert image data if needed
            const imageBase64 =
                typeof imageData === "string"
                    ? imageData.replace(/^data:image\/\w+;base64,/, "")
                    : imageData.toString("base64");

            // Direct forensic scan - NO pre-validation to avoid false negatives
            const prompt = `Perform a high-resolution forensic analysis of this drug package image.
        
Analyze the packaging for authenticity and return a structured DNA report.

STRUCTURE:
{
  "authenticityScore": 0-100,
  "drugName": "Exact name and dosage",
  "nafdacNumber": "NAF-YYYY-NNNNN or [A-Z]-[NNNN]",
  "batchNumber": "Batch/Lot code",
  "expiryDate": "Expiry info",
  "findings": ["3-5 specific observations"],
  "riskLevel": "safe" | "suspicious" | "counterfeit",
  "thoughtProcess": ["3 steps of reasoning"],
  "packageFingerprint": "[NAME]-[NAFDAC]-[BATCH]-[EXPIRY]",
  "evidenceBoxes": [
    { "box_2d": [ymin, xmin, ymax, xmax], "label": "Feature Name" }
  ]
}

CRITICAL INSTRUCTIONS FOR OBJECT DETECTION:
1. Provide [ymin, xmin, ymax, xmax] normalized to 0-1000 for key features.
2. Focus on: Holograms, NAFDAC numbers, Batch/Lot codes, and Printing quality.

CRITICAL INSTRUCTIONS FOR NAFDAC NUMBER:
1. NAFDAC numbers have two formats:
   A) NEW: NAF-YYYY-NNNNN (e.g. NAF-2023-12345)
   B) OLD: [LETTER][NUMBER]-[NUMBER] (e.g. B4-6269)
2. If unreadable, use "NOT_FOUND". If missing (imported), use "NOT_APPLICABLE".
3. Precision is paramount. Do not hallucinate regulatory codes.

ANALYSIS GUIDELINES:
- authenticityScore: Based on printing precision, hologram presence, and mark accuracy.
- riskLevel: safe (85+), suspicious (60-84), counterfeit (<60).
- packageFingerprint: De-spaced string for unique identification. Use 'X' for missing fields.`;

            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            };

            // === WRAP IN RATE LIMIT QUEUE ===
            const result = await rateLimitManager.enqueue(
                () => retryWithBackoff(
                    () => this.model.generateContent([prompt, imagePart]),
                    3,
                    2000
                ),
                'high' // Forensic scans are high priority
            );
            const response = await result.response;
            const text = response.text() || "";

            // === COMPREHENSIVE FORENSIC DIAGNOSTICS ===
            const diagnostics = {
                timestamp: new Date().toISOString(),
                imageSize: imageBase64.length,
                mimeType: mimeType,
                promptLength: prompt.length,
                responseTextLength: text.length,
                responseTextPreview: text.substring(0, 500),
                finishReason: response.candidates?.[0]?.finishReason,
                safetyRatings: response.candidates?.[0]?.safetyRatings,
                promptFeedback: response.promptFeedback,
                duration: Date.now() - startTime
            };

            console.log("=== GEMINI 3 FORENSIC DIAGNOSTICS ===");
            console.log("Timestamp:", diagnostics.timestamp);
            console.log("Image Size (base64):", diagnostics.imageSize, "chars");
            console.log("MIME Type:", diagnostics.mimeType);
            console.log("Prompt Length:", diagnostics.promptLength, "chars");
            console.log("Response Text Length:", diagnostics.responseTextLength, "chars");
            console.log("Response Preview:", diagnostics.responseTextPreview);
            console.log("Finish Reason:", diagnostics.finishReason);
            console.log("Safety Ratings:", JSON.stringify(diagnostics.safetyRatings, null, 2));
            console.log("Prompt Feedback:", JSON.stringify(diagnostics.promptFeedback, null, 2));
            console.log("Duration:", diagnostics.duration, "ms");
            console.log("=====================================");

            // Log to file
            ForensicLogger.log(diagnostics);

            // extraction
            if (!text || text.trim().length < 10) {
                const reason = response.candidates?.[0]?.finishReason;
                console.error("❌ EMPTY RESPONSE DETECTED");
                console.error("Finish Reason:", reason);
                console.error("Full Response Object:", JSON.stringify(response, null, 2));

                ForensicLogger.log({
                    ...diagnostics,
                    error: `Empty response. Finish Reason: ${reason}`
                });

                if (reason === 'SAFETY') {
                    throw new Error("National Security Protocol: Forensic analysis interrupted due to image content safety triggers.");
                }

                if (reason === 'RECITATION') {
                    throw new Error("Forensic Halt: Content flagged as copyrighted material. Please ensure you are scanning an authentic medicine package.");
                }

                throw new Error("Unable to analyze image. Sentinel intelligence returned an empty response. Please try with a clearer photo or different lighting.");
            }

            // Check for common error strings that aren't JSON
            if (text.includes("safety filters") || text.includes("blocked") || text.includes("cannot fulfill")) {
                console.error("Gemini response blocked by safety filters:", text);
                ForensicLogger.log({
                    ...diagnostics,
                    error: "Safety filter block detected"
                });
                throw new Error("National Security Protocol: Forensic analysis interrupted due to image content safety triggers.");
            }

            const analysis = this.safeParseJson(text);
            if (!analysis || typeof analysis !== 'object') {
                console.error("Failed to extract valid JSON object from response:", text);
                const sample = text.substring(0, 100).replace(/\n/g, ' ');
                throw new Error(`Forensic Halt: DNA report data was malformed. Diagnostic Payload: [${sample}...]`);
            }

            // --- SENTINEL DATA NORMALIZATION LAYER ---
            // 1. Target Detection Check (AI might return nulls if it's not a drug)
            const drugNameStr = String(analysis.drugName || '').toLowerCase();
            const riskLevelStr = String(analysis.riskLevel || '').toLowerCase();
            const isInvalidTarget = (analysis.drugName === null || !analysis.drugName || drugNameStr.includes("not a drug") || drugNameStr.includes("interface")) &&
                (analysis.authenticityScore === null || analysis.authenticityScore < 10 || riskLevelStr.includes("unknown"));

            if (isInvalidTarget) {
                const reasoning = typeof analysis.riskLevel === 'string' ? analysis.riskLevel : "No valid medicinal specimen detected in frame.";
                console.warn("Invalid forensic target detected:", reasoning);
                throw new Error(`Forensic Halt: ${reasoning} Please scan physical drug packaging.`);
            }

            // 2. Score Normalization
            if (typeof analysis.authenticityScore === 'string') {
                const parsed = parseFloat(analysis.authenticityScore.replace(/[^0-9.]/g, ''));
                analysis.authenticityScore = isNaN(parsed) ? 50 : parsed;
            } else if (analysis.authenticityScore === null || typeof analysis.authenticityScore === 'undefined') {
                analysis.authenticityScore = 0;
            }

            // 3. Risk Level Normalization
            if (typeof analysis.riskLevel === 'string') {
                analysis.riskLevel = analysis.riskLevel.toLowerCase().trim();
                if (analysis.riskLevel.includes("safe")) analysis.riskLevel = "safe";
                else if (analysis.riskLevel.includes("suspicious")) analysis.riskLevel = "suspicious";
                else if (analysis.riskLevel.includes("counterfeit")) analysis.riskLevel = "counterfeit";

                if (!["safe", "suspicious", "counterfeit"].includes(analysis.riskLevel)) {
                    analysis.riskLevel = analysis.authenticityScore >= 85 ? "safe" : (analysis.authenticityScore < 60 ? "counterfeit" : "suspicious");
                }
            } else {
                analysis.riskLevel = "suspicious";
            }

            // 4. Critical Field Integrity
            if (!analysis.drugName) analysis.drugName = "Unknown Specimen";
            if (!Array.isArray(analysis.findings)) analysis.findings = [String(analysis.findings || "Analyzing image patterns...")];
            if (!Array.isArray(analysis.thoughtProcess)) analysis.thoughtProcess = [String(analysis.thoughtProcess || "Initiating forensic audit...")];

            if (!analysis.packageFingerprint) {
                analysis.packageFingerprint = `${analysis.drugName}-${analysis.nafdacNumber || 'X'}-${Date.now()}`;
            }

            // Validate NAFDAC number format if present
            if (analysis.nafdacNumber &&
                analysis.nafdacNumber !== 'NOT_FOUND' &&
                analysis.nafdacNumber !== 'NOT_APPLICABLE') {
                const newFormat = /^NAF-\d{4}-\d{5}$/;
                const oldFormat = /^[A-Z]{1,2}\d{0,2}-\d{4,5}$/;

                if (!newFormat.test(analysis.nafdacNumber) && !oldFormat.test(analysis.nafdacNumber)) {
                    console.warn(`Invalid NAFDAC format detected: ${analysis.nafdacNumber}`);
                    analysis.findings.unshift(`⚠️ NAFDAC format unclear: "${analysis.nafdacNumber}"`);
                }
            }

            // Final schema enforcement
            const validated = ForensicAnalysisSchema.parse(analysis);

            const duration = Date.now() - startTime;
            console.log(`Forensic scan completed in ${duration}ms`);

            return validated;
        } catch (error) {
            console.error("Forensic Eye scan failed - Full error:", error);

            // Provide user-friendly error messages
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);

                if (error.message.includes("quota") || error.message.includes("429")) {
                    throw new Error(
                        "API rate limit reached. Please wait 15 seconds and try again, or enable MOCK_MODE for testing."
                    );
                }
                if (error.message.includes("Unable to analyze")) {
                    throw error; // Already user-friendly
                }

                // If it's a Zod validation error, show details
                if (error.name === "ZodError") {
                    console.error("Zod validation failed:", JSON.stringify(error, null, 2));
                    throw new Error("Analysis format invalid. Gemini response didn't match expected format.");
                }

                // Pass through the actual error for debugging
                throw new Error(`Scan failed: ${error.message}`);
            }

            throw new Error("Scan failed. Unknown error occurred.");
        }
    }

    /**
     * Validate NAFDAC registration number format
     * Pattern: NAF-YYYY-NNNNN
     */
    validateNAFDACNumber(nafdacNumber: string): boolean {
        const pattern = /^NAF-\d{4}-\d{5}$/;
        return pattern.test(nafdacNumber);
    }

    /**
     * Extract text from drug package using OCR
     * Useful for batch numbers and expiry dates
     */
    async extractText(imageData: string | Buffer): Promise<string[]> {
        const imageBase64 =
            typeof imageData === "string"
                ? imageData.replace(/^data:image\/\w+;base64,/, "")
                : imageData.toString("base64");

        const prompt =
            "Extract all visible text from this image. Return as a JSON array of strings.";

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg",
            },
        };

        const result = await this.model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return [];
        }

        return JSON.parse(jsonMatch[0]);
    }
}

// Export singleton instance
export const forensicEyeService = new ForensicEyeService();
