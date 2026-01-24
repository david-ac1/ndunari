"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Lock, Mail, User, Loader2, ArrowRight } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            // For email verification flow, we'd show a success message here
            // For now, assuming direct login or auto-confirm in dev
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-green text-white mb-2">
                    <User size={24} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-forest-green dark:text-white">
                    Initialize Protocol
                </h1>
                <p className="text-sm text-gray-500">
                    Create a new Guardian Profile to track and verify medications.
                </p>
            </div>

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 pl-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-forest-green dark:text-white"
                                placeholder="Dr. Chioma Adebayo"
                            />
                        </div>
                    </div>
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
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-forest-green py-3 text-sm font-bold text-white transition-all hover:bg-forest-green/90 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Create Profile</span>}
                    {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </button>
            </form>

            <p className="text-center text-xs text-gray-500">
                Already have an ID?{' '}
                <Link href="/login" className="font-bold text-primary hover:underline">
                    Access System
                </Link>
            </p>
        </div>
    );
}
