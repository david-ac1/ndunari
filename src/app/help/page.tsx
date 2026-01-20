import Link from "next/link";

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-background-dark p-6">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
                        <span>←</span> Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-2">Help & Support</h1>
                    <p className="text-white/70">Learn how to use Ndunari Health Shield</p>
                </header>

                <div className="space-y-6">
                    <section className="glass-panel p-6 rounded-xl">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>📱</span> How to Scan a Drug Package
                        </h2>
                        <ol className="space-y-3 text-white/80">
                            <li><strong>1.</strong> Click "Scan Package" on the home screen</li>
                            <li><strong>2.</strong> Choose your scan mode:
                                <ul className="ml-6 mt-2 space-y-1 text-sm">
                                    <li>• <strong>Quick Upload</strong> - Upload one photo (max 70% confidence)</li>
                                    <li>• <strong>3D Verification</strong> - Scan multiple angles (up to 100% confidence)</li>
                                </ul>
                            </li>
                            <li><strong>3.</strong> For 3D scans, capture these angles:
                                <ul className="ml-6 mt-2 space-y-1 text-sm">
                                    <li>• Front (required)</li>
                                    <li>• Back (required)</li>
                                    <li>• Side with NAFDAC hologram (required)</li>
                                    <li>• Other side (optional)</li>
                                    <li>• Contents/pills (optional)</li>
                                </ul>
                            </li>
                            <li><strong>4.</strong> Review your captured images</li>
                            <li><strong>5.</strong> Tap "Analyze Package" to see results</li>
                        </ol>
                    </section>

                    <section className="glass-panel p-6 rounded-xl">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>🎯</span> Understanding Results
                        </h2>
                        <div className="space-y-4 text-white/80">
                            <div>
                                <h3 className="font-bold text-access-green mb-2">✅ SAFE (85-100%)</h3>
                                <p className="text-sm">Drug appears authentic with proper security features and valid NAFDAC registration.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-watch-orange mb-2">⚠️ SUSPICIOUS (60-84%)</h3>
                                <p className="text-sm">Some quality issues detected. Verify with pharmacist before use.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-reserve-red mb-2">❌ COUNTERFEIT (0-59%)</h3>
                                <p className="text-sm">Multiple red flags detected. DO NOT USE. Report to NAFDAC immediately.</p>
                            </div>
                        </div>
                    </section>

                    <section className="glass-panel p-6 rounded-xl">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>📞</span> Contact & Support
                        </h2>
                        <div className="space-y-3 text-white/80">
                            <p><strong>Report Counterfeit Drugs:</strong> <a href="mailto:report@ndunari.health" className="text-primary hover:underline">report@ndunari.health</a></p>
                            <p><strong>Technical Support:</strong> <a href="mailto:support@ndunari.health" className="text-primary hover:underline">support@ndunari.health</a></p>
                            <p><strong>NAFDAC Hotline:</strong> <a href="tel:08001234567" className="text-primary hover:underline">0800-123-4567</a></p>
                        </div>
                    </section>

                    <section className="glass-panel p-6 rounded-xl border border-primary/30">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>⚕️</span> Medical Disclaimer
                        </h2>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Ndunari Health Shield is a screening tool and should not replace professional medical advice.
                            Always consult a qualified healthcare provider before taking any medication.
                            If you suspect a counterfeit drug, report it to NAFDAC immediately.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
