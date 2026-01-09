import React from "react";
import { getVoiceByDocId } from "@/app/actions";
import { Mic, Globe, Heart, Zap, Share2, ArrowRight, Play, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import TryVoiceButton from "@/components/share/TryVoiceButton";
import VoicePreviewPlayer from "@/components/share/VoicePreviewPlayer";

interface Props {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const voice = await getVoiceByDocId(id);
    if (!voice || !voice.isPublic) return { title: "Voice Not Found" };

    return {
        title: `${voice.displayName} | Shared Voice on VoiceLo`,
        description: voice.description || `Listen to this amazing AI voice created by ${voice.creator}.`,
        openGraph: {
            title: `${voice.displayName} - AI Voice`,
            description: voice.description,
            type: "website",
        }
    };
}

export default async function SharedVoicePage({ params }: Props) {
    const { id } = await params;
    const voice = await getVoiceByDocId(id);

    if (!voice || !voice.isPublic) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black">
                <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6">
                    <Mic className="w-10 h-10 text-zinc-400" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Voice Not Found</h1>
                <p className="text-zinc-500 mb-8 text-center max-w-md">The voice you're looking for doesn't exist or has been made private.</p>
                <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold transition-all shadow-lg shadow-primary/20">
                    Go Home
                </Link>
            </div>
        );
    }

    const { displayName, creator, description, gender, languages, likes, uses, createdAt } = voice;
    const lang = languages?.[0]?.split('_')[0]?.toUpperCase() || "EN";
    const date = new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] selection:bg-primary/30">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 container mx-auto px-6 py-20 lg:py-32 flex flex-col items-center">
                {/* Logo Link */}
                <Link href="/" className="mb-12 group flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">VoiceLo</span>
                </Link>

                <div className="w-full max-w-4xl">
                    <div className="glass-panel border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl">

                        {/* Header Section */}
                        <div className="p-8 lg:p-12 border-b border-zinc-200 dark:border-white/10 flex flex-col md:flex-row gap-8 items-start md:items-center">


                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
                                        {displayName}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Globe className="w-3 h-3" /> {lang}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest
                                            ${gender === 'MALE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' :
                                                gender === 'FEMALE' ? 'bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400' :
                                                    'bg-zinc-500/10 border-zinc-200 text-zinc-500'}
                                        `}>
                                            {gender}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                                        {creator.charAt(0).toUpperCase()}
                                    </div>
                                    <span>Created by @{creator}</span>
                                    <span className="text-zinc-300 dark:text-zinc-700 mx-1">•</span>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        <span>{date}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Action */}
                            <div className="w-full md:w-auto mt-4 md:mt-0">
                                <VoicePreviewPlayer voiceId={voice.voiceId} description={description} />
                            </div>
                        </div>

                        {/* Description & Stats */}
                        <div className="p-8 lg:p-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-7 space-y-8">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-1">About this voice</h3>
                                    <p className="text-xl lg:text-2xl font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
                                        "{description || "A professional-grade neural voice designed for high-end digital experiences."}"
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-8 items-center pt-4 border-t border-zinc-200 dark:border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <Heart className="w-5 h-5 fill-current" />
                                            <span className="text-2xl font-black tabular-nums">{likes}</span>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Community Likes</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Mic className="w-5 h-5" />
                                            <span className="text-2xl font-black tabular-nums">{uses}</span>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Uses</span>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5">
                                <TryVoiceButton voiceId={voice.voiceId} />
                            </div>
                        </div>

                    </div>

                    {/* Footer Info */}
                    <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-500">
                        Generated and shared via VoiceLo Neural Engine. <Link href="/" className="text-primary font-bold hover:underline">Join the community</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
