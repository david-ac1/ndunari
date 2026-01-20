'use client';

import { useState } from 'react';
import { CounselorService, TranslatedGuidance } from '@/lib/agents/multilingual_counselor';

interface VoiceGuideProps {
    originalText: string;
}

const counselor = new CounselorService();

export function VoiceGuide({ originalText }: VoiceGuideProps) {
    const [activeLang, setActiveLang] = useState('English');
    const [translation, setTranslation] = useState<TranslatedGuidance | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);

    const SUPPORTED_LANGS = ['Pidgin', 'Hausa', 'Igbo', 'Yoruba'];

    const handleLanguageChange = async (lang: string) => {
        setActiveLang(lang);
        if (lang === 'English') {
            setTranslation(null);
            return;
        }

        setLoading(true);
        // Cheap cache for session
        // In real app, use React Query or SWR
        const result = await counselor.translateGuidance(originalText, lang as any);
        setTranslation(result);
        setLoading(false);
    };

    const playAudio = () => {
        const textToSpeak = translation ? translation.text : originalText;
        const locale = translation ? translation.audioLocale : 'en-US';

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Stop current

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = locale;
            utterance.rate = 0.9; // Slightly slower for clarity

            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);

            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="bg-[#f0fdf4] rounded-2xl p-4 border border-[#4bb814]/20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#0A4D3C] flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">record_voice_over</span>
                    Narị Voice Guide
                </h3>
                {isPlaying && (
                    <div className="flex items-center gap-1 h-3">
                        <div className="w-1 h-full bg-[#4bb814] animate-bounce delay-75"></div>
                        <div className="w-1 h-full bg-[#4bb814] animate-bounce delay-150"></div>
                        <div className="w-1 h-full bg-[#4bb814] animate-bounce delay-300"></div>
                    </div>
                )}
            </div>

            {/* Language Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                <button
                    onClick={() => handleLanguageChange('English')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${activeLang === 'English' ? 'bg-[#0A4D3C] text-white' : 'bg-white text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    English
                </button>
                {SUPPORTED_LANGS.map(lang => (
                    <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${activeLang === lang ? 'bg-[#0A4D3C] text-white' : 'bg-white text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>

            {/* Content Display */}
            <div className="relative bg-white rounded-xl p-4 min-h-[80px] flex items-center justify-center border border-gray-100">
                {loading ? (
                    <span className="material-symbols-outlined animate-spin text-gray-300">sync</span>
                ) : (
                    <div className="w-full">
                        <p className="text-sm font-medium text-gray-700 leading-relaxed text-center">
                            "{translation ? translation.text : originalText}"
                        </p>
                    </div>
                )}
            </div>

            {/* Play Controls */}
            <button
                onClick={playAudio}
                disabled={loading}
                className="w-full mt-3 bg-[#0A4D3C] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#06382a] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">
                    {isPlaying ? 'stop_circle' : 'play_circle'}
                </span>
                {isPlaying ? 'Stop Audio' : 'Play Guidance'}
            </button>

            <p className="text-[9px] text-center text-gray-400 mt-2">
                *Audio generated by device TTS. Accent accuracy depends on system support.
            </p>
        </div>
    );
}
