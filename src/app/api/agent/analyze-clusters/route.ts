import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Gemini 3 Flash with Code Execution for autonomous data analysis
const MODEL_NAME = "gemini-3-flash-preview";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function GET(request: NextRequest) {
    try {
        // Use service role if available for viewing all scans, otherwise basic client (limited by RLS)
        const supabase = await createClient();

        // 1. Fetch recent counterfeit/suspicious scans (Last 7 days for better clustering)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: scans, error } = await supabase
            .from('scans')
            .select('id, drug_name, risk_level, region, authenticity_score, created_at')
            .in('risk_level', ['suspicious', 'counterfeit'])
            .gte('created_at', sevenDaysAgo)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw new Error(error.message);

        if (!scans || scans.length === 0) {
            return NextResponse.json({
                status: "NOMINAL",
                message: "No counterfeit clusters detected in the last 7 days.",
                scansAnalyzed: 0
            });
        }

        // 2. Format data for agent analysis
        const scanData = scans.map(s => ({
            drug: s.drug_name,
            region: s.region || 'Unknown',
            score: s.authenticity_score,
            risk: s.risk_level,
            date: s.created_at
        }));

        // 3. Initialize Gemini with Code Execution capability
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.2, // Lower for data analysis precision
                responseMimeType: "application/json"
            },
            tools: [{ codeExecution: {} }] // Enable Python code execution
        });

        const prompt = `ROLE: You are "The Sentinel", an autonomous pharmaceutical surveillance AI for Nigeria.

MISSION: Analyze counterfeit drug detections for geographic clustering and patterns.

INPUT DATA (${scans.length} detections in last 7 days):
${JSON.stringify(scanData, null, 2)}

TASK: Use Python code execution to perform geospatial cluster analysis.

REQUIRED ANALYSIS:
1. Parse the region data (format: "State-City" or "State")
2. Group detections by state/city
3. Calculate clustering density (detections per 1000 scans if possible)
4. Identify hotspots (regions with >3 counterfeits in 7 days)
5. Find drug-specific patterns (e.g., "Amoxicillin counterfeits in Lagos")
6. Statistical significance test (if baseline data available)

PYTHON CODE TEMPLATE:
\`\`\`python
import json
from collections import Counter, defaultdict

# Parse input
scans = ${JSON.stringify(scanData)}

# Group by region
region_counts = Counter(s['region'].split('-')[0] if '-' in s['region'] else s['region'] for s in scans)

# Group by drug
drug_counts = Counter(s['drug'] for s in scans)

# Cross-tabulate drug x region
drug_region = defaultdict(lambda: defaultdict(int))
for s in scans:
    region = s['region'].split('-')[0] if '-' in s['region'] else s['region']
    drug_region[s['drug']][region] += 1

# Find hotspots (>3 in 7 days)
hotspots = {r: count for r, count in region_counts.items() if count > 3}

# Output analysis
{
    "total_counterfeits": len(scans),
    "regional_distribution": dict(region_counts.most_common(5)),
    "drug_distribution": dict(drug_counts.most_common(5)),
    "hotspots": hotspots,
    "drug_region_matrix": {drug: dict(regions) for drug, regions in drug_region.items() if sum(regions.values()) > 2}
}
\`\`\`

OUTPUT STRUCTURE:
{
  "status": "ALERT" | "NOMINAL",
  "directive_title": "Short public health headline",
  "directive_body": "Clear warning for citizens and pharmacies",
  "affected_regions": ["State/City list"],
  "statistics": {
    "total_counterfeits": number,
    "hotspots": {"Region": count},
    "top_drugs": ["Drug list"]
  },
  "python_execution": {
    "code_ran": true/false,
    "insights": ["Key findings from analysis"]
  },
  "recommendations": ["Action items for NAFDAC"]
}

CRITICAL: 
- Execute Python code to perform actual analysis
- Base directive on statistical evidence (not assumptions)
- If clustering significance test shows p<0.05, escalate to ALERT
- Include Python insights in output`;

        const result = await model.generateContent(prompt);
        const directive = JSON.parse(result.response.text());

        // Log for admin dashboard
        console.log('🤖 Sentinel Agent Analysis Complete:', {
            scansAnalyzed: scans.length,
            status: directive.status,
            hotspotsFound: Object.keys(directive.statistics?.hotspots || {}).length,
            codeExecuted: directive.python_execution?.code_ran
        });

        return NextResponse.json(directive);

    } catch (err: any) {
        console.error("Sentinel Agent Error:", err);
        return NextResponse.json({
            error: err.message,
            status: "ERROR"
        }, { status: 500 });
    }
}
