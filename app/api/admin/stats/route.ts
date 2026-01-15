import { NextResponse } from "next/server";
import { adminIntelligenceService } from "@/lib/services/admin-intelligence.service";

/**
 * GET /api/admin/stats
 * Gateway to national public health intelligence
 */
export async function GET() {
    try {
        const stats = await adminIntelligenceService.getGlobalStats();
        const liveFeed = await adminIntelligenceService.getLiveForensicStream(15);
        const alerts = await adminIntelligenceService.getActiveAlertClusters();

        return NextResponse.json({
            success: true,
            data: {
                summary: stats,
                feed: liveFeed,
                alerts: alerts
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch national intelligence" },
            { status: 500 }
        );
    }
}
