"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Play, Mic, Globe, Zap, Loader2, Pause, User, Heart, MessageSquare, Share2, MoreHorizontal, Bookmark, Plus } from "lucide-react";
import { getInworldVoices, getCommunityVoices, synthesizeInworldSpeech, toggleCommunityVoiceLike } from "@/app/actions";
import { useAuth } from "@/context/AuthContext";
import { useVoices } from "@/context/VoiceContext";
import Link from "next/link";
import ShareVoiceModal from "./ShareVoiceModal";

interface Voice {
    voiceId: string;
    docId?: string; // Appwrite Document ID for secure sharing
    displayName: string;
    description?: string;
    tags?: string[];
    languages?: string[];
    // Extended metadata from processed description
    isCommunity?: boolean;
    isPublic?: boolean;
    creator?: string;
    // Keeping older fields optional just in case, but primary usage is above
    baseName?: string;
    gender?: string;
    likes?: number;
    likedBy?: string[];
    uses?: number;
}

export default function DiscoverVoices() {
    const { user } = useAuth();
    const { officialVoices, communityVoices, loading: contextLoading, toggleVoiceLike } = useVoices();
    const router = useRouter();
    const [filter, setFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState<'default' | 'community'>('default');

    // Audio Preview State
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    // Cache for voice preview URLs: { voiceId: blobUrl }
    const voiceCache = React.useRef<Record<string, string>>({});

    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingVoice, setSharingVoice] = useState<{ name: string, url: string } | null>(null);

    // Simplified voices combination from context
    const voices = [...communityVoices, ...officialVoices];
    const loading = contextLoading;

    // Cleanup audio on unmount

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const playAudio = async (url: string, voiceId: string) => {
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
            setPlayingVoiceId(null);
        };

        audio.onplay = () => {
            setPlayingVoiceId(voiceId);
            setIsPreviewLoading(null);
        };

        try {
            await audio.play();
        } catch (err) {
            console.error("Audio playback error", err);
            setPlayingVoiceId(null);
            setIsPreviewLoading(null);
        }
    };

    const handlePreview = async (voice: Voice) => {
        // Stop current audio if playing
        if (playingVoiceId === voice.voiceId) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setPlayingVoiceId(null);
            return;
        }

        // Stop any other audio
        if (audioRef.current) {
            audioRef.current.pause();
        }

        // Check Cache
        if (voiceCache.current[voice.voiceId]) {
            await playAudio(voiceCache.current[voice.voiceId], voice.voiceId);
            return;
        }

        try {
            setIsPreviewLoading(voice.voiceId);
            const textToSay = voice.description || "Hello, I am a neural voice from Inworld AI.";

            const result = await synthesizeInworldSpeech(
                textToSay,
                voice.voiceId,
                user?.$id || "preview_guest",
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

                // Save to cache
                voiceCache.current[voice.voiceId] = url;

                await playAudio(url, voice.voiceId);
            }
        } catch (error) {
            console.error("Preview failed", error);
            setIsPreviewLoading(null);
            setPlayingVoiceId(null);
        }
    };

    const handleUseVoice = (voiceId: string) => {
        router.push(`/dashboard/text-to-speech?voice=${voiceId}`);
    };

    const getGender = (voice: Voice) => {
        // 1. Explicit gender property
        if (voice.gender) return voice.gender.toUpperCase();

        // 2. Search in tags for gender keywords
        const tags = voice.tags || [];
        if (tags.some(t => t.toLowerCase() === 'male' || t.toLowerCase() === 'man')) return "MALE";
        if (tags.some(t => t.toLowerCase() === 'female' || t.toLowerCase() === 'woman')) return "FEMALE";

        // 3. Search in description as a final fallback
        const desc = (voice.description || "").toLowerCase();
        if (desc.includes('male voice') || desc.includes('man voice') || desc.includes(' male ')) return "MALE";
        if (desc.includes('female voice') || desc.includes('woman voice') || desc.includes(' female ')) return "FEMALE";

        // 4. Use first tag if available but no gender found
        if (tags.length > 0) return tags[0].toUpperCase();

        return "NEUTRAL";
    };

    const getName = (voice: Voice) => voice.displayName || voice.baseName || voice.voiceId;

    const handleLike = async (voiceId: string) => {
        if (!user?.$id) {
            router.push('/login');
            return;
        }

        try {
            await toggleVoiceLike(voiceId, user.$id);
        } catch (error) {
            console.error("Failed to toggle like", error);
        }
    };

    const handleShare = async (voice: Voice) => {
        const shareId = voice.docId || voice.voiceId;
        const url = `${window.location.origin}/share/voice/${shareId}`;
        setSharingVoice({ name: getName(voice), url });
        setIsShareModalOpen(true);
    };

    const filteredVoices = voices.filter(v => {
        // 1. Source Filter
        const isCommunityVoice = v.isCommunity || v.voiceId.includes('__');

        if (sourceFilter === 'default') {
            if (isCommunityVoice) return false;
        } else if (sourceFilter === 'community') {
            if (!isCommunityVoice) return false;
        }

        // 2. Search Filter
        const search = filter.toLowerCase();
        const name = getName(v).toLowerCase();
        const gender = getGender(v).toLowerCase();
        const tags = (v.tags || []).join(" ").toLowerCase();

        return name.includes(search) || gender.includes(search) || tags.includes(search);
    });

    return (
        <div className="h-full flex flex-col space-y-6">

            {/* Navigation Tabs */}
            <div className="flex items-center gap-8 border-b border-border dark:border-white/5">
                <button
                    onClick={() => setSourceFilter('default')}
                    className={`pb-4 text-sm font-semibold transition-all relative ${sourceFilter === 'default'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Default Voices
                    </div>
                    {sourceFilter === 'default' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setSourceFilter('community')}
                    className={`pb-4 text-sm font-semibold transition-all relative ${sourceFilter === 'community'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Community Shared
                    </div>
                    {sourceFilter === 'community' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>

                <div className="ml-auto pb-4">
                    <Link
                        href="/dashboard/voice-clone"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Clone Your Voice
                    </Link>
                </div>
            </div>

            {/* toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        {sourceFilter === 'default'
                            ? "Premium neural voices optimized for high-quality production."
                            : "Explore custom voices shared by the community."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search voices..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white dark:bg-black/20 border border-border dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64 transition-all shadow-sm dark:shadow-none"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {
                loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                ) : filteredVoices.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                        <Mic className="w-12 h-12 mb-4 opacity-20" />
                        <p>No voices found matching your search</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 overflow-y-auto pb-8 scrollbar-hide">
                        {filteredVoices.map((voice) => {
                            const gender = getGender(voice);
                            const name = getName(voice);
                            const isCommunityVisible = voice.voiceId.includes('__') || voice.isCommunity;
                            const creator = voice.creator || (voice.voiceId.includes('__') ? voice.voiceId.split('__')[0] : 'SonicFlow Official');

                            return (
                                <div key={voice.voiceId} className="group relative bg-white dark:bg-zinc-900/40 border border-border dark:border-white/5 hover:border-indigo-500/30 rounded-3xl p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-500 flex flex-col">

                                    {isCommunityVisible && (
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-zinc-800 shadow-lg">
                                                    {creator.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">@{creator}</p>
                                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500">2 days ago</p>
                                                </div>
                                            </div>
                                            <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {!isCommunityVisible && (
                                        <div className="absolute top-6 right-6 z-10">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleLike(voice.voiceId);
                                                }}
                                                className={`p-2 rounded-full transition-all border group/bookmark ${voice.likedBy?.includes(user?.$id || "")
                                                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-transparent hover:border-indigo-500/20'
                                                    }`}
                                            >
                                                <Bookmark className={`w-4 h-4 ${voice.likedBy?.includes(user?.$id || "") ? 'fill-current' : 'group-hover/bookmark:fill-current'}`} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">{name}</h3>
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-border dark:border-white/5 text-zinc-500 dark:text-zinc-400">
                                                        <Globe className="w-3 h-3" />
                                                        {(voice.languages && voice.languages[0]?.toUpperCase()) || "EN"}
                                                    </div>
                                                    <span className="text-zinc-300 dark:text-zinc-700 font-normal">•</span>
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border
                                                    ${gender === 'MALE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                            gender === 'FEMALE' ? 'bg-pink-500/10 border-pink-500/20 text-pink-500' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}
                                                `}>
                                                        {gender}
                                                    </div>
                                                    {!isCommunityVisible && (
                                                        <>
                                                            <span className="text-zinc-300 dark:text-zinc-700 font-normal">•</span>
                                                            <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
                                                                Premium
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 flex-1 leading-relaxed">
                                        {voice.description || "A high-quality neural voice perfect for storytelling, narration, and professional content."}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {voice.tags?.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50/50 dark:bg-indigo-500/5 text-indigo-600/70 dark:text-indigo-400/60 border border-indigo-500/10 font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {isCommunityVisible && (
                                        <div className="flex items-center gap-6 mb-6 px-1">
                                            <button
                                                onClick={() => handleLike(voice.voiceId)}
                                                className="flex items-center gap-1.5 group/stat cursor-pointer hover:bg-red-500/5 p-1 rounded-lg transition-all"
                                            >
                                                <Heart className={`w-4 h-4 transition-colors ${voice.likedBy?.includes(user?.$id || "")
                                                    ? 'text-red-500 fill-current'
                                                    : 'text-zinc-400 group-hover/stat:text-red-500'
                                                    }`} />
                                                <span className={`text-xs font-bold transition-colors ${voice.likedBy?.includes(user?.$id || "")
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-zinc-500 group-hover/stat:text-zinc-900 dark:group-hover/stat:text-zinc-200'
                                                    }`}>
                                                    {voice.likes ?? 0}
                                                </span>
                                            </button>
                                            <div className="flex items-center gap-1.5 group/stat">
                                                <Mic className="w-4 h-4 text-zinc-400" />
                                                <span className="text-xs font-bold text-zinc-500">
                                                    {voice.uses || 0} uses
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleShare(voice)}
                                                className="flex items-center gap-1.5 group/stat ml-auto cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 p-1 rounded-lg transition-all"
                                                title="Share professional link"
                                            >
                                                <Share2 className="w-4 h-4 text-zinc-400 group-hover/stat:text-zinc-900 dark:group-hover/stat:text-zinc-200 transition-colors" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mt-auto">
                                        <button
                                            onClick={() => handlePreview(voice)}
                                            disabled={isPreviewLoading === voice.voiceId}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${playingVoiceId === voice.voiceId ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30' : ''
                                                }`}
                                        >
                                            {isPreviewLoading === voice.voiceId ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : playingVoiceId === voice.voiceId ? (
                                                <>
                                                    <Pause className="w-4 h-4 fill-current" /> Stop
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 fill-current" /> Preview
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => handleUseVoice(voice.voiceId)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
                                        >
                                            <Zap className="w-4 h-4 fill-current" /> Get Voice
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {
                sharingVoice && (
                    <ShareVoiceModal
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        voiceName={sharingVoice.name}
                        shareUrl={sharingVoice.url}
                    />
                )
            }
        </div >
    );
}
