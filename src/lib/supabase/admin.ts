import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    if (typeof window === 'undefined') {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in server environment!");
    }
}

/**
 * Supabase Admin Client
 * WARNING: This client bypasses RLS. 
 * ONLY use in Server Components, API Routes, or Server Actions.
 * NEVER expose to the browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'missing', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
