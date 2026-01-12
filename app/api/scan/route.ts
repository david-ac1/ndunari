import { NextRequest, NextResponse } from "next/server";
import { tieredRoutingService } from "@/lib/gemini/tiered-routing.service";

/**
 * POST /api/scan
 * Drug package scanning endpoint
 * 
 * Accepts: multipart/form-data with image file OR JSON with base64 image
 * Returns: Forensic analysis + optional stewardship assessment
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type");

        let imageData: string | Buffer;

        // Handle multipart/form-data (file upload)
        if (contentType?.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("image") as File;

            if (!file) {
                return NextResponse.json(
                    { error: "No image file provided" },
                    { status: 400 }
                );
            }

            const bytes = await file.arrayBuffer();
            imageData = Buffer.from(bytes);
        }
        // Handle JSON (base64 image)
        else {
            const body = await request.json();
            imageData = body.image;

            if (!imageData) {
                return NextResponse.json(
                    { error: "No image data provided" },
                    { status: 400 }
                );
            }
        }

        // Run tiered analysis (Flash → Thinking if needed)
        const result = await tieredRoutingService.analyzeDrugPackage(imageData);

        // Log telemetry data (de-identified)
        console.log("Scan completed:", {
            timestamp: new Date().toISOString(),
            escalated: result.escalated,
            cost: result.costEstimate,
            processingTime: result.processingTime,
            riskLevel: result.forensic.riskLevel,
            awareCategory: result.stewardship?.awareCategory,
        });

        return NextResponse.json(
            {
                success: true,
                data: result,
                message: result.escalated
                    ? "Deep analysis completed (Thinking mode)"
                    : "Standard scan completed (Flash mode)",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Scan API error:", error);

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
 * GET /api/scan
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: "operational",
        service: "Ndunari Drug Scanner",
        models: {
            forensicEye: "gemini-2.0-flash-exp",
            stewardshipBrain: "gemini-2.0-flash-thinking-exp-1219",
        },
        features: {
            tieredRouting: true,
            highResolutionVision: true,
            temperature: 1.0,
        },
    });
}
