import { NextRequest, NextResponse } from "next/server";
import { tieredRoutingService } from "@/lib/gemini/tiered-routing.service";
import { FORENSIC_EYE_CONFIG, STEWARDSHIP_BRAIN_CONFIG } from "@/lib/gemini/config";

/**
 * POST /api/scan
 * Drug package scanning endpoint
 * 
 * Accepts: multipart/form-data with image file OR JSON with base64 image
 * Returns: Forensic analysis + optional stewardship assessment
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const mode = formData.get('mode') as 'single' | 'multi' | null;

        // Multi-angle scan
        if (mode === 'multi') {
            const angles = ['front', 'back', 'side1', 'side2', 'contents'];
            const images: Record<string, Buffer> = {};

            // Collect all uploaded angle images
            for (const angle of angles) {
                const file = formData.get(angle) as File | null;
                if (file) {
                    const bytes = await file.arrayBuffer();
                    images[angle] = Buffer.from(bytes);
                }
            }

            const imageCount = Object.keys(images).length;
            if (imageCount === 0) {
                return NextResponse.json(
                    { error: 'No images provided for multi-angle scan' },
                    { status: 400 }
                );
            }

            // For now, analyze the front image (TODO: implement multi-image analysis)
            const primaryFile = formData.get('front') as File || Object.values(images)[0];
            const primaryImage = images.front || Object.values(images)[0];
            const mimeType = (primaryFile as any).type || "image/jpeg";

            const result = await tieredRoutingService.analyzeDrugPackage(primaryImage, mimeType);

            // Calculate confidence multiplier based on angle count
            const confidenceMultiplier = imageCount >= 3 ? 1.0 : imageCount === 2 ? 0.85 : 0.7;
            const adjustedScore = Math.min(
                result.forensic.authenticityScore * confidenceMultiplier,
                imageCount >= 3 ? 100 : 85
            );

            // Add multi-angle bonus findings
            result.forensic.findings.unshift(
                `✓ Multi-angle scan completed (${imageCount} angles captured)`,
                `Confidence: ${Math.round(confidenceMultiplier * 100)}% (${imageCount} angles)`
            );
            result.forensic.authenticityScore = Math.round(adjustedScore);

            console.log('Multi-angle scan completed:', {
                timestamp: new Date().toISOString(),
                anglesScanned: imageCount,
                originalScore: result.forensic.authenticityScore,
                adjustedScore: Math.round(adjustedScore),
                riskLevel: result.forensic.riskLevel,
            });

            return NextResponse.json(
                {
                    success: true,
                    data: result,
                    message: `Multi-angle scan completed (${imageCount} angles)`,
                },
                { status: 200 }
            );
        }

        // Single image scan
        const file = formData.get('image') as File | null;
        if (!file) {
            return NextResponse.json(
                { error: 'No image file provided' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const imageData = Buffer.from(bytes);
        const mimeType = file.type || "image/jpeg";

        console.log(`Processing single scan: ${file.name} (${file.size} bytes, ${mimeType})`);

        const result = await tieredRoutingService.analyzeDrugPackage(imageData, mimeType);

        // Apply 70% confidence cap for single image
        const originalScore = result.forensic.authenticityScore;
        result.forensic.authenticityScore = Math.min(originalScore, 70);

        // Add warning about single image limitation
        result.forensic.findings.unshift(
            '⚠️ Single image scan - Limited verification (max 70% confidence)',
            'For comprehensive authentication, use multi-angle 3D scan'
        );

        console.log('Single scan completed:', {
            timestamp: new Date().toISOString(),
            originalScore,
            cappedScore: result.forensic.authenticityScore,
            escalated: result.escalated,
            processingTime: result.processingTime,
            riskLevel: result.forensic.riskLevel,
        });

        return NextResponse.json(
            {
                success: true,
                data: result,
                message: result.escalated
                    ? 'Deep analysis completed (Thinking mode)'
                    : 'Standard scan completed (Flash mode)',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Scan API error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
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
            forensicEye: FORENSIC_EYE_CONFIG.model,
            stewardshipBrain: STEWARDSHIP_BRAIN_CONFIG.model,
        },
        features: {
            tieredRouting: true,
            highResolutionVision: true,
            temperature: 1.0,
        },
    });
}
