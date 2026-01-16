"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, signInAnonymously, onAuthStateChange } from '@/lib/supabase/auth.service';
import { syncManager } from '@/lib/services/sync-manager.service';

export interface UserProfile {
    id: string;
    display_name: string;
    health_integrity_score: number;
    total_scans: number;
    total_prescriptions_analyzed: number;
    preferred_language: string;
    share_data: boolean;
    profile_image_url?: string;
    role: 'user' | 'admin';
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
                .from('user_profiles')
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
            console.error("Auth: Failed to fetch profile:", err);
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
            try {
                const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (initialSession) {
                    console.log("Auth: Found existing session:", initialSession.user.id);
                    setSession(initialSession);
                    setUser(initialSession.user);
                    const p = await fetchProfile(initialSession.user.id);
                    setProfile(p);
                } else {
                    console.log("Auth: No session found, attempting anonymous sign-in...");
                    // No session - try anonymous sign-in
                    const { user: anonUser, error: signInError } = await signInAnonymously();
                    if (signInError) {
                        console.error("Auth: Anonymous sign-in failed:", signInError.message);
                        // If it fails with "provider disabled", we know they missed Step 6
                        if (signInError.message.includes("disabled")) {
                            console.warn("TIP: Enable 'Anonymous Sign-Ins' in Supabase Auth Settings -> Providers");
                        }
                    } else if (anonUser) {
                        console.log("Auth: Anonymous sign-in successful:", anonUser.id);
                        setUser(anonUser);
                        const p = await fetchProfile(anonUser.id);
                        setProfile(p);
                    }
                }
            } catch (error: any) {
                console.error('Auth: Initialization failed:', error.message);
            } finally {
                console.log("Auth: Initialization complete, setting loading to false");
                setLoading(false);
            }
        };

        initAuth();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`Auth: Event [${event}]`);
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
                console.log("Auth: User signed out, re-initializing anonymous session...");
                // Reset states
                setLoading(true);
                // Attempt re-auth
                const { user: anonUser, error: signInError } = await signInAnonymously();
                if (anonUser) {
                    setUser(anonUser);
                    const p = await fetchProfile(anonUser.id);
                    setProfile(p);
                }
                setLoading(false);
            } else if (event === 'SIGNED_IN') {
                console.log("Auth: User signed in, triggering cloud synchronization...");
                syncManager.syncLocalToCloud().then(result => {
                    if (result.synced > 0) refreshProfile();
                });
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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
