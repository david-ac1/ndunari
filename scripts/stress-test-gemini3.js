const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
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

async function stressTest() {
    if (!apiKey) {
        console.error("No API key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = "gemini-3-pro-preview";
    const imagePath = "C:/Users/david/.gemini/antigravity/brain/0022c8f0-3f94-446a-affa-04b507dbb986/uploaded_image_1768655517057.png";

    if (!fs.existsSync(imagePath)) {
        console.error("Target image not found at:", imagePath);
        return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    try {
        console.log(`Testing Gemini 3 with forensic specimen...`);
        const model = genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: 1.0, // High nuance
                responseMimeType: "application/json"
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        const prompt = "Analyze this drug package and return a JSON object with { drugName, authenticityScore, riskLevel }. Strictly JSON.";

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: "image/png"
            }
        };

        console.log("Waiting for Sentinel reasoning (this may take 30-40s)...");
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;

        console.log("--- AUDIT RESULTS ---");
        console.log("Text:", response.text());
        console.log("Finish Reason:", response.candidates?.[0]?.finishReason);
        console.log("Safety Ratings:", JSON.stringify(response.candidates?.[0]?.safetyRatings, null, 2));

    } catch (error) {
        console.error("--- STRESS TEST FAILED ---");
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("Detailed Response Error:", JSON.stringify(error.response, null, 2));
        }
    }
}

stressTest();
