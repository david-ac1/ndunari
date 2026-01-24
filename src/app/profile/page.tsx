"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { useScanData } from "@/lib/contexts/ScanDataContext";
import { supabase } from "@/lib/supabase/client";
import { Loader2, User, Save, Camera, Globe, Power, Shield, CheckCircle2, AlertOctagon, LayoutDashboard, History, Settings } from "lucide-react";

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
    const { scans } = useScanData();

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
    const totalScans = scans.length;
    const safeScans = scans.filter(s => s.risk_level === 'safe').length;
    const healthScore = totalScans > 0 ? Math.round((safeScans / totalScans) * 100) : 100;

    // Handlers
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !user) return;
        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(publicUrl);
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            await refreshProfile();
            setMessage({ type: 'success', text: "Avatar updated" });
        } catch (error: any) {
            setMessage({ type: 'error', text: "Upload failed" });
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
            const { error } = await supabase.from('profiles').update({
                display_name: displayName, bio: bio, preferred_language: language, updated_at: new Date().toISOString()
            }).eq('id', user.id);
            if (error) throw error;
            await refreshProfile();
            setMessage({ type: 'success', text: "Profile settings saved" });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-forest-green dark:text-gray-200 font-sans p-6 md:p-8 selection:bg-primary/20">
            <div className="max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)]">

                {/* Header Section */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-forest-green dark:text-white tracking-tight">Guardian Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your identity and monitor surveillance integrity.</p>
                    </div>
                </header>

                {/* BENTO GRID LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* COL 1: SETTINGS & IDENTITY (Span 4) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Identity Card */}
                        <div className="group relative rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="relative mb-4">
                                    <div className="h-32 w-32 rounded-full border-2 border-primary/10 p-1 bg-white dark:bg-[#1A1A1A] shadow-lg">
                                        <div className="relative h-full w-full rounded-full overflow-hidden bg-gray-100 dark:bg-[#242424]">
                                            {avatarUrl ? <Image src={avatarUrl} alt="User" fill className="object-cover" /> : <User className="h-full w-full p-6 text-gray-400" />}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 p-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg"
                                        disabled={uploading}
                                    >
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </div>
                                <h2 className="text-2xl font-bold text-forest-green dark:text-white mb-1">{displayName || "Guardian"}</h2>
                                <p className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-primary/20">
                                    {profile?.role || "User"} Account
                                </p>
                            </div>
                        </div>

                        {/* Settings Form Card */}
                        <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Settings size={16} /> Preferences
                            </h3>
                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Language</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-3.5 text-gray-500" size={16} />
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none transition-all"
                                        >
                                            {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Bio</label>
                                    <textarea
                                        rows={3}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-gray-400"
                                        placeholder="Your mission..."
                                    />
                                </div>

                                {message && (
                                    <div className={`text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                                        {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertOctagon size={14} />} {message.text}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    {profile?.role === 'admin' && (
                                        <button
                                            type="button"
                                            onClick={() => router.push('/admin/dashboard')}
                                            className="col-span-2 flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-xl py-3 text-sm font-bold hover:bg-primary/20 transition-all"
                                        >
                                            <Shield size={16} /> Enterprise Panel
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={async () => { await signOut(); router.push('/login'); }}
                                        className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl py-3 text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 dark:hover:text-white transition-all"
                                    >
                                        <Power size={16} /> Sign Out
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* COL 2: HEALTH SCORE (Span 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="flex-1 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
                            {/* Circular Gauge */}
                            <div className="relative w-64 h-64 mb-6">
                                <svg className="transform -rotate-90 w-full h-full">
                                    {/* Track */}
                                    <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-[#2a2a2a]" />
                                    {/* Progress */}
                                    <circle
                                        cx="128" cy="128" r="120"
                                        stroke="currentColor" strokeWidth="12" fill="transparent"
                                        strokeDasharray={2 * Math.PI * 120}
                                        strokeDashoffset={(2 * Math.PI * 120) * (1 - healthScore / 100)}
                                        strokeLinecap="round"
                                        className={`text-primary transition-all duration-1000 ease-out ${healthScore < 50 ? 'text-red-500' : healthScore < 80 ? 'text-orange-500' : 'text-primary'}`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-6xl font-black text-forest-green dark:text-white">{healthScore}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2">Integrity Score</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="text-2xl font-bold text-forest-green dark:text-white">{totalScans}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Scans</div>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="text-2xl font-bold text-primary">{safeScans}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Safe Rate</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Card */}
                        <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 flex items-center justify-between shadow-sm">
                            <div>
                                <h3 className="text-sm font-bold text-forest-green dark:text-white">Active Guardian Streak</h3>
                                <p className="text-xs text-gray-500">Consecutive days monitoring</p>
                            </div>
                            <div className="text-3xl font-black text-primary">12</div>
                        </div>
                    </div>

                    {/* COL 3: LOGS SIDEBAR (Span 4) */}
                    <div className="lg:col-span-4 h-full">
                        <div className="rounded-2xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 h-full max-h-[800px] flex flex-col shadow-sm">
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <History size={16} /> Protection Log
                                </h3>
                                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                    <LayoutDashboard size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {scans.length === 0 ? (
                                    <div className="text-center py-12 text-gray-600">
                                        <History size={32} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No activity recorded</p>
                                    </div>
                                ) : (
                                    scans.map(scan => (
                                        <div key={scan.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${scan.risk_level === 'safe'
                                                        ? 'bg-green-100 text-green-700 dark:bg-primary/10 dark:text-primary'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500'
                                                    }`}>
                                                    {scan.risk_level === 'safe' ? 'Verified Safe' : 'Threat Blocked'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {new Date(scan.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-forest-green dark:group-hover:text-white transition-colors">{scan.drug_name}</h4>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{scan.id}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
