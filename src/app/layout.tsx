import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { PWAUpdater } from "@/app/components/PWAUpdater";
import { AuthProvider } from "@/app/components/providers/AuthProvider";
import { ScanDataProvider } from "@/lib/contexts/ScanDataContext";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
    display: "swap",
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: "#0A4D3C",
};

export const metadata: Metadata = {
    title: "Ndunari Health Shield",
    description: "Decentralized Pharmaceutical Surveillance Network - Combating counterfeit drugs and AMR in Nigeria",
    keywords: ["pharmaceutical", "counterfeit detection", "antimicrobial resistance", "Nigeria", "NAFDAC", "drug safety"],
    authors: [{ name: "Ndunari Team" }],
    icons: {
        icon: "/icon.png",
        apple: "/icon.png",
    },
    openGraph: {
        title: "Ndunari Health Shield",
        description: "AI-powered pharmaceutical surveillance to protect 140M Nigerians",
        type: "website",
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Ndunari",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} ${manrope.variable} font-sans`}>
                <PWAUpdater />
                <ErrorBoundary>
                    <AuthProvider>
                        <ScanDataProvider>
                            {children}
                        </ScanDataProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
