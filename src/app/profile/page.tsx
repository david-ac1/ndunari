"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { useScanData } from "@/lib/contexts/ScanDataContext";
import { supabase } from "@/lib/supabase/client"; // For updates
import { Loader2, User, Save, Shield, Clock, AlertTriangle, CheckCircle, FileText } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const { user, profile, refreshProfile, loading } = useAuth();
    const { scans } = useScanData();

    // Form State
    const [displayName, setDisplayName] = useState(profile?.display_name || "");
    const [bio, setBio] = useState(profile?.bio || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Update local state when profile loads
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || "");
            setBio(profile.bio || "");
        }
    }, [profile]);

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Stats calculation
    const totalScans = scans.length;
    const safeScans = scans.filter(s => s.risk_level === 'safe').length;
    const threatScans = totalScans - safeScans;
    const healthScore = totalScans > 0 ? Math.round((safeScans / totalScans) * 100) : 100;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    bio: bio,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            setMessage({ type: 'success', text: "Profile updated successfully." });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-background-light dark:bg-background-dark min-h-screen">
            {/* Note: Header is global in layout, but we need room for it */}
            <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-8 pb-20">

                {/* Profile Header Card */}
                <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm">
                    {/* Cover Photo Gradient */}
                    <div className="h-32 bg-gradient-to-r from-forest-green to-primary"></div>

                    <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6">
                        {/* Avatar */}
                        <div className="relative h-24 w-24 rounded-full border-4 border-white dark:border-surface-dark bg-white shadow-md overflow-hidden">
                            {profile?.avatar_url ? (
                                <Image src={profile.avatar_url} alt="You" fill className="object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <User size={40} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left mb-2">
                            <h1 className="text-2xl font-black text-forest-green dark:text-white">{displayName || "Guardian"}</h1>
                            <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                        </div>

                        <div className="flex flex-col items-center md:items-end">
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Health Integrity Score</div>
                            <div className={`text-4xl font-black ${healthScore >= 90 ? 'text-access-green' : healthScore >= 70 ? 'text-watch-orange' : 'text-reserve-red'}`}>
                                {healthScore}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Form */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 text-center">
                                <div className="text-2xl font-black text-primary">{totalScans}</div>
                                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Total Scans</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 text-center">
                                <div className="text-2xl font-black text-access-green">{safeScans}</div>
                                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Safe</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 text-center">
                                <div className="text-2xl font-black text-reserve-red">{threatScans}</div>
                                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Blocked</div>
                            </div>
                        </div>

                        {/* Edit Profile Form */}
                        <section className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm">
                            <h2 className="text-lg font-bold text-forest-green dark:text-white flex items-center gap-2 mb-6">
                                <SettingsIcon size={20} className="text-primary" />
                                Public Profile Settings
                            </h2>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-forest-green dark:text-white focus:border-primary outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Guardian Bio</label>
                                    <textarea
                                        rows={3}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Share your commitment to medication safety..."
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-forest-green dark:text-white focus:border-primary outline-none transition-colors"
                                    />
                                </div>

                                {message && (
                                    <div className={`p-3 rounded-lg text-xs font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50 transition-all"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>

                    {/* Right Column: Recent History (Mini) */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Recent Protection Log</h3>
                        <div className="space-y-3">
                            {scans.length === 0 ? (
                                <p className="text-sm text-gray-500 italic px-2">No history recorded yet.</p>
                            ) : (
                                scans.slice(0, 5).map(scan => (
                                    <div key={scan.id} className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 flex items-start gap-3">
                                        <div className={`mt-0.5 ${scan.risk_level === 'safe' ? 'text-access-green' : 'text-reserve-red'}`}>
                                            {scan.risk_level === 'safe' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-forest-green dark:text-white truncate">{scan.drug_name}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                <Clock size={10} /> {new Date(scan.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon helper
function SettingsIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )
}
