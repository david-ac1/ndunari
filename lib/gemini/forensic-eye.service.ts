import { getForensicEyeModel, MOCK_MODE, retryWithBackoff } from "./config";
import { z } from "zod";

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
});

export type ForensicAnalysis = z.infer<typeof ForensicAnalysisSchema>;

/**
 * Quick validation result
 */
interface QuickValidation {
    isValidDrugPackage: boolean;
    confidence: number;
    reason?: string;
}

/**
 * Forensic Eye Service
 * Uses Gemini 2.0 Flash with high-resolution image processing
 * NO image compression - full resolution for microscopic detail detection
 */
export class ForensicEyeService {
    private model = getForensicEyeModel();

    /**
     * Quick pre-validation to check if image contains drug packaging
     * This prevents wasting API calls on faces, random objects, etc.
     * Uses a simple, fast prompt to save on quota
     */
    private async quickValidate(imageBase64: string): Promise<QuickValidation> {
        const prompt = `Is this image a photograph of pharmaceutical drug packaging (medicine box, blister pack, bottle, etc.)? 
    
Respond with ONLY a JSON object:
{
  "isValidDrugPackage": true/false,
  "confidence": 0-100,
  "reason": "brief explanation"
}

Examples of VALID: medicine boxes, pill bottles, drug packages, blister packs, pharmaceutical labels
Examples of INVALID: human faces, furniture, food, random objects, blank images, documents`;

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg",
            },
        };

        try {
            const result = await retryWithBackoff(
                () => this.model.generateContent([prompt, imagePart]),
                1, // Only 1 retry for validation
                1000
            );
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // If can't parse, assume it's not a drug package
                return {
                    isValidDrugPackage: false,
                    confidence: 0,
                    reason: "Unable to parse validation response",
                };
            }

            const validation = JSON.parse(jsonMatch[0]);
            return validation;
        } catch (error) {
            console.error("Quick validation failed:", error);
            // If validation fails, assume it's not valid to save API calls
            return {
                isValidDrugPackage: false,
                confidence: 0,
                reason: "Validation check failed",
            };
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
                thoughtProcess: [
                    "Analyzing hologram structure...",
                    "Checking NAFDAC number format...",
                    "Evaluating print quality...",
                    "Detecting security feature anomalies",
                ],
            };
        }

        try {
            // Convert image data if needed
            const imageBase64 =
                typeof imageData === "string"
                    ? imageData.replace(/^data:image\/\w+;base64,/, "")
                    : imageData.toString("base64");

            // STEP 1: Quick validation to prevent wasting API calls
            console.log("Running pre-scan validation...");
            const validation = await this.quickValidate(imageBase64);

            if (!validation.isValidDrugPackage || validation.confidence < 50) {
                throw new Error(
                    `Not a valid drug package image. ${validation.reason || "Please scan a medicine box, pill bottle, or pharmaceutical packaging."}`
                );
            }

            console.log(
                `✓ Validation passed (${validation.confidence}% confidence). Proceeding to forensic scan...`
            );

            // STEP 2: Full forensic analysis
            const prompt = `You are a pharmaceutical forensic expert analyzing drug packaging for authenticity.

CRITICAL ANALYSIS POINTS:
1. NAFDAC Registration Number Format
   - Valid format: NAF-YYYY-NNNNN (e.g., NAF-2023-12345)
   - Check for printing quality and clarity
   - Verify number placement and alignment

2. Security Features
   - Hologram placement and quality
   - Color-shifting inks
   - Tamper-evident seals
   - Microtext and fine printing

3. Packaging Quality
   - Print clarity and sharpness
   - Color consistency
   - Font kerning and spacing
   - Material quality

4. Suspicious Indicators
   - Blurred or degraded printing
   - Misspellings or grammatical errors
   - Incorrect hologram placement (>2mm deviation)
   - Missing security features
   - Inconsistent color reproduction

RESPONSE FORMAT (JSON):
{
  "authenticityScore": <0-100>,
  "drugName": "<extracted drug name>",
  "nafdacNumber": "<extracted NAFDAC number or 'NOT_FOUND'>",
  "batchNumber": "<extracted batch number>",
  "expiryDate": "<extracted expiry date>",
  "findings": [
    "<specific observation 1>",
    "<specific observation 2>"
  ],
  "riskLevel": "safe" | "suspicious" | "counterfeit",
  "thoughtProcess": [
    "Analyzing hologram structure...",
    "Checking NAFDAC number format...",
    "<reasoning step>"
  ]
}

Analyze this drug package image and provide a detailed forensic assessment.`;

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

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Failed to extract JSON from Gemini response");
            }

            const analysis = JSON.parse(jsonMatch[0]);
            const validated = ForensicAnalysisSchema.parse(analysis);

            const duration = Date.now() - startTime;
            console.log(`Forensic scan completed in ${duration}ms`);

            return validated;
        } catch (error) {
            console.error("Forensic Eye scan failed:", error);
            throw new Error(
                `Scan failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
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
