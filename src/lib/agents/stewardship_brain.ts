import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// User-specified model for high-reasoning tasks
const THINKING_MODEL = "gemini-3-flash-preview";

export interface StewardshipResponse {
    riskLevel: "safe" | "caution" | "danger";
    classification: "Access" | "Watch" | "Reserve" | "Unknown";
    clinicalJustification: string;
    localGuidance: {
        language: string;
        advice: string;
    }[];
    thoughtSignature: string; // The opaque reasoning trace from this session
}

export class StewardshipBrain {

    /**
     * The "Thinking Handshake" - Continues reasoning from a previous Forensic Eye scan.
     * @param drugName Name of the drug identified
     * @param previousSignature The opaque string from Forensic Eye (if any)
     */
    async continueReasoning(drugName: string, previousSignature?: string): Promise<StewardshipResponse> {
        if (!API_KEY) throw new Error("API Key missing");

        const model = genAI.getGenerativeModel({
            model: THINKING_MODEL,
            generationConfig: {
                temperature: 1.0, // Sweet spot for reasoning
                // thinking_level property is not yet standard in public types but implied by "Thinking" model usage
            }
        });

        // Provide context from the previous agent
        const contextPrompt = previousSignature
            ? `PREVIOUS AGENT THOUGHT TRACE: ${previousSignature}\n`
            : "NO PREVIOUS AGENT CONTEXT.\n";

        const prompt = `
      ${contextPrompt}
      
      ROLE: You are an Expert Clinical Pharmacist in Nigeria.
      TASK: Analyze the Safety and Stewardship implications of: "${drugName}".

      GUIDELINES:
      1. Classify using WHO AWaRe 2025 (Access, Watch, Reserve).
      2. If "Reserve", MARK AS DANGER immediately.
      3. Reference NCDC 2025 Antimicrobial Resistance patterns for Nigeria.
      4. Provide localized counseling for a patient in Lagos/Abuja.

      OUTPUT FORMAT (JSON ONLY):
      {
        "riskLevel": "safe" | "caution" | "danger",
        "classification": "Access" | "Watch" | "Reserve" | "Unknown",
        "clinicalJustification": "Clear, medical explanation of why this classification was chosen...",
        "localGuidance": [
            { "language": "Pidgin", "advice": "..." },
            { "language": "Hausa", "advice": "..." },
            { "language": "Yoruba", "advice": "..." },
            { "language": "Igbo", "advice": "..." }
        ]
      }
    `;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Clean JSON
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonStr);

            // We simulate extracting the new thought signature from the response metadata 
            // or using the response text itself as the new trace
            const newThoughtSignature = `STEWARDSHIP_TRACE::${Date.now()}::${drugName}::${parsed.riskLevel}`;

            return {
                ...parsed,
                thoughtSignature: newThoughtSignature
            };

        } catch (error) {
            console.error("Stewardship Brain Error:", error);
            throw error;
        }
    }
}
