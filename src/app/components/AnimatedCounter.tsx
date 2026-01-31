"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}

export default function AnimatedCounter({
    value,
    duration = 1000,
    className = "",
    suffix = "",
    prefix = ""
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const rafRef = useRef<number>();

    useEffect(() => {
        const startTime = performance.now();
        const startValue = countRef.current;
        const difference = value - startValue;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentCount = Math.floor(startValue + difference * easeOut);

            setCount(currentCount);
            countRef.current = currentCount;

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={className}>
            {prefix}{count}{suffix}
        </span>
    );
}
