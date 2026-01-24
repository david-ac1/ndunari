"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { useScanData } from "@/lib/contexts/ScanDataContext";
import { supabase } from "@/lib/supabase/client";
import { Loader2, User, Save, Upload, Camera, Globe, Power, CheckCircle, ShieldAlert, Shield } from "lucide-react";

const LANGUAGES = [
    { code: 'en', name: 'English (Default)' },
    { code: 'ha', name: 'Hausa (Harshen Hausa)' },
    { code: 'ig', name: 'Igbo (Asụsụ Igbo)' },
    { code: 'yo', name: 'Yoruba (Èdè Yorùbá)' },
    { code: 'pcm', name: 'Nigerian Pidgin' }
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, profile, refreshProfile, loading: authLoading, signOut } = useAuth();
    const { scans, refreshScans } = useScanData();

    // Form Stats
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [language, setLanguage] = useState("en");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // UX States
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Data
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || "");
            setBio(profile.bio || "");
            setLanguage(profile.preferred_language || "en");
            setAvatarUrl(profile.avatar_url || null);
        }
    }, [profile]);

    // Auth Check
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    // Stats Calculation
    // Logic: Score = (Safe Scans / Total Scans) * 100
    // Bonus: +10% if Verified User (which they are)
    const totalScans = scans.length;
    const safeScans = scans.filter(s => s.risk_level === 'safe').length;
    const blockedScans = totalScans - safeScans;

    let rawScore = totalScans > 0 ? (safeScans / totalScans) * 100 : 100; // Start at 100
    const healthScore = Math.min(Math.round(rawScore), 100);

    // Handlers
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // 3. Auto-save profile with new avatar
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            await refreshProfile();
            setMessage({ type: 'success', text: "Avatar updated successfully." });

        } catch (error: any) {
            setMessage({ type: 'error', text: "Upload failed: " + error.message });
        } finally {
            setUploading(false);
        }
    };

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
                    preferred_language: language,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            setMessage({ type: 'success', text: "Profile settings saved." });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 md:p-12 font-sans text-forest-green dark:text-white">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* 1. Header Card (Solid Green Gradient) */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-forest-green to-primary text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-white/20 bg-white/10 overflow-hidden shadow-inner flex-shrink-0">
                                {avatarUrl ? (
                                    <Image src={avatarUrl} alt="User" fill className="object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-white/50">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>

                            {/* Upload Overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full cursor-pointer"
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{displayName || "Guardian"}</h1>
                            <p className="text-white/70 font-medium text-sm md:text-base">{user.email}</p>
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest border border-white/10">
                                <ShieldAlert size={12} /> {profile?.role || "User"} Access
                            </div>
                        </div>
                    </div>

                    {/* Health Score Component */}
                    <div className="text-right flex flex-col items-center md:items-end">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">Health Integrity Score</div>
                        <div className="text-5xl md:text-6xl font-black text-white drop-shadow-sm">
                            {healthScore}%
                        </div>
                    </div>

                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                </div>

                {/* 2. Stats Row (Dark/Solid Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/5 text-center flex flex-col items-center justify-center gap-2 shadow-lg">
                        <div className="text-3xl font-black text-primary">{totalScans}</div>
                        <div className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Total Scans</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/5 text-center flex flex-col items-center justify-center gap-2 shadow-lg">
                        <div className="text-3xl font-black text-access-green">{safeScans}</div>
                        <div className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Safe Products</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/5 text-center flex flex-col items-center justify-center gap-2 shadow-lg">
                        <div className="text-3xl font-black text-reserve-red">{blockedScans}</div>
                        <div className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Blocked Threats</div>
                    </div>
                </div>

                {/* 3. Main Content: Settings & History */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Settings Panel (Solid Dark) */}
                    <div className="lg:col-span-2 p-8 rounded-3xl bg-[#0F172A] border border-white/5 shadow-xl">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-8">
                            <span className="p-2 rounded-lg bg-primary/10 text-primary"><User size={20} /></span>
                            Public Profile Settings
                        </h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Dr. Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Preferred Language</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full p-4 pl-12 rounded-xl bg-black/30 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code} className="bg-[#0F172A]">{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Guardian Bio</label>
                                <textarea
                                    rows={4}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                    placeholder="Share your commitment to medication safety..."
                                />
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-access-green/10 text-access-green border border-access-green/20' : 'bg-reserve-red/10 text-reserve-red border border-reserve-red/20'}`}>
                                    {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Power size={16} /> Sign Out
                                </button>

                                {profile?.role === 'admin' && (
                                    <button
                                        type="button"
                                        onClick={() => router.push('/admin/dashboard')}
                                        className="px-6 py-3 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm border border-primary/20"
                                    >
                                        <Shield size={16} /> Enterprise Intelligence
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* History Panel (Solid Dark) */}
                    <div className="p-8 rounded-3xl bg-[#0F172A] border border-white/5 shadow-xl h-fit">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recent Protection Log</h2>
                            <button onClick={() => router.push('/history')} className="text-primary text-xs font-bold hover:underline">View All</button>
                        </div>

                        <div className="space-y-4">
                            {scans.length === 0 ? (
                                <p className="text-sm text-gray-600 italic py-4 text-center border border-dashed border-white/5 rounded-xl">No history recorded yet.</p>
                            ) : (
                                scans.slice(0, 5).map(scan => (
                                    <div key={scan.id} className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                                        <div className={`h-2 w-2 rounded-full ${scan.risk_level === 'safe' ? 'bg-access-green shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-reserve-red shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{scan.drug_name}</p>
                                            <p className="textxs text-gray-500">{new Date(scan.created_at).toLocaleDateString()}</p>
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

// Helper for UI consistency
function ActionButton({ icon: Icon, label, onClick, variant = 'primary' }: any) {
    return (
        <button></button>
    )
}
