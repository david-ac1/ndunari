"use client";

import { useState, useCallback, useEffect } from 'react';

export type VoiceLanguage = 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';

interface VoiceGuideOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
}

export function useVoiceGuide() {
    const [enabled, setEnabled] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        setSupported('speechSynthesis' in window);

        // Load preference
        const saved = localStorage.getItem('ndunari_voice_enabled');
        if (saved === 'true') setEnabled(true);
    }, []);

    const speak = useCallback((text: string, lang: VoiceLanguage = 'english', options: VoiceGuideOptions = {}) => {
        if (!supported || (!enabled && !options.volume)) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        // Try to find a suitable voice
        const voices = window.speechSynthesis.getVoices();

        // Simple heuristic for generic English if no specific dialect found
        utterance.lang = 'en-US';

        // If it's Pidgin, we might need a specific adjustment or just rely on the text
        // (Speech engines don't natively have "Nigerian Pidgin", but reading the text as English works surprisingly well)

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [supported, enabled]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }, []);

    const toggleVoice = useCallback((val?: boolean) => {
        const newState = val !== undefined ? val : !enabled;
        setEnabled(newState);
        localStorage.setItem('ndunari_voice_enabled', newState.toString());
    }, [enabled]);

    return {
        supported,
        enabled,
        speaking,
        speak,
        stop,
        toggleVoice
    };
}
