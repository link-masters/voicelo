
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Wand2, Loader2, ArrowRight } from "lucide-react";

interface AiWriterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (text: string) => void;
}

export default function AiWriterModal({ isOpen, onClose, onGenerate }: AiWriterModalProps) {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate text');
            }

            if (data.text) {
                onGenerate(data.text);
                onClose();
                setPrompt(""); // Reset prompt on success
            } else {
                throw new Error('No text returned from AI');
            }
        } catch (err: any) {
            console.error('AI Generation failed:', err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-5 md:p-6 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Sparkles className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">AI Writer</h2>
                            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Generate creative text for your voiceover</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Your Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Write a funny detailed story about a developer who accidentally deleted the production database..."
                            className="w-full h-32 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl p-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-medium leading-relaxed"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider transition-all shadow-lg ${!prompt.trim() || isGenerating
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 shadow-none cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Writing Magic...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 fill-current" />
                                    <span>Generate Content</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-white/5 text-center">
                    <p className="text-[10px] text-zinc-400">
                        Powered by Inworld AI. Content is generated for creative purposes.
                    </p>
                </div>

            </div>
        </div>,
        document.body
    );
}
