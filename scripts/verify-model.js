const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
    if (!apiKey) {
        const match2 = envFile.match(/NEXT_PUBLIC_GEMINI_API_KEY=(.*)/);
        if (match2) apiKey = match2[1].trim();
    }
}

async function verify() {
    if (!apiKey) {
        console.error("No API key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Testing gemini-3-pro-preview...");
        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: {
                temperature: 0.1
            }
        });
        console.log("Model instance created.");

        // Test simple generation
        console.log("Sending test prompt...");
        const result = await model.generateContent("Respond with ONLY the word 'READY'.");
        const response = await result.response;
        const text = response.text();
        console.log("Response text:", text);
        console.log("Finish reason:", response.candidates?.[0]?.finishReason);

        // Test JSON capability
        console.log("Testing JSON mode...");
        const modelJson = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });
        const resultJson = await modelJson.generateContent("Return a JSON object with { status: 'OK' }");
        const responseJson = await resultJson.response;
        console.log("JSON response text:", responseJson.text());

    } catch (error) {
        console.error("Verification failed:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

verify();
