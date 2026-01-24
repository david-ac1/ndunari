export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 bg-white dark:bg-black">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-forest-green/10 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="relative z-10 w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border border-white/20 shadow-2xl bg-white/80 dark:bg-black/60 backdrop-blur-xl">
                {children}
            </div>

            <div className="absolute bottom-4 text-center text-xs text-gray-400">
                <p>&copy; 2026 Ndunari Health Shield. Secured by Gemini.</p>
            </div>
        </div>
    );
}
