import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * POST /api/admin/directive
 * Admin only: Issue national public health alert
 */
export async function POST(request: Request) {
    try {
        // 1. Verify Authentication & Role
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        const { data: { user } } = await supabase.auth.getUser(token);

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

        // 2. Extract Alert Data
        const { drugName, region, severity, batchNumber } = await request.json();

        if (!drugName) {
            return NextResponse.json({ error: "Drug name is required" }, { status: 400 });
        }

        // 3. Insert Alert
        const { data, error } = await supabase
            .from('counterfeit_alerts')
            .insert({
                drug_name: drugName,
                region: region || 'National',
                severity: severity || 'high',
                batch_number: batchNumber || 'ALL',
                status: 'active',
                first_reported: new Date().toISOString(),
                last_reported: new Date().toISOString(),
                report_count: 5 // Initial simulated impact
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: `National Directive Issued for ${drugName}`
        });
    } catch (error) {
        console.error("Admin Directive Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to issue national directive" },
            { status: 500 }
        );
    }
}
