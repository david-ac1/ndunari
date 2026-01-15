import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { adminIntelligenceService } from "@/lib/services/admin-intelligence.service";
import { type RiskMask, type RecallNotice, type ForensicCluster } from "@/lib/gemini/sentinel-agent.service";

/**
 * GET /api/admin/stats
 * Gateway to national public health intelligence
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Verify Authentication & Role
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        // 2. Fetch Data
        const stats = await adminIntelligenceService.getGlobalStats();
        const liveFeed = await adminIntelligenceService.getLiveForensicStream(15);
        const alerts = await adminIntelligenceService.getActiveAlertClusters();

        // Optional: Fetch autonomous interventions (marathon tasks)
        const includeDirectives = request.nextUrl.searchParams.get('deep') === 'true';
        let riskMasks: RiskMask[] = [];
        let recallNotices: RecallNotice[] = [];
        let forensicClusters: ForensicCluster[] = [];

        if (includeDirectives) {
            console.log("Admin API: Triggering deep autonomous analysis...");
            [riskMasks, recallNotices, forensicClusters] = await Promise.all([
                adminIntelligenceService.getNationalRiskMasks(),
                adminIntelligenceService.getAutonomousRecallNotices(),
                adminIntelligenceService.getForensicClusters()
            ]);
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: stats,
                feed: liveFeed,
                alerts: alerts,
                riskMasks: riskMasks,
                recallNotices: recallNotices,
                forensicClusters: forensicClusters
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
