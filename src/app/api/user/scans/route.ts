
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase/client";

/**
 * GET /api/user/scans
 * 
 * Fetches scans for the authenticated user using the Service Role Key.
 * This bypasses RLS policies that might be failing due to cookie/session issues on the client.
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate User (Standard Auth)
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        // Try getting user from Auth Header first
        let userId: string | null = null;

        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (user) userId = user.id;
        }

        // If no token, try cookies (Next.js way)
        if (!userId) {
            const { cookies } = await import('next/headers');
            const { createServerClient } = await import('@supabase/ssr');
            const cookieStore = await cookies();

            const supabaseServer = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll: () => cookieStore.getAll(),
                    },
                }
            );
            const { data: { user } } = await supabaseServer.auth.getUser();
            if (user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch Scans using Admin Client (Bypass RLS)
        // We manually enforce the user_id filter here
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

        const { data, error } = await supabaseAdmin
            .from('scans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[API] Error fetching scans:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('[API] Fatal error in /api/user/scans:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
