import { NextRequest, NextResponse } from "next/server";
import { stewardshipBrainService } from "@/lib/gemini/stewardship-brain.service";

/**
 * POST /api/prescription
 * Prescription analysis endpoint
 * 
 * Accepts: JSON with drug name and optional indication
 * Returns: WHO AWaRe classification + multilingual counseling
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { drugName, indication } = body;

        if (!drugName) {
            return NextResponse.json(
                { error: "Drug name is required" },
                { status: 400 }
            );
        }

        // Analyze prescription using Stewardship Brain
        const assessment = await stewardshipBrainService.analyzePrescription(
            drugName,
            indication
        );

        // Log telemetry (de-identified)
        console.log("Prescription analyzed:", {
            timestamp: new Date().toISOString(),
            awareCategory: assessment.awareCategory,
            riskLevel: assessment.riskLevel,
            warningCount: assessment.warningFlags.length,
        });

        return NextResponse.json(
            {
                success: true,
                data: assessment,
                message: "Prescription analysis completed",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Prescription API error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/prescription
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: "operational",
        service: "Ndunari Prescription Analyzer",
        model: "gemini-3-pro-preview",
        features: {
            whoAwareClassification: true,
            multilingualCounseling: true,
            nigerianAmrContext: true,
        },
        languages: ["English", "Nigerian Pidgin", "Yoruba", "Hausa", "Igbo"],
    });
}
