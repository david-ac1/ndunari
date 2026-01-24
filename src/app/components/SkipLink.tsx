"use client";

import { useEffect, useState } from "react";

export default function SkipLink() {
    const [focused, setFocused] = useState(false);

    return (
        <a
            href="#main-content"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`fixed top-4 left-4 z-[100] bg-primary text-white font-bold px-6 py-3 rounded-lg shadow-lg border-2 border-white transition-transform duration-200 ${focused ? "translate-y-0" : "-translate-y-32"
                }`}
        >
            Skip to Main Content
        </a>
    );
}
