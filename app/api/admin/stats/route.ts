import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminIntelligenceService } from "@/lib/services/admin-intelligence.service";
import { type RiskMask, type RecallNotice, type ForensicCluster } from "@/lib/gemini/sentinel-agent.service";

/**
 * GET /api/admin/stats
 * Gateway to national public health intelligence
 */
export const dynamic = 'force-dynamic';
export const revalidate = 10; // Cache for 10 seconds only

export async function GET(request: NextRequest) {
    console.log("Admin API: GET /api/admin/stats starting...");
    try {
        // 1. Verify Authentication & Role
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        console.log("Admin API: Token Check", {
            headerExists: !!authHeader,
            tokenExists: !!token,
            tokenPrefix: token ? token.substring(0, 10) + "..." : "NONE"
        });

        const { data: { user } } = await supabase.auth.getUser(token);

        if (!user) {
            console.warn("Admin API: No user found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log("Admin API: User found", user.id);

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            console.warn("Admin API: User is not admin", { role: profile?.role });
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }
        console.log("Admin API: Role verified as admin");

        // 2. Fetch Data
        console.log("Admin API: Fetching stats and streams...");
        const stats = await adminIntelligenceService.getGlobalStats();
        console.log("Admin API: Global stats fetched");
        const liveFeed = await adminIntelligenceService.getLiveForensicStream(15);
        console.log("Admin API: Live feed fetched");
        const alerts = await adminIntelligenceService.getActiveAlertClusters();
        console.log("Admin API: Alert clusters fetched");

        // Optional: Fetch autonomous interventions (marathon tasks)
        const includeDirectives = request.nextUrl.searchParams.get('deep') === 'true';
        let riskMasks: RiskMask[] = [];
        let forensicClusters: ForensicCluster[] = [];
        let recallNotices: RecallNotice[] = [];

        if (includeDirectives) {
            console.log("Admin API: Triggering unified autonomous analysis...");
            const intelligence = await adminIntelligenceService.getDeepIntelligence();
            riskMasks = intelligence.riskMasks;
            recallNotices = intelligence.recallNotices;
            forensicClusters = intelligence.forensicClusters;
            console.log("Admin API: Deep intelligence fetched");
        }

        console.log("Admin API: Sending success response");
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
