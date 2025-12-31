"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Zap, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface TryVoiceButtonProps {
    voiceId: string;
}

export default function TryVoiceButton({ voiceId }: TryVoiceButtonProps) {
    const { user, loading, loginWithGoogle } = useAuth();

    if (loading) {
        return (
            <div className="w-full aspect-square lg:aspect-auto h-full min-h-[280px] rounded-[2.5rem] bg-primary/10 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Checking access...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <button
                onClick={() => loginWithGoogle(`/dashboard/text-to-speech?voice=${voiceId}`)}
                className="group w-full aspect-square lg:aspect-auto h-full min-h-[280px] rounded-[2.5rem] bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-800 p-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-500 shadow-2xl active:scale-[0.98]"
            >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                    <User className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Sign in to try</h4>
                    <p className="text-zinc-500/70 font-bold uppercase tracking-widest text-[10px]">Log in to test this voice in the studio</p>
                </div>
                <div className="flex items-center gap-2 px-6 py-2 bg-primary rounded-full text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                    Login with Google
                </div>
            </button>
        );
    }

    return (
        <Link
            href={`/dashboard/text-to-speech?voice=${voiceId}`}
            className="group w-full aspect-square lg:aspect-auto h-full min-h-[280px] rounded-[2.5rem] bg-primary hover:opacity-90 p-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-500 shadow-2xl shadow-primary/20 active:scale-[0.98]"
        >
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-500 border border-white/20">
                <Zap className="w-10 h-10 fill-current" />
            </div>
            <div className="space-y-2">
                <h4 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Try this voice</h4>
                <p className="text-primary-foreground/70 font-bold uppercase tracking-widest text-xs">Instantly generate Speech</p>
            </div>
            <div className="flex items-center gap-2 px-6 py-2 bg-black/20 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em]">
                Use in Studio <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
        </Link>
    );
}

import { User } from "lucide-react";
