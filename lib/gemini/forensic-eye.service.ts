import { getForensicEyeModel, MOCK_MODE, retryWithBackoff } from "./config";
import { z } from "zod";

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
        if (!this._model) {
            this._model = getForensicEyeModel(true); // Always use JSON mode
        }
        return this._model;
    }

    /**
     * Helper to clean and parse JSON from Gemini
     */
    private safeParseJson(text: string, fallback: any = null) {
        try {
            const cleanText = text.trim();
            // Remove markdown code blocks
            const jsonPart = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const match = jsonPart.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                return JSON.parse(match[0]);
            }
            return JSON.parse(jsonPart);
        } catch (error) {
            console.error("Forensic JSON parsing failed:", error, "Raw text:", text);
            return fallback;
        }
    }

    /**
     * Scan drug package for authenticity
     * @param imageData - Base64 encoded image or Buffer
     * @returns Forensic analysis with authenticity score
     */
    async scanPackage(imageData: string | Buffer): Promise<ForensicAnalysis> {
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
                riskLevel: "suspicious",
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
            const prompt = `CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no commentary, no markdown.

Analyze this drug package image and return ONLY this JSON structure:

{
  "authenticityScore": 85,
  "drugName": "Drug Name 500mg",
  "nafdacNumber": "NAF-2023-12345",
  "batchNumber": "LOT-2024-001",
  "expiryDate": "12/2025",
  "findings": [
    "Print quality excellent",
    "Hologram present",
    "NAFDAC number valid format"
  ],
  "riskLevel": "safe",
  "thoughtProcess": [
    "Analyzing package quality",
    "Checking regulatory marks",
    "Evaluating security features"
  ],
  "packageFingerprint": "DNAME-NAF123-BN456-EXP1225",
  "evidenceBoxes": [
    { "box_2d": [ymin, xmin, ymax, xmax], "label": "Feature Name" }
  ]
}

CRITICAL INSTRUCTIONS FOR OBJECT DETECTION:
1. Identify key forensic features and anomalies in the image.
2. For each feature, provide the bounding box in [ymin, xmin, ymax, xmax] format.
3. Coordinates MUST be normalized to 0-1000.
4. Focus on: Holograms, NAFDAC numbers, Batch/Lot codes, Expiry dates, and Printing errors.

CRITICAL INSTRUCTIONS FOR NAFDAC NUMBER:
1. Look for text that says "NAFDAC No:" or "NAFDAC REG. No:" or "NAFDAC Reg:" or similar
2. NAFDAC numbers can be in TWO formats:
   
   A) NEW FORMAT (2019+): NAF-YYYY-NNNNN
      - NAF- prefix (uppercase)
      - 4-digit year (e.g., 2019, 2023)
      - Hyphen
      - 5-digit number (e.g., 12345)
      - Example: NAF-2019-45678
   
   B) OLD FORMAT (pre-2019): [LETTER][NUMBER]-[NUMBER]
      - 1-2 uppercase letters (e.g., A, B4, C7)
      - Hyphen
      - 4-5 digit number
      - Examples: B4-6269, A1-1234, C7-12345
   
3. DO NOT guess or make up NAFDAC numbers
4. Read the EXACT text after "NAFDAC REG. No:" or similar label
5. Double-check every character - OCR accuracy is critical
6. If you cannot clearly read the NAFDAC number, return "NOT_FOUND"
7. If no NAFDAC number present (imported drug), return "NOT_APPLICABLE"

ANALYSIS GUIDELINES:
- authenticityScore: 0-100 based on packaging quality, security features, and regulatory marks
- drugName: Extract exact drug name and dosage from package (read carefully)
- nafdacNumber: Follow CRITICAL INSTRUCTIONS above
- batchNumber: Look for "Batch", "Lot", or "B/N" text
- expiryDate: Look for "EXP", "Expiry", or "Use before" text
- riskLevel: "safe" (85-100%), "suspicious" (60-84%), "counterfeit" (0-59%)
- findings: 3-5 specific observations about the package
- thoughtProcess: 3-4 steps of your analysis
- packageFingerprint: Generate a STABLE, deterministic ID string for this SPECIFIC package. 
  Format: [DE-SPACED DRUG NAME]-[NAFDAC]-[BATCH]-[EXPIRY]
  Example: "PANADOL500-NAF123456-LOT789-122025"
  If a field is missing, use "X". This is critical for deduplication.

RESPOND WITH ONLY THE JSON OBJECT. 
DO NOT INCLUDE ANY CONVERSATIONAL TEXT, EXPLANATIONS, OR MARKDOWN BACKTICKS UNLESS ABSOLUTELY NECESSARY.
THE RESPONSE MUST BE A SINGLE VALID JSON OBJECT.
ZERO FILLER. ZERO INTRO. ZERO OUTRO.`;

            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg",
                },
            };

            const result = await retryWithBackoff(
                () => this.model.generateContent([prompt, imagePart]),
                3, // max retries
                2000 // initial delay (2 seconds)
            );
            const response = await result.response;
            const text = response.text();

            console.log("Gemini response received:", text.substring(0, 500)); // Log first 500 chars

            // extraction
            if (!text || text.trim().length < 10) {
                console.error("Empty or extremely short response from Gemini:", text);
                throw new Error("Unable to analyze image. Gemini returned an empty response. Please try with a clearer photo.");
            }

            // Check for common error strings that aren't JSON
            if (text.includes("safety filters") || text.includes("blocked") || text.includes("cannot fulfill")) {
                console.error("Gemini response blocked by safety filters:", text);
                throw new Error("National Security Protocol: Forensic analysis interrupted due to image content safety triggers.");
            }

            const analysis = this.safeParseJson(text);
            if (!analysis || typeof analysis !== 'object') {
                console.error("Failed to extract valid JSON object from response:", text);
                throw new Error("Unable to analyze image. DNA report data was malformed. Please try again with better lighting.");
            }

            // Validate NAFDAC number format if present
            if (analysis.nafdacNumber &&
                analysis.nafdacNumber !== 'NOT_FOUND' &&
                analysis.nafdacNumber !== 'NOT_APPLICABLE') {
                // New format: NAF-2023-12345
                const newFormat = /^NAF-\d{4}-\d{5}$/;
                // Old format: B4-6269, A1-1234, C7-12345
                const oldFormat = /^[A-Z]{1,2}\d{0,2}-\d{4,5}$/;

                if (!newFormat.test(analysis.nafdacNumber) && !oldFormat.test(analysis.nafdacNumber)) {
                    console.warn(`Invalid NAFDAC format detected: ${analysis.nafdacNumber}`);
                    analysis.findings.unshift(
                        `⚠️ NAFDAC number format unclear: "${analysis.nafdacNumber}" - please verify manually`
                    );
                } else {
                    const formatType = newFormat.test(analysis.nafdacNumber) ? 'new (NAF-YYYY-NNNNN)' : 'old (pre-2019)';
                    console.log(`✓ Valid NAFDAC number (${formatType}): ${analysis.nafdacNumber}`);
                }
            }

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
