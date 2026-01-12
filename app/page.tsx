import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
    return (
        <div className="relative min-h-screen flex flex-col max-w-md mx-auto overflow-hidden pb-24">
            {/* Decorative Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0" />

            {/* Header */}
            <header className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full border-2 border-white dark:border-forest-green shadow-sm overflow-hidden bg-gray-100 relative flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">N</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Welcome back,</p>
                        <h1 className="text-xl font-bold leading-tight">User</h1>
                    </div>
                </div>
                <button className="glass-panel h-10 w-10 flex items-center justify-center rounded-full shadow-sm hover:scale-105 transition-transform">
                    <span className="text-xl">🔔</span>
                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-warning-amber border border-white" />
                </button>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col px-6 gap-6 overflow-y-auto no-scrollbar">
                {/* Health Shield Status */}
                <section className="w-full">
                    <div className="glass-panel p-5 rounded-2xl shadow-glass relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-all duration-500" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🛡️</span>
                                    <h2 className="text-lg font-bold text-forest-green dark:text-white">Health Shield</h2>
                                </div>
                                <p className="text-3xl font-bold text-primary tracking-tight">Active</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI-powered protection</p>
                            </div>
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary animate-pulse-slow">
                                <span className="text-3xl">✓</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Primary Actions Grid */}
                <section className="grid grid-cols-2 gap-4">
                    {/* Scan Pack Card */}
                    <Link href="/scan" className="group relative flex flex-col justify-between h-48 rounded-2xl p-4 overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-forest-green">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                            <span className="text-2xl">📷</span>
                        </div>
                        <div className="relative z-10 text-left">
                            <h3 className="text-white text-lg font-bold leading-tight mb-1">Scan<br />Pack</h3>
                            <p className="text-white/60 text-xs font-medium">Verify drug authenticity</p>
                        </div>
                    </Link>

                    {/* Analyze Prescription Card */}
                    <Link href="/prescription" className="group relative flex flex-col justify-between h-48 rounded-2xl p-4 overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <div className="relative z-10 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-2xl">📋</span>
                        </div>
                        <div className="relative z-10 text-left">
                            <h3 className="text-forest-green dark:text-white text-lg font-bold leading-tight mb-1">Analyze<br />Rx</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Check drug safety</p>
                        </div>
                    </Link>
                </section>

                {/* Secondary Actions */}
                <section className="grid grid-cols-2 gap-3">
                    <Link href="/stewardship" className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="text-lg">🏥</span>
                        </div>
                        <span className="text-sm font-bold text-forest-green dark:text-white">Stewardship</span>
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform">
                        <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                            <span className="text-lg">👤</span>
                        </div>
                        <span className="text-sm font-bold text-forest-green dark:text-white">Profile</span>
                    </Link>
                </section>

                {/* Info Section */}
                <section className="mt-4 p-4 rounded-xl bg-mint-leaf dark:bg-primary/10 border border-primary/20">
                    <h3 className="font-bold text-sm text-forest-green dark:text-white mb-2">🎯 Mission</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Protecting 140M Nigerians from counterfeit drugs and antimicrobial resistance using AI-powered pharmaceutical surveillance.
                    </p>
                </section>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-6 left-6 right-6 z-50 max-w-md mx-auto">
                <div className="glass-panel h-16 rounded-full flex items-center justify-between px-2 shadow-2xl">
                    <Link href="/" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-primary">
                        <span className="text-2xl">🏠</span>
                    </Link>
                    <Link href="/history" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white">
                        <span className="text-2xl">📜</span>
                    </Link>
                    <Link href="/scan" className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-forest-green text-white shadow-lg border-4 border-white dark:border-background-dark transform transition-transform active:scale-95">
                        <span className="text-3xl">🔍</span>
                    </Link>
                    <Link href="/map" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white">
                        <span className="text-2xl">🗺️</span>
                    </Link>
                    <Link href="/profile" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white">
                        <span className="text-2xl">👤</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
