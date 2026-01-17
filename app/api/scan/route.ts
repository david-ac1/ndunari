import { NextRequest, NextResponse } from "next/server";
import { tieredRoutingService } from "@/lib/gemini/tiered-routing.service";
import { FORENSIC_EYE_CONFIG, STEWARDSHIP_BRAIN_CONFIG } from "@/lib/gemini/config";
import { saveScan, saveScanEvidence } from "@/lib/services/scan-storage.service";
import type { AngleImage } from "@/lib/3d/gemini-reconstruction.service";

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

        // Multi-angle 3D verification scan
        if (mode === 'multi') {
            const angles = ['front', 'back', 'left', 'right', 'top', 'bottom'];
            const images: Record<string, { buffer: Buffer; file: File }> = {};

            // Collect all uploaded angle images
            for (const angle of angles) {
                const file = formData.get(angle) as File | null;
                if (file) {
                    const bytes = await file.arrayBuffer();
                    images[angle] = {
                        buffer: Buffer.from(bytes),
                        file: file
                    };
                }
            }

            const imageCount = Object.keys(images).length;
            if (imageCount < 2) {
                return NextResponse.json(
                    { error: 'At least 2 angles required for 3D verification scan' },
                    { status: 400 }
                );
            }

            // Prepare multi-angle data for 3D reconstruction
            const multiAngleImages: AngleImage[] = Object.entries(images).map(([angle, { buffer, file }]) => ({
                angle: angle as any,
                imageData: `data:${file.type};base64,${buffer.toString('base64')}`,
                capturedAt: new Date().toISOString(),
            }));

            // Use primary (front) image for main analysis
            const primaryImage = images.front?.buffer || Object.values(images)[0].buffer;
            const primaryMimeType = images.front?.file.type || Object.values(images)[0].file.type;

            // Generate unique scan ID for 3D model storage
            const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Run forensic analysis with 3D reconstruction
            const result = await tieredRoutingService.analyzeDrugPackage(
                primaryImage,
                primaryMimeType,
                multiAngleImages,
                scanId
            );

            // Calculate confidence multiplier based on angle count
            const confidenceMultiplier = imageCount >= 4 ? 1.0 : imageCount === 3 ? 0.9 : 0.8;
            const adjustedScore = Math.min(
                result.forensic.authenticityScore * confidenceMultiplier,
                100
            );

            // Add3D verification findings
            if (result.model3D) {
                result.forensic.findings.unshift(
                    `🔬 3D model reconstruction complete (${imageCount} angles)`,
                    `Confidence: ${result.model3D.confidence}% (AI-powered depth analysis)`
                );
            } else {
                result.forensic.findings.unshift(
                    `📸 Multi-angle scan completed (${imageCount} angles captured)`
                );
            }
            result.forensic.authenticityScore = Math.round(adjustedScore);

            // Store in National Ledger with all angle images
            const userId = formData.get('userId') as string || 'anonymous';
            await saveScan({
                id: scanId,
                userId,
                timestamp: new Date().toISOString(),
                scanMode: '3d-verification',
                drugName: result.forensic.drugName,
                nafdacNumber: result.forensic.nafdacNumber,
                authenticityScore: result.forensic.authenticityScore,
                riskLevel: result.forensic.riskLevel,
                findings: result.forensic.findings,
                anglesScanned: imageCount,
                forensicAnalysis: result.forensic,
                stewardshipAssessment: result.stewardship || undefined,
                model3D: result.model3D,
            });

            // Store all angle images as evidence - convert to Map
            const evidenceMap = new Map<string, string>();
            for (const [angle, { buffer }] of Object.entries(images)) {
                evidenceMap.set(angle, buffer.toString('base64'));
            }
            await saveScanEvidence(scanId, evidenceMap);

            console.log('3D verification scan completed:', {
                scanId,
                timestamp: new Date().toISOString(),
                anglesScanned: imageCount,
                has3DModel: !!result.model3D,
                adjustedScore: Math.round(adjustedScore),
                riskLevel: result.forensic.riskLevel,
            });

            return NextResponse.json(
                {
                    success: true,
                    scanId,
                    data: result,
                    message: `3D verification scan completed (${imageCount} angles)`,
                    imagesStored: imageCount,
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
