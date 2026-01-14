import Link from "next/link";

export default function HomePage() {
    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden pb-24 lg:pb-8">
            {/* Decorative Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-64 lg:h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />
            <div className="absolute -top-20 -right-20 w-64 h-64 lg:w-96 lg:h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-mint-leaf/30 rounded-full blur-3xl pointer-events-none z-0 hidden lg:block" />

            {/* Header */}
            <header className="relative z-10 px-6 lg:px-8 xl:px-12 pt-8 lg:pt-12 pb-4 lg:pb-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-2 border-white dark:border-forest-green shadow-sm overflow-hidden bg-gray-100 relative flex items-center justify-center">
                            <span className="text-2xl lg:text-3xl font-bold text-primary">N</span>
                        </div>
                        <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Welcome back,</p>
                            <h1 className="text-xl lg:text-2xl font-bold leading-tight">User</h1>
                        </div>
                    </div>
                    <button className="glass-panel h-10 w-10 lg:h-12 lg:w-12 flex items-center justify-center rounded-full shadow-sm hover:scale-105 transition-transform">
                        <span className="text-xl lg:text-2xl">🔔</span>
                        <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-warning-amber border border-white" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 px-6 lg:px-8 xl:px-12 overflow-y-auto no-scrollbar">
                <div className="max-w-7xl mx-auto pb-6">

                    {/* Desktop: Two Column Layout, Mobile: Single Column */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                        {/* Left Column: Main Actions (Desktop: 2/3, Mobile: Full) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Health Shield Status */}
                            <section className="w-full">
                                <div className="glass-panel p-6 lg:p-8 rounded-2xl shadow-glass relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-32 h-32 lg:w-48 lg:h-48 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-all duration-500" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 lg:gap-3 mb-2">
                                                <span className="text-3xl lg:text-4xl">🛡️</span>
                                                <h2 className="text-xl lg:text-2xl font-bold text-forest-green dark:text-white">Health Shield</h2>
                                            </div>
                                            <p className="text-4xl lg:text-5xl font-bold text-primary tracking-tight">Active</p>
                                            <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">AI-powered pharmaceutical protection</p>
                                        </div>
                                        <div className="flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-primary/10 text-primary animate-pulse-slow">
                                            <span className="text-4xl lg:text-5xl">✓</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Primary Actions Grid */}
                            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">

                                {/* Scan Pack Card */}
                                <Link href="/scan" className="group relative flex flex-col justify-between h-56 lg:h-64 rounded-2xl p-6 overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-forest-green">
                                    <div className="absolute -bottom-10 -right-10 w-32 h-32 lg:w-48 lg:h-48 bg-primary rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <div className="relative z-10 w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <span className="text-3xl lg:text-4xl">📷</span>
                                    </div>
                                    <div className="relative z-10 text-left">
                                        <h3 className="text-white text-2xl lg:text-3xl font-bold leading-tight mb-2">Scan<br />Package</h3>
                                        <p className="text-white/60 text-sm lg:text-base font-medium">Verify drug authenticity instantly</p>
                                    </div>
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-primary text-2xl">→</span>
                                    </div>
                                </Link>

                                {/* Analyze Prescription Card */}
                                <Link href="/prescription" className="group relative flex flex-col justify-between h-56 lg:h-64 rounded-2xl p-6 overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                    <div className="absolute -top-10 -left-10 w-32 h-32 lg:w-48 lg:h-48 bg-blue-500 rounded-full blur-3xl opacity-5 dark:opacity-10" />
                                    <div className="relative z-10 w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="text-3xl lg:text-4xl">📋</span>
                                    </div>
                                    <div className="relative z-10 text-left">
                                        <h3 className="text-forest-green dark:text-white text-2xl lg:text-3xl font-bold leading-tight mb-2">Analyze<br />Prescription</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base font-medium">WHO AWaRe classification</p>
                                    </div>
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-forest-green dark:text-white text-2xl">→</span>
                                    </div>
                                </Link>

                            </section>

                            {/* Secondary Actions */}
                            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                                <Link href="/stewardship" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">🏥</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">Stewardship</span>
                                </Link>
                                <Link href="/profile" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">👤</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">Profile</span>
                                </Link>
                                <Link href="/history" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">📜</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">History</span>
                                </Link>
                                <Link href="/map" className="flex flex-col lg:flex-row items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-transform">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 flex-shrink-0">
                                        <span className="text-xl lg:text-2xl">🗺️</span>
                                    </div>
                                    <span className="text-sm lg:text-base font-bold text-forest-green dark:text-white text-center lg:text-left">Map</span>
                                </Link>
                            </section>

                        </div>

                        {/* Right Column: Info & Stats (Desktop: 1/3, Mobile: Full) */}
                        <div className="space-y-6 lg:col-span-1">

                            {/* Mission Section */}
                            <section className="p-5 lg:p-6 rounded-xl bg-mint-leaf dark:bg-primary/10 border border-primary/20 shadow-sm">
                                <h3 className="font-bold text-base lg:text-lg text-forest-green dark:text-white mb-3 flex items-center gap-2">
                                    <span className="text-xl">🎯</span> Mission
                                </h3>
                                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Protecting 140M Nigerians from counterfeit drugs and antimicrobial resistance using AI-powered pharmaceutical surveillance.
                                </p>
                            </section>

                            {/* Stats Section - Desktop Only */}
                            <section className="hidden lg:block p-5 lg:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-base lg:text-lg text-forest-green dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">📊</span> Impact
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">0</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Scans Completed</p>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-gray-700" />
                                    <div>
                                        <p className="text-2xl font-bold text-access-green">0</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Verified Authentic</p>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-gray-700" />
                                    <div>
                                        <p className="text-2xl font-bold text-reserve-red">0</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Suspected Counterfeits</p>
                                    </div>
                                </div>
                            </section>

                            {/* Quick Links - Desktop Only */}
                            <section className="hidden lg:block p-5 lg:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-base lg:text-lg text-forest-green dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">🔗</span> Resources
                                </h3>
                                <div className="space-y-2">
                                    <a href="#" className="block text-sm text-primary hover:underline">WHO AWaRe Database</a>
                                    <a href="#" className="block text-sm text-primary hover:underline">NAFDAC Registry</a>
                                    <a href="#" className="block text-sm text-primary hover:underline">Report Counterfeit</a>
                                    <a href="#" className="block text-sm text-primary hover:underline">Help & Support</a>
                                </div>
                            </section>

                        </div>

                    </div>
                </div>
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <nav className="fixed bottom-6 left-6 right-6 z-50 lg:hidden">
                <div className="glass-panel h-16 rounded-full flex items-center justify-between px-2 shadow-2xl max-w-md mx-auto">
                    <Link href="/" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-primary">
                        <span className="text-2xl">🏠</span>
                    </Link>
                    <Link href="/history" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white transition-colors">
                        <span className="text-2xl">📜</span>
                    </Link>
                    <Link href="/scan" className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-forest-green text-white shadow-lg border-4 border-white dark:border-background-dark transform transition-transform active:scale-95 hover:shadow-xl">
                        <span className="text-3xl">🔍</span>
                    </Link>
                    <Link href="/map" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white transition-colors">
                        <span className="text-2xl">🗺️</span>
                    </Link>
                    <Link href="/profile" className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-forest-green dark:hover:text-white transition-colors">
                        <span className="text-2xl">👤</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
