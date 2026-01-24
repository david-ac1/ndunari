"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, History, ScanLine, AlertTriangle, User } from "lucide-react";

export default function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 z-50 w-full border-t border-white/10 bg-white dark:bg-background-dark py-3 pb-safe-area lg:hidden">
            <div className="mx-auto flex justify-around items-end px-4">
                {/* Home */}
                <Link
                    href="/"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive("/") ? "text-primary" : "text-gray-400 dark:text-gray-500 hover:text-forest-green dark:hover:text-white"
                        }`}
                >
                    <LayoutGrid size={24} strokeWidth={isActive("/") ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Home</span>
                </Link>

                {/* History */}
                <Link
                    href="/history"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive("/history") ? "text-primary" : "text-gray-400 dark:text-gray-500 hover:text-forest-green dark:hover:text-white"
                        }`}
                >
                    <History size={24} strokeWidth={isActive("/history") ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">History</span>
                </Link>

                {/* FAB: Scan */}
                <Link
                    href="/scan"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 -mt-8 border-4 border-white dark:border-background-dark transition-transform hover:scale-105 active:scale-95"
                >
                    <ScanLine size={28} strokeWidth={2.5} />
                </Link>

                {/* Alerts */}
                <Link
                    href="/alerts"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive("/alerts") ? "text-primary" : "text-gray-400 dark:text-gray-500 hover:text-forest-green dark:hover:text-white"
                        }`}
                >
                    <AlertTriangle size={24} strokeWidth={isActive("/alerts") ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Alerts</span>
                </Link>

                {/* Profile */}
                <Link
                    href="/profile"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive("/profile") ? "text-primary" : "text-gray-400 dark:text-gray-500 hover:text-forest-green dark:hover:text-white"
                        }`}
                >
                    <User size={24} strokeWidth={isActive("/profile") ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
