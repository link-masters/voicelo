"use client";

import React from "react";
import { X, Sparkles, ArrowRight, Zap, Info } from "lucide-react";
import ModalPortal from "./ModalPortal";

interface AiWriterQuotaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade?: () => void;
}

export default function AiWriterQuotaModal({
    isOpen,
    onClose,
    onUpgrade
}: AiWriterQuotaModalProps) {
    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 pointer-events-auto">
                {/* Visual Background Element */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors z-20 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border border-border dark:border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-10 text-center relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20 relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all opacity-50" />
                        <Zap className="w-10 h-10 text-primary relative z-10 fill-primary/20" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900">
                            <Info className="w-4 h-4 text-white dark:text-zinc-900" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">AI Writing Quota Reached</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed text-[15px] font-medium px-4 text-center">
                        You've reached your generation limit. Upgrade your plan to continue using the AI Writer.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onUpgrade || onClose}
                            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Sparkles className="w-5 h-5 fill-current" />
                            <span>Upgrade My Quota</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-200 dark:hover:bg-white/10 transition-all text-[13px] uppercase tracking-widest"
                        >
                            Dismiss
                        </button>
                    </div>

                </div>
            </div>
        </ModalPortal>
    );
}
