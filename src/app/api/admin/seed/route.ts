import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { seedDemoData } from "@/lib/services/admin-seed.service";

/**
 * POST /api/admin/seed
 * Admin only: Inject demo data for hackathon presentation
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
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        // 2. Clear existing demo data (Optional - skipped to avoid data loss)

        // 3. Seed Data
        const result = await seedDemoData();

        return NextResponse.json({
            success: true,
            message: "National Intelligence Injection Successful",
            data: result
        });
    } catch (error) {
        console.error("Admin Seed Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to inject demo data" },
            { status: 500 }
        );
    }
}
