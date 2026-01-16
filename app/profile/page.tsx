"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { upgradeAnonymousUser, signOut } from "@/lib/supabase/auth.service";
import { getScanStats } from "@/lib/services/scan-storage.service";
import { getPrescriptionStats } from "@/lib/services/prescription-storage.service";

import { useAuth, type UserProfile } from "@/app/components/providers/AuthProvider";

export default function ProfilePage() {
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        scans: { total: 0, safe: 0 },
        prescriptions: { total: 0, access: 0 }
    });
    const [upgrading, setUpgrading] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Edit Form State
    const [editName, setEditName] = useState("");
    const [editLanguage, setEditLanguage] = useState("english");
    const [editShareData, setEditShareData] = useState(true);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchStats();

            // 1. REHYDRATION ON FOCUS
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    console.log("Profile: Visibility restored. Re-syncing stats...");
                    fetchStats();
                    refreshProfile();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);

            // 2. REAL-TIME PROFILE STATS LISTENER
            const profileSub = supabase
                .channel(`profile_stats:${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_profiles',
                    filter: `id=eq.${user.id}`
                }, (payload) => {
                    console.log("Profile: Real-time stat update detected", payload.new);
                    fetchStats(); // Refresh local calculated stats
                    refreshProfile(payload.new as UserProfile); // Update global context
                })
                .subscribe();

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                supabase.removeChannel(profileSub);
            };
        }
    }, [user, refreshProfile]);

    // Initial form sync
    useEffect(() => {
        if (profile) {
            setEditName(profile.display_name || "");
            setEditLanguage(profile.preferred_language || "english");
            setEditShareData(profile.share_data !== false);
        }
    }, [profile]);

    const fetchStats = async () => {
        const scanStats = await getScanStats();
        const prescriptionStats = await getPrescriptionStats();
        setStats({
            scans: { total: scanStats.total, safe: scanStats.safe },
            prescriptions: { total: prescriptionStats.total, access: prescriptionStats.access }
        });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setUpdating(true);
        setMessage(null);

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    display_name: editName,
                    preferred_language: editLanguage,
                    share_data: editShareData,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else if (data) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Pass the new data directly to refresh the global state instantly
                await refreshProfile(data);
            }
        } catch (err: any) {
            console.error("Profile: Save failed:", err);
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
        } finally {
            setUpdating(false);
        }
    };

    const handleUpgrade = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpgrading(true);
        setMessage(null);

        const { error } = await upgradeAnonymousUser(email, password);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Account upgraded successfully! You can now sign in with your email.' });
            await refreshProfile();
        }
        setUpgrading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin text-primary text-4xl">⏳</div>
            </div>
        );
    }

    if (!user) return null; // Redirection handled in useEffect

    const isAnonymous = user.is_anonymous;

    return (
        <div className="min-h-screen bg-background-dark">
            <header className="sticky top-0 z-20 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
                        <span className="text-2xl">←</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Your Profile</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Profile Overview */}
                <section className="glass-panel p-8 rounded-2xl border border-white/10 mb-8 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl border-2 border-primary/30">
                            👤
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {profile?.display_name || 'Health Guardian'}
                            </h2>
                            <p className="text-white/60 text-sm mb-4">
                                {isAnonymous ? 'Anonymous Account' : user.email}
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-access-green/20 border border-access-green/30 rounded-lg text-access-green">
                                <span className="font-bold">Health Integrity Score:</span>
                                <span className="text-xl">{profile?.health_integrity_score || 0}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Admin Controls (if admin) */}
                {profile?.role === 'admin' && (
                    <section className="glass-panel p-8 rounded-2xl border border-primary/20 bg-primary/5 mb-8 relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mb-10" />
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                🛡️ National Administrator Access
                            </h3>
                            <p className="text-white/60 mb-6 text-sm">
                                You have elevated clearance. Access the National Intelligence Center to monitor regional counterfeit patterns and surveillance directives.
                            </p>
                            <Link
                                href="/admin"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                            >
                                Enter Intelligence Center
                            </Link>
                        </div>
                    </section>
                )}

                {/* Privacy Guard Status */}
                <section className={`glass-panel p-6 rounded-2xl border mb-8 transition-all ${editShareData ? 'border-primary/30 bg-primary/5' : 'border-access-green/30 bg-access-green/5'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${editShareData ? 'bg-primary/20 text-primary' : 'bg-access-green/20 text-access-green'}`}>
                                {editShareData ? '📡' : '🛡️'}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Privacy Guard Status</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full animate-pulse ${editShareData ? 'bg-primary' : 'bg-access-green'}`} />
                                    <p className={`text-sm font-bold uppercase tracking-wider ${editShareData ? 'text-primary' : 'text-access-green'}`}>
                                        {editShareData ? 'Contributing to Surveillance' : 'Privacy Protection Mode'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-white/40 uppercase font-bold mb-1">Current Sync</p>
                            <p className="text-sm text-white font-medium">Cloud Persistence Active</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-white/60 leading-relaxed">
                            {editShareData
                                ? "Your de-identified scan data is helping health authorities track counterfeit drug trends in your region. Personal identity is never shared."
                                : "Your scan history is available only to you. We've disabled regional surveillance contributions for your account."}
                        </p>
                    </div>
                </section>

                {/* Edit Profile Form */}
                <section className="glass-panel p-8 rounded-2xl border border-white/10 mb-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span>⚙️</span> Customize Profile
                    </h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Display Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Nneka Obi"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Preferred Language</label>
                                <select
                                    value={editLanguage}
                                    onChange={(e) => setEditLanguage(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none appearance-none"
                                >
                                    <option value="english">🇬🇧 English</option>
                                    <option value="pidgin">🇳🇬 Pidgin</option>
                                    <option value="hausa">🇳🇬 Hausa</option>
                                    <option value="yoruba">🇳🇬 Yoruba</option>
                                    <option value="igbo">🇳🇬 Igbo</option>
                                </select>
                            </div>
                        </div>

                        {/* Privacy Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-1 h-full bg-primary/30" />
                            <div className="pl-2">
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                    Public Health Data Sharing
                                    {editShareData ? (
                                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full uppercase">Enabled</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-white/10 text-white/40 text-[10px] rounded-full uppercase">Disabled</span>
                                    )}
                                </p>
                                <p className="text-xs text-white/50">Help us track counterfeit trends by sharing de-identified analytics.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditShareData(!editShareData)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editShareData ? 'bg-primary' : 'bg-white/20'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editShareData ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {updating ? 'Saving...' : 'Save All Changes'}
                            </button>
                            {message && (
                                <div className={`text-sm font-medium animate-in fade-in slide-in-from-left-2 ${message.type === 'success' ? 'text-access-green' : 'text-reserve-red'}`}>
                                    {message.type === 'success' ? '✓ ' : '× '} {message.text}
                                </div>
                            )}
                        </div>
                    </form>
                </section>

                {/* Privacy & Transparency Breakdown */}
                <section className="glass-panel p-8 rounded-2xl border border-white/10 mb-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span>🔍</span> Privacy Transparency
                    </h3>
                    <div className="space-y-6">
                        <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-2xl">👤</div>
                            <div>
                                <p className="text-sm font-bold text-white">Always Private</p>
                                <p className="text-xs text-white/50 mt-1">
                                    Your Name, Email, and exact location are <span className="text-access-green">never</span> shared with third parties or the public surveillance dashboard.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-2xl">📉</div>
                            <div>
                                <p className="text-sm font-bold text-white uppercase tracking-wider text-primary/80">Surveillance Data (If Enabled)</p>
                                <ul className="text-xs text-white/50 mt-2 space-y-2 list-disc ml-4">
                                    <li><span className="text-white/80 font-medium">Drug Name & Batch</span>: Helps identify cluster outbreaks of fakes.</li>
                                    <li><span className="text-white/80 font-medium">Risk Level</span>: Alerts nearby communities of suspicious products.</li>
                                    <li><span className="text-white/80 font-medium">Regional Trends</span>: High-level de-identified data (e.g., "5 suspicious scans in Lagos today").</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span>📷</span> Scan Statistics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">Total Scans</span>
                                <span className="text-white font-bold">{stats.scans.total}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">Verified Authenticity</span>
                                <span className="text-access-green font-bold">{stats.scans.safe} scans</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${stats.scans.total > 0 ? (stats.scans.safe / stats.scans.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span>💊</span> Stewardship Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">Prescriptions Analyzed</span>
                                <span className="text-white font-bold">{stats.prescriptions.total}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">ACCESS Decisions</span>
                                <span className="text-access-green font-bold">{stats.prescriptions.access} items</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-access-green"
                                    style={{ width: `${stats.prescriptions.total > 0 ? (stats.prescriptions.access / stats.prescriptions.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Upgrade (if anonymous) */}
                {
                    isAnonymous && (
                        <section className="glass-panel p-8 rounded-2xl border border-primary/20 mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Secure Your Account</h3>
                            <p className="text-white/70 mb-6">
                                Convert your anonymous session to a permanent account to access your history from any device.
                            </p>

                            <form onSubmit={handleUpgrade} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary outline-none"
                                        required
                                    />
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-access-green/10 text-access-green border border-access-green/20' : 'bg-reserve-red/10 text-reserve-red border border-reserve-red/20'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={upgrading}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {upgrading ? 'Upgrading...' : 'Save Account'}
                                </button>
                            </form>
                        </section>
                    )
                }

                {/* Settings & Logout */}
                <section className="flex flex-col gap-4">
                    <button
                        onClick={() => signOut()}
                        className="w-full py-4 glass-panel border border-reserve-red/20 text-reserve-red font-bold rounded-2xl hover:bg-reserve-red/5 transition-colors"
                    >
                        Sign Out
                    </button>
                </section>
            </main >
        </div >
    );
}
