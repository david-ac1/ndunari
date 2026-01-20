import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DirectiveRequestSchema, validateRequest } from "@/lib/validation/schemas";

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

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        // 2. Validate Request Body
        const body = await request.json();
        const validation = validateRequest(DirectiveRequestSchema, body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        const { type, title, description, severity, affectedDrugs, regions } = validation.data;

        // 3. Insert Alert to database
        const { data, error } = await supabase
            .from('counterfeit_alerts')
            .insert({
                drug_name: affectedDrugs?.[0] || title,
                region: regions?.[0] || 'National',
                severity: severity,
                batch_number: 'ALL',
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
            message: `National Directive Issued: ${title}`
        });
    } catch (error) {
        console.error("Admin Directive Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to issue national directive" },
            { status: 500 }
        );
    }
}
