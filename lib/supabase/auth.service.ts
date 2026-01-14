import { supabase } from './client';

/**
 * Authentication Service
 * Handles user sign-in, sign-up, and session management
 */

/**
 * Sign in anonymously (no registration required)
 * Creates a temporary user account
 */
export async function signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
        console.error('Anonymous sign-in error:', error);
        return { user: null, error };
    }

    return { user: data.user, error: null };
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName || 'Health Guardian',
            },
        },
    });

    if (error) {
        console.error('Sign-up error:', error);
        return { user: null, error };
    }

    return { user: data.user, error: null };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Sign-in error:', error);
        return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
}

/**
 * Sign out current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Sign-out error:', error);
        return { error };
    }

    return { error: null };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Get user error:', error);
        return { user: null, error };
    }

    return { user, error: null };
}

/**
 * Get current session
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Get session error:', error);
        return { session: null, error };
    }

    return { session, error: null };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

/**
 * Convert anonymous user to permanent account
 */
export async function upgradeAnonymousUser(email: string, password: string) {
    const { data, error } = await supabase.auth.updateUser({
        email,
        password,
    });

    if (error) {
        console.error('Upgrade user error:', error);
        return { user: null, error };
    }

    return { user: data.user, error: null };
}
