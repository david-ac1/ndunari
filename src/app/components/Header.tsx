"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell, Shield, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/app/components/providers/AuthProvider";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { useState } from "react";

export default function Header() {
    const { user, profile, signOut } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const displayName = profile?.display_name || user?.email?.split('@')[0] || "Guest";

    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-20 py-4 transition-all duration-300">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between">
                {/* Left: Brand */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-10 w-28 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Image
                                src="/logo.png"
                                alt="Ndunari"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-sm font-bold text-primary">Dashboard</Link>
                        <Link href="/history" className="text-sm font-medium text-gray-500 hover:text-forest-green dark:text-gray-400 dark:hover:text-white transition-colors">Safety Logs</Link>
                        <Link href="/drugs" className="text-sm font-medium text-gray-500 hover:text-forest-green dark:text-gray-400 dark:hover:text-white transition-colors">Medications</Link>
                        <Link href="/prescription" className="text-sm font-medium text-gray-500 hover:text-forest-green dark:text-gray-400 dark:hover:text-white transition-colors">Stewardship</Link>
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {!user ? (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-bold text-gray-500 hover:text-forest-green dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="px-5 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
                            >
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <>
                            {/* Search Bar (Desktop) */}
                            <div className="hidden lg:flex items-center bg-white dark:bg-white/5 rounded-full px-4 py-2 border border-gray-200 dark:border-white/10 focus-within:border-primary transition-all shadow-sm">
                                <Search size={16} className="text-gray-400" />
                                <input
                                    className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-gray-400 ml-2 outline-none text-forest-green dark:text-white"
                                    placeholder="Search safety database..."
                                    type="text"
                                />
                            </div>

                            {/* Notifications */}
                            <NotificationPanel />

                            {/* Admin Link (If Applicable) */}
                            {user && profile?.role === 'admin' && (
                                <Link
                                    href="/admin/dashboard"
                                    className="hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    title="Admin Dashboard"
                                >
                                    <Shield size={20} />
                                </Link>
                            )}

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 bg-gray-100 dark:bg-white/10 relative transition-transform hover:scale-105 active:scale-95"
                                >
                                    {profile?.avatar_url ? (
                                        <Image
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                            <User size={20} />
                                        </div>
                                    )}
                                </button>

                                {isProfileOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                                                <p className="text-sm font-bold text-forest-green dark:text-white truncate">{displayName}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>

                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <User size={16} />
                                                My Profile
                                            </Link>

                                            <button
                                                onClick={async () => {
                                                    setIsProfileOpen(false);
                                                    await signOut();
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
