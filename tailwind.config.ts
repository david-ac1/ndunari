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
                    DEFAULT: "#4bb814",
                    dark: "#3a960e",
                },
                "forest-green": {
                    DEFAULT: "#0A4D3C",
                    dark: "#121b0e",
                },
                "access-green": "#2E7D32",
                "watch-orange": "#EF6C00",
                "reserve-red": "#C62828",
                background: {
                    light: "#ffffff",
                    dark: "#0a1208",
                },
                surface: {
                    light: "#f6f8f6",
                    dark: "#1e2b18",
                },
                "warning-amber": "#ffb02e",
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
            },
        },
    },
    plugins: [],
};

export default config;
