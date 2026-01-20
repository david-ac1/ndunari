'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * Ensures a user session exists. 
 * If no session, signs in anonymously (persisting the user identity).
 */
export async function ensureSession() {
    const supabase = await createClient();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (session) {
        return { userId: session.user.id, isNew: false };
    }

    // No session found, create anonymous user
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
        console.error("Anonymous Auth Failed:", authError);
        // Fallback: If anonymous auth fails (e.g., config issue), return null or throw
        // For resilience, we might return a temporary ID, but usually we want to fail hard on auth
        throw new Error("Failed to initialize secure session");
    }

    return { userId: authData.user?.id, isNew: true };
}
