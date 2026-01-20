"use client";

import { useVoiceGuide } from "@/lib/hooks/use-voice-guide";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

export function VoiceController() {
    const { enabled, toggleVoice, supported } = useVoiceGuide();

    if (!supported) return null;

    return (
        <button
            onClick={() => toggleVoice()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${enabled
                    ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                }`}
            title={enabled ? "Disable Narị Voice Guide" : "Enable Narị Voice Guide"}
        >
            {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="text-xs font-bold uppercase tracking-wider">Narị</span>
        </button>
    );
}
