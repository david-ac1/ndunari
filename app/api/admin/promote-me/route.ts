import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/promote-me
 * TEMPORARY: Promote the current user to Admin for demo access
 */
export async function GET() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No authenticated user found. Please sign in first." }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update({ role: 'admin' })
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `User ${data.display_name} has been promoted to Admin.`,
            instruction: "You can now access the dashboard at /admin"
        });
    } catch (error) {
        console.error("Promotion Error:", error);
        return NextResponse.json({ error: "Failed to promote user" }, { status: 500 });
    }
}
