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
        // 1. Check for existing session
        const initAuth = async () => {
            console.log("Auth: Initializing...");

            // Timeout failsafe (increased to 10s)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Auth initialization timed out')), 10000)
            );

            try {
                // Race between auth check and timeout
                await Promise.race([
                    (async () => {
                        console.log("Auth: Getting session...");
                        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

                        if (sessionError) {
                            console.error("Auth: getSession error raw:", sessionError);
                            throw sessionError;
                        }

                        if (initialSession) {
                            if (initialSession.user.is_anonymous) {
                                console.log("Auth: Anonymous session detected in strict mode. Signing out...");
                                await supabase.auth.signOut();
                                setUser(null);
                                setProfile(null);
                            } else {
                                console.log("Auth: Found existing verified session:", initialSession.user.id);
                                setSession(initialSession);
                                setUser(initialSession.user);
                                const p = await fetchProfile(initialSession.user.id);
                                setProfile(p);
                            }
                        } else {
                            console.log("Auth: No session found.");
                            setUser(null);
                            setProfile(null);
                        }
                    })(),
                    timeoutPromise
                ]);
            } catch (error) {
                console.error('Auth: Initialization CRITICAL FAILURE:', error);
                const err = normalizeError(error);
                logError(err, 'AuthProvider.initAuth');
            } finally {
                console.log("Auth: Initialization complete (finally)");
                setLoading(false);
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
