import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Get API key (will be validated at runtime when actually used)
// Support both client-side and server-side environment variables
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// Initialize Gemini AI (lazy initialization will happen when models are requested)
const genAI = new GoogleGenerativeAI(API_KEY);

// Mock mode for development/testing when hitting rate limits
export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

/**
 * Forensic Eye Model Configuration
 * PRIMARY: gemini-3-flash-preview - User-specified Gemini 3 model
 * FALLBACK: gemini-2.0-flash-exp - Stable Gemini 2.0 fallback
 * 
 * Temperature 0.15: Balanced stability for complex multimodal reasoning
 * 
 * FREE TIER LIMITS:
 * - 15 RPM for Gemini 3
 * - 15 RPM for Gemini 2.0 fallback
 */
export const FORENSIC_EYE_CONFIG = {
    model: "gemini-3-pro-image-preview", // User-specified Gemini 3 model
    fallbackModel: "gemini-2.0-flash-exp", // Stable fallback
    generationConfig: {
        temperature: 0.15, // Balanced stability for complex multimodal reasoning
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
    },
} as const;

/**
 * Stewardship Brain Model Configuration
 * Using Gemini 3 for deep clinical reasoning with Gemini 2.0 fallback
 * Temperature 0.1: Precise clinical reasoning
 * 
 * FREE TIER LIMITS:
 * - 15 RPM for Gemini 3
 * - Only used for text-based prescription analysis
 */
export const STEWARDSHIP_BRAIN_CONFIG = {
    model: "gemini-3-pro-image-preview", // User-specified Gemini 3 model
    fallbackModel: "gemini-2.0-flash-exp",
    generationConfig: {
        temperature: 0.1, // Precise clinical reasoning
        maxOutputTokens: 4096, // For 5 languages + recommendations
        topP: 0.95,
        topK: 40,
    },
} as const;

export const SENTINEL_SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];


export function getForensicEyeModel(useJsonMode = false, useFallback = false) {
    if (!API_KEY && !MOCK_MODE) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }
    const modelId = useFallback ? FORENSIC_EYE_CONFIG.fallbackModel : FORENSIC_EYE_CONFIG.model;
    console.log(`🔬 Initializing Forensic Eye with model: ${modelId}`);
    return genAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
            ...FORENSIC_EYE_CONFIG.generationConfig,
            responseMimeType: useJsonMode ? "application/json" : "text/plain",
        },
        safetySettings: SENTINEL_SAFETY_SETTINGS,
    });
}

/**
 * Get Stewardship Brain model instance
 * Used for 1% of scans (<$0.015/assessment, 4-6 seconds)
 * Escalated only for: Reserve drugs, suspicious packages, NAFDAC failures
 */
export function getStewardshipBrainModel(useJsonMode = false, useFallback = false) {
    if (!API_KEY && !MOCK_MODE) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }
    const modelId = useFallback ? STEWARDSHIP_BRAIN_CONFIG.fallbackModel : STEWARDSHIP_BRAIN_CONFIG.model;
    console.log(`🧠 Initializing Stewardship Brain with model: ${modelId}`);
    return genAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
            ...STEWARDSHIP_BRAIN_CONFIG.generationConfig,
            responseMimeType: useJsonMode ? "application/json" : "text/plain",
        },
        safetySettings: SENTINEL_SAFETY_SETTINGS,
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
