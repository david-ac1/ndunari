"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/components/providers/AuthProvider";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ['/login', '/signup', '/auth/callback'];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user && !PUBLIC_PATHS.includes(pathname)) {
                console.log("RouteGuard: Unauthenticated user on private route, redirecting to login.");
                router.push('/login');
            } else if (user && PUBLIC_PATHS.includes(pathname)) {
                // If user is already logged in and tries to access login/signup, redirect to home
                console.log("RouteGuard: Authenticated user on public route, redirecting to home.");
                router.push('/');
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    // While redirecting, show nothing or specific loader if not public path
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
