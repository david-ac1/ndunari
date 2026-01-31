import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#00FF7F",
                    dark: "#00D46A",
                },
                "forest-green": {
                    DEFAULT: "#0A4D3C",
                    dark: "#0a1f11",
                },
                "access-green": "#00C853",
                "watch-orange": "#FFB300",
                "reserve-red": "#FF1744",
                background: {
                    light: "#ffffff",
                    dark: "#0a1208",
                },
                surface: {
                    light: "#f6f8f6",
                    dark: "#1e2b18",
                },
                "warning-amber": "#FFA000",
                "mint-leaf": "#E8F5E9",
                "slate-gray": "#455A64",
            },
            fontFamily: {
                display: ["var(--font-manrope)", "sans-serif"],
                sans: ["var(--font-inter)", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "12px",
            },
            boxShadow: {
                soft: "0 8px 30px rgba(0,0,0,0.04)",
                glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
                "glow-primary": "0 0 20px rgba(0, 255, 127, 0.3)",
                "glow-success": "0 0 20px rgba(0, 200, 83, 0.3)",
                "glow-warning": "0 0 20px rgba(255, 179, 0, 0.3)",
                "glow-danger": "0 0 20px rgba(255, 23, 68, 0.3)",
                "xl-glow": "0 20px 50px rgba(0, 255, 127, 0.15)",
            },
            animation: {
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "float": "float 3s ease-in-out infinite",
                "shimmer": "shimmer 2s infinite",
                "slide-up": "slide-up 0.4s ease-out",
                "scan-line": "scan-line 3s linear infinite",
                "ripple": "ripple 0.6s ease-out",
                "scale-in": "scale-in 0.3s ease-out",
                "gradient-shift": "gradient-shift 8s ease infinite",
            },
            keyframes: {
                "pulse-glow": {
                    "0%, 100%": {
                        opacity: "1",
                        boxShadow: "0 0 20px rgba(0, 255, 127, 0.4)",
                    },
                    "50%": {
                        opacity: "0.8",
                        boxShadow: "0 0 40px rgba(0, 255, 127, 0.6)",
                    },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "slide-up": {
                    from: {
                        transform: "translateY(100%)",
                        opacity: "0",
                    },
                    to: {
                        transform: "translateY(0)",
                        opacity: "1",
                    },
                },
                "scan-line": {
                    "0%": { top: "0%" },
                    "50%": { top: "100%" },
                    "100%": { top: "0%" },
                },
                ripple: {
                    "0%": {
                        transform: "scale(0)",
                        opacity: "1",
                    },
                    "100%": {
                        transform: "scale(4)",
                        opacity: "0",
                    },
                },
                "scale-in": {
                    from: {
                        transform: "scale(0.9)",
                        opacity: "0",
                    },
                    to: {
                        transform: "scale(1)",
                        opacity: "1",
                    },
                },
                "gradient-shift": {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
            },
            backdropBlur: {
                xs: "2px",
            },
            backdropSaturate: {
                150: "1.5",
                200: "2",
            },
        },
    },
    plugins: [],
};

export default config;
