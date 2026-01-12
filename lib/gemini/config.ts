import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Forensic Eye Model Configuration
 * Uses Gemini 2.0 Flash for fast, cost-effective drug authentication
 * Temperature 1.0: The sweet spot for nuanced counterfeit detection
 */
export const FORENSIC_EYE_CONFIG = {
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        temperature: 1.0, // Balanced reasoning per GEMINI3_TECHNICAL.md
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
    },
} as const;

/**
 * Stewardship Brain Model Configuration
 * Uses Gemini 2.0 Flash Thinking for clinical-grade medical reasoning
 * Temperature 1.0: Contextually appropriate for medical decisions
 */
export const STEWARDSHIP_BRAIN_CONFIG = {
    model: "gemini-2.0-flash-thinking-exp-1219",
    generationConfig: {
        temperature: 1.0, // Precise medical reasoning
        maxOutputTokens: 4096, // For 5 languages + recommendations
        topP: 0.95,
        topK: 40,
    },
} as const;

/**
 * Get Forensic Eye model instance
 * Used for 99% of scans (<$0.001/scan, 2-3 seconds)
 */
export function getForensicEyeModel() {
    return genAI.getGenerativeModel({
        model: FORENSIC_EYE_CONFIG.model,
        generationConfig: FORENSIC_EYE_CONFIG.generationConfig,
    });
}

/**
 * Get Stewardship Brain model instance
 * Used for 1% of scans (<$0.015/assessment, 4-6 seconds)
 * Escalated only for: Reserve drugs, suspicious packages, NAFDAC failures
 */
export function getStewardshipBrainModel() {
    return genAI.getGenerativeModel({
        model: STEWARDSHIP_BRAIN_CONFIG.model,
        generationConfig: STEWARDSHIP_BRAIN_CONFIG.generationConfig,
    });
}

/**
 * Reserve drugs that trigger automatic escalation to Stewardship Brain
 * Based on WHO AWaRe "Reserve" category
 */
export const RESERVE_DRUGS = [
    "azithromycin",
    "ciprofloxacin",
    "levofloxacin",
    "meropenem",
    "colistin",
    "tigecycline",
    "linezolid",
    "daptomycin",
] as const;

/**
 * Authenticity score threshold for escalation
 * Scores below 95.0 indicate suspicious packages requiring deep analysis
 */
export const ESCALATION_THRESHOLD = 95.0;

export { genAI };
