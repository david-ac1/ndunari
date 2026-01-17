import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

async function verify() {
    if (!API_KEY) {
        console.error("No API key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        console.log("Listing models...");
        // The SDK doesn't have a direct listModels in the main class easily accessible without specific versions
        // but we can try to get the model.
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
        console.log("Model instance created successfully.");

        const result = await model.generateContent("Hello, are you Gemini 3? Respond with a single word.");
        const response = await result.response;
        console.log("Response text:", response.text());
        console.log("Finish reason:", response.candidates?.[0]?.finishReason);
    } catch (error: any) {
        console.error("Verification failed:", error.message);
    }
}

verify();
