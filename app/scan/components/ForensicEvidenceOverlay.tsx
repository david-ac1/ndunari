"use client";

import { motion } from "framer-motion";

export interface EvidenceBox {
    box_2d: number[]; // [ymin, xmin, ymax, xmax]
    label: string;
}

interface ForensicEvidenceOverlayProps {
    boxes: EvidenceBox[];
    width?: number;
    height?: number;
}

/**
 * ForensicEvidenceOverlay
 * Renders bounding boxes over an image based on Gemini 3 coordinates (0-1000 normalized)
 */
export default function ForensicEvidenceOverlay({
    boxes,
    width = 1000,
    height = 1000
}: ForensicEvidenceOverlayProps) {
    if (!boxes || boxes.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-20">
            <svg
                viewBox="0 0 1000 1000"
                className="w-full h-full"
                preserveAspectRatio="none"
            >
                {boxes.map((box, index) => {
                    const [ymin, xmin, ymax, xmax] = box.box_2d;
                    const bWidth = xmax - xmin;
                    const bHeight = ymax - ymin;

                    return (
                        <g key={index}>
                            {/* Animated Pulse Box */}
                            <motion.rect
                                x={xmin}
                                y={ymin}
                                width={bWidth}
                                height={bHeight}
                                fill="none"
                                stroke="#38BDF8" // primary color
                                strokeWidth="4"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: [0.3, 0.7, 0.3],
                                    scale: [1, 1.02, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: index * 0.5
                                }}
                            />

                            {/* Solid Border */}
                            <rect
                                x={xmin}
                                y={ymin}
                                width={bWidth}
                                height={bHeight}
                                fill="none"
                                stroke="#38BDF8"
                                strokeWidth="2"
                                opacity="0.8"
                            />

                            {/* Label Tag */}
                            <foreignObject
                                x={xmin}
                                y={ymin - 35 > 0 ? ymin - 35 : ymin + 5}
                                width={bWidth > 200 ? bWidth : 200}
                                height="40"
                            >
                                <div className="flex items-center">
                                    <div className="bg-primary text-black text-[10px] font-black uppercase px-2 py-1 rounded-sm shadow-lg whitespace-nowrap">
                                        🔍 {box.label}
                                    </div>
                                    <div className="w-2 h-2 bg-primary rotate-45 -ml-1 shadow-lg" />
                                </div>
                            </foreignObject>

                            {/* Corner Accents */}
                            <path d={`M ${xmin} ${ymin + 20} L ${xmin} ${ymin} L ${xmin + 20} ${ymin}`} fill="none" stroke="#38BDF8" strokeWidth="6" />
                            <path d={`M ${xmax - 20} ${ymin} L ${xmax} ${ymin} L ${xmax} ${ymin + 20}`} fill="none" stroke="#38BDF8" strokeWidth="6" />
                            <path d={`M ${xmin} ${ymax - 20} L ${xmin} ${ymax} L ${xmin + 20} ${ymax}`} fill="none" stroke="#38BDF8" strokeWidth="6" />
                            <path d={`M ${xmax - 20} ${ymax} L ${xmax} ${ymax} L ${xmax} ${ymax - 20}`} fill="none" stroke="#38BDF8" strokeWidth="6" />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
