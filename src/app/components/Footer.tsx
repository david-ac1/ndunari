"use client";

import Link from "next/link";
import { Github, Twitter, Mail, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        product: [
            { name: "Forensic Scanner", href: "/scan" },
            { name: "Stewardship Auditor", href: "/prescription" },
            { name: "Surveillance Map", href: "/map" },
            { name: "History", href: "/history" },
        ],
        resources: [
            { name: "Documentation", href: "/docs" },
            { name: "API Reference", href: "/api-docs" },
            { name: "Research Hub", href: "/#research" },
            { name: "Safety Alerts", href: "/alerts" },
        ],
        legal: [
            { name: "Privacy Policy", href: "/privacy" },
            { name: "Terms of Service", href: "/terms" },
            { name: "Data Protection", href: "/data-protection" },
            { name: "Accessibility", href: "/accessibility" },
        ],
    };

    return (
        <footer className="relative w-full border-t border-primary/10 bg-white dark:bg-background-dark">
            {/* Gradient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />

            <div className="max-w-[1240px] mx-auto px-4 py-12 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-flex items-center mb-4 group">
                            <Image
                                src="/ndunari-logo.png"
                                alt="Ndunari Health Shield"
                                width={180}
                                height={60}
                                className="group-hover:scale-105 transition-transform"
                            />
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 max-w-sm">
                            AI-powered pharmaceutical surveillance protecting 140M Nigerians from counterfeit drugs and antimicrobial resistance.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            <motion.a
                                whileHover={{ scale: 1.1, y: -2 }}
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="size-9 rounded-lg glass-panel-subtle border border-primary/20 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:border-primary/50 hover:shadow-glow-primary transition-all"
                            >
                                <Github size={18} />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1, y: -2 }}
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="size-9 rounded-lg glass-panel-subtle border border-primary/20 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:border-primary/50 hover:shadow-glow-primary transition-all"
                            >
                                <Twitter size={18} />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1, y: -2 }}
                                href="mailto:contact@ndunari.health"
                                className="size-9 rounded-lg glass-panel-subtle border border-primary/20 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:border-primary/50 hover:shadow-glow-primary transition-all"
                            >
                                <Mail size={18} />
                            </motion.a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                            Product
                        </h4>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform">
                                            {link.name}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                            Resources
                        </h4>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform">
                                            {link.name}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                            Legal
                        </h4>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform">
                                            {link.name}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-gray-200 dark:border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            © {currentYear} Ndunari Health Shield. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-access-green animate-pulse-glow" />
                                <span>All Systems Operational</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Globe size={12} />
                                <span>Powered by Gemini AI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
