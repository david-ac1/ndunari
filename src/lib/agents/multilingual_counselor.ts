import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Fast model for translation
const TRANSLATION_MODEL = "gemini-2.5-flash-preview-09-2025";

export interface TranslatedGuidance {
    language: string;
    text: string;
    audioLocale: string; // e.g., 'en-NG'
}

export class CounselorService {

    /**
     * Translates clinical guidance into the 4 major Nigerian languages + Pidgin.
     */
    async translateGuidance(originalText: string, targetLang: 'Pidgin' | 'Hausa' | 'Igbo' | 'Yoruba'): Promise<TranslatedGuidance> {
        if (!API_KEY) throw new Error("API Key missing");

        const model = genAI.getGenerativeModel({
            model: TRANSLATION_MODEL,
            generationConfig: { temperature: 0.3 } // Lower temperature for accurate translation
        });

        const prompt = `
      ROLE: You are a Medical Interpreter for Nigerian patients.
      TASK: Translate the following medical advice into ${targetLang}.
      
      SOURCE TEXT: "${originalText}"

      REQUIREMENTS:
      1. Keep it simple and culturally relevant.
      2. Maintain the clinical accuracy (don't water down warnings).
      3. Use standard orthography for ${targetLang}.
      
      OUTPUT: Just the translated text. No preamble.
    `;

        try {
            const result = await model.generateContent(prompt);
            const translatedText = result.response.text().trim();

            // Map to approximate browser speech locales (Note: Support varies by device)
            let audioLocale = 'en-NG'; // Default fallback
            if (targetLang === 'Hausa') audioLocale = 'ha-NG'; // Supported on some Androids
            if (targetLang === 'Igbo') audioLocale = 'ig-NG';
            if (targetLang === 'Yoruba') audioLocale = 'yo-NG';

            return {
                language: targetLang,
                text: translatedText,
                audioLocale
            };

        } catch (error) {
            console.error(`Narị Counselor Error (${targetLang}):`, error);
            // Fallback to original text if translation fails
            return {
                language: targetLang,
                text: originalText,
                audioLocale: 'en-US'
            };
        }
    }
}
