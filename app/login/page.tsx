"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { signInWithEmail, signUpWithEmail, signInWithOAuth } from "@/lib/supabase/auth.service";


export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") || "/";

    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If already logged in with email, redirect
        if (user && !user.is_anonymous) {
            router.push(redirectTo);
        }
    }, [user, router, redirectTo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error: signUpErr } = await signUpWithEmail(email, password, displayName);
                if (signUpErr) throw signUpErr;
                // Sign up success often logs in automatically depending on config
            } else {
                const { error: signInErr } = await signInWithEmail(email, password);
                if (signInErr) throw signInErr;
            }
            router.push(redirectTo);
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        setAuthLoading(true);
        setError(null);
        try {
            const { error: authErr } = await signInWithOAuth(provider);
            if (authErr) throw authErr;
        } catch (err: any) {
            setError(err.message || `Failed to sign in with ${provider}`);
            setAuthLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin text-primary text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark flex flex-col justify-center py-12 px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="inline-flex items-center gap-2 mb-6 text-primary hover:text-primary-dark transition-colors">
                    <span className="text-2xl">←</span>
                    <span className="font-bold">Back to Home</span>
                </Link>
                <div className="h-20 w-20 mx-auto rounded-full bg-forest-green flex items-center justify-center mb-6">
                    <span className="text-4xl font-bold text-white">N</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white">
                    {mode === 'signin' ? 'Welcome Back' : 'Join Ndunari'}
                </h2>
                <p className="mt-2 text-sm text-white/60">
                    Protecting Nigeria's pharmaceutical integrity
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="glass-panel py-8 px-6 shadow-2xl rounded-2xl border border-white/10">
                    {/* Tabs */}
                    <div className="flex mb-8 bg-white/5 p-1 rounded-xl">
                        <button
                            onClick={() => setMode('signin')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'signin' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    required={mode === 'signup'}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Nneka Obi"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none"
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-reserve-red/10 border border-reserve-red/20 text-reserve-red text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {authLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Processing...
                                </>
                            ) : (
                                mode === 'signin' ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-background-dark text-white/40 uppercase font-bold tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSocialLogin('google')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-all"
                            >
                                <span className="text-lg">G</span>
                                <span className="text-sm">Google</span>
                            </button>
                            <button
                                onClick={() => handleSocialLogin('github')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-all"
                            >
                                <span className="text-lg">🐙</span>
                                <span className="text-sm">GitHub</span>
                            </button>
                        </div>
                    </div>


                    <div className="mt-6 flex flex-col gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-background-dark text-white/40">Or continue as guest</span>
                            </div>
                        </div>
                        <Link
                            href="/"
                            className="w-full py-3 bg-white/5 text-white/70 rounded-xl font-bold hover:bg-white/10 transition-all text-center border border-white/5"
                        >
                            Stay Anonymous
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
