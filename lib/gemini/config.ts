import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key (will be validated at runtime when actually used)
const API_KEY = process.env.GEMINI_API_KEY || '';

// Initialize Gemini AI (lazy initialization will happen when models are requested)
const genAI = new GoogleGenerativeAI(API_KEY);

// Mock mode for development/testing when hitting rate limits
export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

/**
 * Forensic Eye Model Configuration
 * Using Gemini 3 Pro Preview - high-performance analytical engine
 * Temperature 1.0: The sweet spot for nuanced counterfeit detection
 * 
 * FREE TIER LIMITS:
 * - 60 requests/minute
 * - Widely available model
 */
export const FORENSIC_EYE_CONFIG = {
    model: "gemini-3-pro-preview", // User-specified bleeding edge model
    generationConfig: {
        temperature: 1.0, // Balanced reasoning
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
    },
} as const;

/**
 * Stewardship Brain Model Configuration
 * Using Gemini 3 Pro Preview for deep clinical reasoning
 * Temperature 1.0: Contextually appropriate for medical decisions
 * 
 * FREE TIER LIMITS:
 * - 60 requests/minute
 * - Only used for text-based prescription analysis
 */
export const STEWARDSHIP_BRAIN_CONFIG = {
    model: "gemini-3-pro-preview", // Standardized to user requirement
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
    if (!API_KEY && !MOCK_MODE) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }
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
    if (!API_KEY && !MOCK_MODE) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }
    return genAI.getGenerativeModel({
        model: STEWARDSHIP_BRAIN_CONFIG.model,
        generationConfig: STEWARDSHIP_BRAIN_CONFIG.generationConfig,
    });
}

/**
 * Retry with exponential backoff for rate limit errors
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Check if it's a rate limit error
            if (error?.status === 429 || error?.message?.includes("429")) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.log(`Rate limit hit. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);

                // Extract retry delay from error if available
                const retryMatch = error.message?.match(/retry in (\\d+\\.?\\d*)s/);
                const suggestedDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : delay;

                await new Promise(resolve => setTimeout(resolve, Math.min(suggestedDelay, delay)));
                continue;
            }

            // If it's not a rate limit error, throw immediately
            throw error;
        }
    }

    throw lastError || new Error("Max retries exceeded");
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
