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
}

async function verifyMultimodal() {
    if (!apiKey) {
        console.error("No API key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = "gemini-3-pro-preview";

    try {
        console.log(`Testing multimodal JSON with ${modelId}...`);
        const model = genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        // Use a small 1x1 black pixel or some dummy image data
        const dummyImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        const prompt = "Return a JSON object with { detected: true } after looking at this image.";

        const imagePart = {
            inlineData: {
                data: dummyImageBase64,
                mimeType: "image/png"
            }
        };

        console.log("Sending multimodal prompt...");
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;

        console.log("Response text:", response.text());
        console.log("Finish reason:", response.candidates?.[0]?.finishReason);
        console.log("Safety ratings:", JSON.stringify(response.candidates?.[0]?.safetyRatings, null, 2));

    } catch (error) {
        console.error("Verification failed:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

verifyMultimodal();
