import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { ScanResult, ThoughtSignature, AgentResponse } from "./types";

// Environment variable for API Key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Model definitions
const FLASH_MODEL = "gemini-2.5-flash-preview-09-2025";
const PRO_THINKING_MODEL = "gemini-3-flash-preview";

/**
 * Manages the "Thought Signature" opacity state to prevent 400 errors.
 * In a real-world scenario, this might persist to a DB or Redis.
 */
export class ThoughtSignatureManager {
    private static signatures: Map<string, ThoughtSignature> = new Map();

    static create(trace: string): ThoughtSignature {
        const id = crypto.randomUUID();
        const sig: ThoughtSignature = {
            id,
            timestamp: new Date().toISOString(),
            reasoning_trace: trace
        };
        this.signatures.set(id, sig);
        return sig;
    }

    static get(id: string): ThoughtSignature | undefined {
        return this.signatures.get(id);
    }
}

/**
 * The Central Nervous System of Ndunari.
 * Orchestrates the "Forensic Eye" and "Stewardship Brain".
 */
export class AgentCoordinator {
    // CRITICAL: Temperature must be 1.0 for balanced reasoning
    private static readonly CONFIG = {
        temperature: 1.0,
    };

    /**
     * Phase 1: Forensic Eye (Fast)
     * Uses Gemini 3 Flash for rapid visual audit.
     * @param imageBase64 Base64 encoded image string
     */
    async scanPackage(imageBase64: string): Promise<AgentResponse> {
        if (!API_KEY) {
            return { status: 'error', error: "API Key not configured" };
        }

        try {
            const model = genAI.getGenerativeModel({
                model: FLASH_MODEL,
                generationConfig: AgentCoordinator.CONFIG
            });

            const prompt = `
          Analyze this drug packaging image for forensic authenticity.
          
          Output valid JSON with the following schema:
          {
            "authenticityScore": number (0-100),
            "drugName": string,
            "batchNumber": string,
            "manufacturer": string,
            "expiryDate": string,
            "isHighRisk": boolean,
            "findings": string[]
          }

          Check for:
          1. Micro-typography consistency.
          2. Hologram refraction patterns (simulated detection).
          3. NAFDAC number syntax validity.
          4. WHO Drug Category (Reserve/Watch/Access). Mark isHighRisk=true if Reserve or Watch.
        `;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
            ]);

            const responseText = result.response.text();

            // Basic JSON cleaning (Gemini sometimes wraps in markdown)
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const scanResult: ScanResult = JSON.parse(jsonStr);

            // Enhance result with ID
            scanResult.scanId = crypto.randomUUID();

            return {
                status: 'success',
                data: scanResult
            };

        } catch (error) {
            console.error("Forensic Eye failed:", error);
            return { status: 'error', error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    /**
     * Logic to determine if we need to escalate to the "Stewardship Brain"
     */
    shouldEscalate(result: ScanResult): boolean {
        // Escalate if:
        // 1. Authenticity score is suspicious (< 95)
        // 2. It is a "High Risk" drug (Reserve/Watch antibiotics)
        // 3. Any suspicious visual findings
        if (result.authenticityScore < 95) return true;
        if (result.isHighRisk) return true;
        if (result.findings && result.findings.some(f => f.toLowerCase().includes('suspicious'))) return true;

        return false;
    }

    /**
     * Phase 2: Stewardship Brain (Deep Reasoning)
     * Uses Gemini 3 Pro Thinking for clinical justification.
     */
    async escalateToStewardship(scanResult: ScanResult, previousSignatureId?: string): Promise<AgentResponse> {
        if (!API_KEY) return { status: 'error', error: "API Key not configured" };

        const model = genAI.getGenerativeModel({
            model: PRO_THINKING_MODEL,
            generationConfig: AgentCoordinator.CONFIG
        });

        // Retrieve previous thought context if available
        const prevSig = previousSignatureId ? ThoughtSignatureManager.get(previousSignatureId) : undefined;

        // Construct prompt with context
        const prompt = `
      CRITICAL MEDICAL ANALYSIS REQUIRED.
      
      CONTEXT:
      Scan Data: ${JSON.stringify(scanResult)}
      Previous Reasoning Trace: ${prevSig?.reasoning_trace || "None"}
      
      TASK:
      Justify the use of this pharmaceutical against WHO AWaRe categorization and NCDC 2025 Guidelines.
      
      REQUIREMENTS:
      1. If this is a RESERVE drug, require strict clinical justification.
      2. If this appears counterfeit (low score), provide safety warnings.
      3. Generate output in clear, clinical English suitable for a pharmacist advice display.
    `;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Create new thought signature for this step to persist the thinking chain
            // In a real implementation, we might extract specific thinking tokens if available
            const newSig = ThoughtSignatureManager.create(text.substring(0, 200) + "...");

            return {
                status: 'success',
                data: { recommendation: text },
                thoughtSignature: newSig
            };

        } catch (e) {
            console.error("Stewardship Brain failed:", e);
            return { status: 'error', error: e instanceof Error ? e.message : "Unknown error" };
        }
    }
}
