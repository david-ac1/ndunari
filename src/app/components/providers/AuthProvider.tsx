"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { signInAnonymously, onAuthStateChange } from '@/lib/supabase/auth.service'; // Keep existing auth functions
import { syncManager } from '@/lib/services/sync-manager.service';
import { normalizeError, logError } from '@/lib/errors/app-errors'; // Add error utilities

export interface UserProfile {
    id: string;
    display_name: string;
    avatar_url?: string;
    role: 'user' | 'admin' | 'pharmacist' | 'dev';
    bio?: string;
    preferred_language?: string;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: (manualProfile?: UserProfile | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    const fetchProfile = async (userId: string) => {
        console.log("Auth: Fetching profile for", userId);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn("Auth: Error fetching profile:", error.message);
                return null;
            }
            console.log("Auth: Profile fetched successfully", { role: data?.role });
            return data as UserProfile;
        } catch (err) {
            const normalizedErr = normalizeError(err);
            console.error("Auth: Failed to fetch profile:", normalizedErr);
            logError(normalizedErr, 'AuthProvider.fetchProfile');
            return null;
        }
    };

    const refreshProfile = async (manualProfile?: UserProfile | null) => {
        if (manualProfile !== undefined) {
            setProfile(manualProfile);
            return;
        }

        if (user) {
            const p = await fetchProfile(user.id);
            setProfile(p);
        }
    };

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;
        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 8000; // 8 seconds

        const initAuth = async () => {
            if (!isMounted) return;

            console.log(`[Auth Init] Starting (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
            );

            try {
                await Promise.race([
                    (async () => {
                        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

                        if (!isMounted) return;

                        if (sessionError) {
                            throw sessionError;
                        }

                        if (initialSession) {
                            if (initialSession.user.is_anonymous) {
                                console.log("[Auth Init] Removing anonymous session");
                                await supabase.auth.signOut();
                                if (isMounted) {
                                    setUser(null);
                                    setProfile(null);
                                }
                            } else {
                                console.log(`[Auth Init] Session found: ${initialSession.user.email || initialSession.user.id}`);
                                if (isMounted) {
                                    setSession(initialSession);
                                    setUser(initialSession.user);
                                    const p = await fetchProfile(initialSession.user.id);
                                    setProfile(p);
                                }
                            }
                        } else {
                            console.log("[Auth Init] No session");
                            if (isMounted) {
                                setUser(null);
                                setProfile(null);
                            }
                        }
                    })(),
                    timeoutPromise
                ]);

                // Success - clear any previous errors
                if (isMounted) {
                    setAuthError(null);
                    console.log("[Auth Init] ✓ Complete");
                }
            } catch (error) {
                if (!isMounted) return;

                const errorMessage = error instanceof Error ? error.message : String(error);
                const isTimeout = errorMessage === 'timeout';
                const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');

                // Retry logic for transient errors
                if ((isTimeout || isNetworkError) && retryCount < MAX_RETRIES) {
                    retryCount++;
                    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Exponential backoff
                    console.warn(`[Auth Init] Transient error, retrying in ${backoffDelay}ms...`, errorMessage);
                    setTimeout(() => initAuth(), backoffDelay);
                    return;
                }

                // Final failure - log appropriately
                if (isTimeout || isNetworkError) {
                    console.warn(`[Auth Init] Network issue after ${retryCount + 1} attempts - continuing in offline mode`);
                    setAuthError('offline');
                } else {
                    // Critical error
                    console.error('[Auth Init] Critical failure:', error);
                    const err = normalizeError(error);
                    logError(err, 'AuthProvider.initAuth');
                    setAuthError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`Auth: Event[${event}]`);
            setSession(currentSession);
            const newUser = currentSession?.user ?? null;
            setUser(newUser);

            if (newUser) {
                const p = await fetchProfile(newUser.id);
                setProfile(p);
            } else {
                setProfile(null);
            }

            if (event === 'SIGNED_OUT') {
                console.log("Auth: User signed out.");
                setUser(null);
                setSession(null);
                setProfile(null);
            } else if (event === 'SIGNED_IN') {
                console.log("Auth: User signed in, triggering cloud synchronization...");
                syncManager.syncLocalToCloud().then(result => {
                    if (result.synced > 0) refreshProfile();
                });
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []); // Run ONCE on mount - prevents infinite loop

    // Separate effect for real-time profile subscription
    useEffect(() => {
        if (!user?.id) return;

        console.log("Auth: Setting up real-time profile listener for", user.id);
        const profileSubscription = supabase
            .channel(`profile:${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`
            }, (payload) => {
                console.log("Auth: Real-time profile update detected", payload.new);
                setProfile(payload.new as UserProfile);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(profileSubscription);
        };
    }, [user?.id]); // Only re-run when user ID actually changes

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
