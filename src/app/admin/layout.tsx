"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Map, Activity, LogOut } from "lucide-react";
import { signOut } from "@/lib/supabase/auth.service";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: "Command Center", href: "/admin/dashboard", icon: Map },
        { name: "Stewardship Audit", href: "/admin/audit", icon: Activity },
    ];

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl uppercase tracking-wider">
                        <Shield className="fill-current" />
                        <span>NAFDAC Grid</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">National Intelligence Access</div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? "bg-primary text-black font-bold shadow-lg shadow-primary/20"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    }`}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-zinc-500 hover:text-reserve-red transition-colors rounded-xl hover:bg-reserve-red/10"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="relative z-10 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
