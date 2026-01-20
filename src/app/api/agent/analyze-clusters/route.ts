import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Gemini 3 Pro with Thinking Mode
const MODEL_NAME = "gemini-3-flash-preview";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        // Use service role if available for viewing all scans, otherwise basic client (limited by RLS)
        const supabase = createClient(cookieStore);

        // 1. Fetch recent suspicious scans (Last 24h)
        // Note: in a real scenario, this needs a Service Role client to see ALL users' scans
        const { data: scans, error } = await supabase
            .from('scans')
            .select('id, drug_name, risk_level, location, created_at')
            .in('risk_level', ['danger', 'caution'])
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw new Error(error.message);

        if (!scans || scans.length === 0) {
            return NextResponse.json({ message: "No threats detected in window." });
        }

        // 2. Formatting for the Agent
        const scanLog = scans.map(s =>
            `[${s.created_at}] ${s.drug_name} - Risk: ${s.risk_level} - Loc: ${JSON.stringify(s.location)}`
        ).join("\n");

        // 3. Sentinel Analysis
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: { temperature: 1.0 } // Thinking mode usually implies specific settings
        });

        const prompt = `
      ROLE: You are "The Sentinel", an autonomous AI monitoring Nigeria's pharmaceutical supply chain.
      
      INPUT DATA (Recent suspicious scans):
      ${scanLog}
      
      TASK:
      1. Analyze the logs for patterns (e.g., "Multiple fake Amoxicillin reports in Lagos").
      2. If a cluster is found, generate a public health alert ("Autonomous Directive").
      3. If no clear pattern, state "System Nominal".
      
      OUTPUT JSON:
      {
        "status": "ALERT" | "NOMINAL",
        "directive_title": "Short headline",
        "directive_body": "Clear warning for the public...",
        "affected_region": "e.g., Lagos, Kano"
      }
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const directive = JSON.parse(jsonStr);

        return NextResponse.json(directive);

    } catch (err: any) {
        console.error("Sentinel Agent Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
