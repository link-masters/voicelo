"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Share2, Globe, Twitter, Facebook, Link as LinkIcon } from "lucide-react";

interface ShareVoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    voiceName: string;
    shareUrl: string;
}

export default function ShareVoiceModal({ isOpen, onClose, voiceName, shareUrl }: ShareVoiceModalProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 mb-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-scale-in">

                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                <div className="p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Share Voice</h2>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Spread the word about {voiceName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 dark:text-zinc-500 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* URL Box */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Voice Link</label>
                            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-2xl group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                                <div className="pl-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 truncate flex-1 font-medium">
                                    {shareUrl}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${copied
                                        ? 'bg-green-500 text-white shadow-green-500/20'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20 active:scale-95'
                                        }`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Social Shortcuts */}
                        <div className="grid grid-cols-2 gap-4">
                            <a
                                href={`https://twitter.com/intent/tweet?text=Check out this awesome AI voice ${voiceName} on VoiceLo!&url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-all group"
                            >
                                <Twitter className="w-5 h-5 text-[#1DA1F2] group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold uppercase tracking-widest">Twitter</span>
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-all group"
                            >
                                <Facebook className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold uppercase tracking-widest">Facebook</span>
                            </a>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-white/5">
                        <div className="flex items-center gap-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-500/80">
                            <Globe className="w-4 h-4 shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                                Professional link including voice preview is now live for this voice.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
