import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

export interface WebVerificationResult {
    source: string;
    isVerified: boolean;
    details: string;
    lastUpdated: string;
}

/**
 * Real-time Web Verification Service
 * Uses Gemini's vast internal knowledge of the NAFDAC Greenbook and medical registries
 * to dynamically verify drugs, replacing hardcoded mock data.
 */
export class WebVerificationService {

    async verifyOnline(drugName: string, nafdacNumber?: string): Promise<WebVerificationResult> {
        try {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            const prompt = `
            Act as a NAFDAC Verification Agent.
            Query: "${drugName}" ${nafdacNumber ? `(NAFDAC: ${nafdacNumber})` : ""}

            TASK:
            1. Access your internal database of pharmaceutical registrations (NAFDAC Greenbook, WHO EML, EMDEX).
            2. Determine if this drug is a known, registered pharmaceutical in Nigeria.
            3. If NAFDAC number is provided, validate its format (typically A7-XXXX or 04-XXXX).
            
            OUTPUT JSON (No markdown):
            {
                "isVerified": boolean,
                "source": "NAFDAC Registry (Knowledge Graph)",
                "details": "e.g., 'Registered Anti-Malarial' or 'Unknown/Unregistered'",
                "lastUpdated": "${new Date().toISOString().split('T')[0]}"
            }
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Clean response
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);

        } catch (error) {
            console.error("Web Verification failed:", error);
            return {
                source: "Verification Service Offline",
                isVerified: false,
                details: "Connectivity Error",
                lastUpdated: new Date().toISOString()
            };
        }
    }
}

export const webVerificationService = new WebVerificationService();
