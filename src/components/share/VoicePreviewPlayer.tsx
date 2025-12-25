"use client";

import React, { useState, useRef } from "react";
import { Play, Pause, Loader2, Volume2 } from "lucide-react";
import { synthesizeInworldSpeech } from "@/app/actions";

interface VoicePreviewPlayerProps {
    voiceId: string;
    description?: string;
}

export default function VoicePreviewPlayer({ voiceId, description }: VoicePreviewPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const handlePreview = async () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        if (audioUrl && audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        try {
            setIsLoading(true);
            const textToSay = description || "Hello, I am a high-quality neural voice from SonicFlow. What do you think of my tone and clarity?";

            // Note: For guests, we use 'preview_guest' as userId which bypasses credit check in actions.ts
            const result = await synthesizeInworldSpeech(
                textToSay,
                voiceId,
                "preview_guest",
                { speed: 1.0, isPreview: true }
            );

            if (result.audioContent) {
                const binaryString = window.atob(result.audioContent);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/mp3' });
                const url = URL.createObjectURL(blob);

                setAudioUrl(url);
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onended = () => setIsPlaying(false);
                audio.onplay = () => setIsPlaying(true);
                audio.onpause = () => setIsPlaying(false);

                await audio.play();
            }
        } catch (error) {
            console.error("Preview failed", error);
            alert("Failed to generate preview. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={handlePreview}
                disabled={isLoading}
                className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl ${isPlaying
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                        : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 hover:border-indigo-500/50'
                    }`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                    </>
                ) : isPlaying ? (
                    <>
                        <Pause className="w-5 h-5 fill-current" />
                        <span>Stop Preview</span>
                    </>
                ) : (
                    <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>Listen to Voice</span>
                    </>
                )}
            </button>

            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                No account required to listen
            </p>
        </div>
    );
}
