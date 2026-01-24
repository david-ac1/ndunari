"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-2">
                    <Lock size={24} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-forest-green dark:text-white">
                    Access System
                </h1>
                <p className="text-sm text-gray-500">
                    Secure login for authorized personnel and guardians.
                </p>
            </div>

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 pl-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-forest-green dark:text-white"
                                placeholder="name@ndunari.org"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 pl-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-forest-green dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Sign In</span>}
                    {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-black px-2 text-gray-500">Or continue with</span>
                </div>
            </div>

            <button
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-3 text-sm font-medium transition-all hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200"
            >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                    <path
                        d="M12.0003 20.45c4.656 0 8.544-3.216 9.984-7.68h-9.984v-4.08h14.256c.144.72.24 1.44.24 2.208 0 6.96-4.608 12.48-11.52 12.48-6.624 0-12-5.376-12-12s5.376-12 12-12c3.264 0 6.192 1.2 8.448 3.168l-3.36 3.168c-1.392-1.056-2.928-1.536-5.088-1.536-4.32 0-7.92 3.6-7.92 7.92s3.6 7.92 7.92 7.92z"
                        fill="currentColor"
                    />
                </svg>
                Google Account
            </button>

            <p className="text-center text-xs text-gray-500">
                Don't have an ID?{' '}
                <Link href="/signup" className="font-bold text-primary hover:underline">
                    Initialize Protocol
                </Link>
            </p>
        </div>
    );
}
