import { getStewardshipBrainModel } from "./config";
import { z } from "zod";
import type { ForensicAnalysis } from "./forensic-eye.service";

/**
 * WHO AWaRe Classification
 * Access: First-line, widely accessible antibiotics
 * Watch: Second-line, monitor usage
 * Reserve: Last resort, restricted use
 */
export type AWaReCategory = "ACCESS" | "WATCH" | "RESERVE" | "UNKNOWN";

/**
 * Stewardship Assessment Schema
 */
export const StewardshipAssessmentSchema = z.object({
    drugName: z.string(),
    awareCategory: z.enum(["ACCESS", "WATCH", "RESERVE", "UNKNOWN"]),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    recommendations: z.array(z.string()),
    alternatives: z.array(z.string()).optional(),
    counseling: z.object({
        english: z.string(),
        pidgin: z.string().optional(),
        yoruba: z.string().optional(),
        hausa: z.string().optional(),
        igbo: z.string().optional(),
    }),
    thoughtProcess: z.array(z.string()),
    warningFlags: z.array(z.string()),
});

export type StewardshipAssessment = z.infer<typeof StewardshipAssessmentSchema>;

/**
 * Stewardship Brain Service
 * Uses Gemini 2.0 Flash Thinking for deep clinical reasoning
 * Temperature 1.0: Contextually appropriate medical decisions
 */
export class StewardshipBrainService {
    private model = getStewardshipBrainModel();

    /**
     * Analyze prescription for antibiotic stewardship
     * @param drugName - Name of the drug
     * @param indication - Medical indication/condition
     * @param forensicData - Optional forensic analysis from Flash model
     * @returns Clinical assessment with WHO AWaRe classification
     */
    async analyzePrescription(
        drugName: string,
        indication?: string,
        forensicData?: ForensicAnalysis
    ): Promise<StewardshipAssessment> {
        const startTime = Date.now();

        try {
            const prompt = `You are an infectious disease specialist and antibiotic stewardship expert with deep knowledge of Nigerian healthcare challenges and WHO guidelines.

DRUG TO ANALYZE: ${drugName}
${indication ? `MEDICAL INDICATION: ${indication}` : ""}
${forensicData ? `FORENSIC ANALYSIS: Authenticity Score ${forensicData.authenticityScore}%, Risk Level: ${forensicData.riskLevel}` : ""}

CRITICAL ANALYSIS FRAMEWORK:

1. WHO AWaRe CLASSIFICATION
   - ACCESS: First-line antibiotics (Amoxicillin, Ampicillin, etc.)
   - WATCH: Second-line, higher resistance risk (Ciprofloxacin, Azithromycin)
   - RESERVE: Last resort only (Colistin, Linezolid, Meropenem)

2. NIGERIAN AMR CONTEXT
   - High over-the-counter antibiotic access
   - Widespread fluoroquinolone resistance
   - Rising carbapenem resistance in hospitals
   - Limited culture/sensitivity testing availability

3. NCDC GUIDELINES
   - Community-acquired pneumonia: Amoxicillin first-line
   - UTI: Nitrofurantoin preferred over quinolones
   - Skin infections: Flucloxacillin, not Reserve drugs

4. RED FLAGS FOR RESERVE DRUGS
   - Use for minor infections (common cold, simple UTI)
   - No documented culture results
   - First-line alternatives not tried
   - Community/outpatient setting (should be hospital-only)

MULTILINGUAL COUNSELING REQUIREMENTS:
- English: Standard medical counseling
- Nigerian Pidgin: "Make person fit understand for street"
- Ensure cultural sensitivity and local context

RESPONSE FORMAT (JSON):
{
  "drugName": "<drug name>",
  "awareCategory": "ACCESS" | "WATCH" | "RESERVE" | "UNKNOWN",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "recommendations": [
    "<specific recommendation 1>",
    "<specific recommendation 2>"
  ],
  "alternatives": ["<safer alternative 1>", "<safer alternative 2>"],
  "counseling": {
    "english": "<detailed patient counseling>",
    "pidgin": "<same message in Nigerian Pidgin>"
  },
  "thoughtProcess": [
    "Identifying drug classification...",
    "Checking WHO AWaRe category...",
    "Analyzing regional resistance patterns...",
    "<reasoning steps>"
  ],
  "warningFlags": [
    "<warning 1 if applicable>",
    "<warning 2 if applicable>"
  ]
}

Provide a comprehensive stewardship assessment for this drug.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Failed to extract JSON from Gemini response");
            }

            const assessment = JSON.parse(jsonMatch[0]);
            const validated = StewardshipAssessmentSchema.parse(assessment);

            const duration = Date.now() - startTime;
            console.log(`Stewardship analysis completed in ${duration}ms`);

            return validated;
        } catch (error) {
            console.error("Stewardship analysis failed:", error);
            throw new Error(`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Deep analysis for escalated cases
     * Used when Flash model detects suspicious packages or Reserve drugs
     */
    async deepAnalysis(
        imageData: string | Buffer,
        forensicData: ForensicAnalysis
    ): Promise<{
        forensic: ForensicAnalysis;
        stewardship: StewardshipAssessment | null;
    }> {
        console.log("Escalating to deep analysis (Thinking mode)...");

        // If it's a Reserve drug or suspicious, run stewardship analysis
        const needsStewardship =
            forensicData.riskLevel !== "safe" ||
            this.isReserveDrug(forensicData.drugName);

        if (!needsStewardship) {
            return {
                forensic: forensicData,
                stewardship: null,
            };
        }

        const stewardship = await this.analyzePrescription(
            forensicData.drugName,
            undefined,
            forensicData
        );

        return {
            forensic: forensicData,
            stewardship,
        };
    }

    /**
     * Check if drug is in WHO Reserve category
     */
    private isReserveDrug(drugName: string): boolean {
        const reserveDrugs = [
            "azithromycin",
            "ciprofloxacin",
            "levofloxacin",
            "meropenem",
            "colistin",
            "tigecycline",
            "linezolid",
            "daptomycin",
            "ceftazidime-avibactam",
            "ceftolozane-tazobactam",
        ];

        const normalized = drugName.toLowerCase().trim();
        return reserveDrugs.some((reserve) => normalized.includes(reserve));
    }

    /**
     * Get WHO AWaRe classification for a drug
     * This would ideally call a database, but we'll use Gemini for now
     */
    async getAWaReClassification(drugName: string): Promise<AWaReCategory> {
        const prompt = `What is the WHO AWaRe classification for ${drugName}? 
    Respond with ONLY one word: ACCESS, WATCH, RESERVE, or UNKNOWN.`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().toUpperCase();

        if (text.includes("ACCESS")) return "ACCESS";
        if (text.includes("WATCH")) return "WATCH";
        if (text.includes("RESERVE")) return "RESERVE";
        return "UNKNOWN";
    }
}

// Export singleton instance
export const stewardshipBrainService = new StewardshipBrainService();
