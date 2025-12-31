"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Search, Play, Zap, Loader2, Pause, Heart, Share2, MoreHorizontal, Shield, ShieldOff, Globe, Trash2, Calendar, User, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { getUserVoices, synthesizeInworldSpeech, toggleCommunityVoiceLike, updateVoicePrivacy, deleteUserVoice } from "@/app/actions";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ShareVoiceModal from "@/components/dashboard/ShareVoiceModal";

interface Voice {
    voiceId: string;
    docId?: string;
    displayName: string;
    description?: string;
    tags?: string[];
    languages?: string[];
    isCommunity?: boolean;
    isPublic?: boolean;
    creator?: string;
    gender?: string;
    likes?: number;
    likedBy?: string[];
    uses?: number;
    createdAt?: string;
}

export default function MyVoicesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Audio Preview State
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const voiceCache = React.useRef<Record<string, string>>({});

    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingVoice, setSharingVoice] = useState<{ name: string, url: string } | null>(null);

    const fetchUserVoices = async () => {
        if (!user?.$id) return;
        setLoading(true);
        try {
            const userVoices = await getUserVoices(user.$id);
            setVoices(userVoices);
        } catch (error) {
            console.error("Failed to fetch user voices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserVoices();
    }, [user?.$id]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const playAudio = async (url: string, voiceId: string) => {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setPlayingVoiceId(null);
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
        if (playingVoiceId === voice.voiceId) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setPlayingVoiceId(null);
            return;
        }

        if (audioRef.current) audioRef.current.pause();

        if (voiceCache.current[voice.voiceId]) {
            await playAudio(voiceCache.current[voice.voiceId], voice.voiceId);
            return;
        }

        try {
            setIsPreviewLoading(voice.voiceId);
            const textToSay = voice.description || "Hello, this is my custom cloned voice.";
            const result = await synthesizeInworldSpeech(
                textToSay,
                voice.voiceId,
                user?.$id || "preview_guest",
                { speed: 1.0, isPreview: true }
            );

            if (result.audioContent) {
                const binaryString = window.atob(result.audioContent);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                const blob = new Blob([bytes], { type: 'audio/mp3' });
                const url = URL.createObjectURL(blob);
                voiceCache.current[voice.voiceId] = url;
                await playAudio(url, voice.voiceId);
            }
        } catch (error) {
            console.error("Preview failed", error);
            setIsPreviewLoading(null);
            setPlayingVoiceId(null);
        }
    };

    const handleShare = (voice: Voice) => {
        const shareId = voice.docId || voice.voiceId;
        const url = `${window.location.origin}/share/voice/${shareId}`;
        setSharingVoice({ name: voice.displayName, url });
        setIsShareModalOpen(true);
    };

    const handleTogglePrivacy = async (voice: Voice) => {
        if (!voice.docId) return;
        const newStatus = !voice.isPublic;

        setVoices(prev => prev.map(v => v.docId === voice.docId ? { ...v, isPublic: newStatus } : v));

        try {
            await updateVoicePrivacy(voice.docId, newStatus);
        } catch (error) {
            console.error("Privacy update failed", error);
            setVoices(prev => prev.map(v => v.docId === voice.docId ? { ...v, isPublic: !newStatus } : v));
        }
    };

    const handleDeleteVoice = async (voice: Voice) => {
        if (!voice.docId) return;

        const confirmed = window.confirm(`Are you sure you want to delete "${voice.displayName}"? This action cannot be undone.`);
        if (!confirmed) return;

        setVoices(prev => prev.filter(v => v.docId !== voice.docId));
        setActiveMenu(null);

        try {
            await deleteUserVoice(voice.docId);
        } catch (error) {
            console.error("Delete failed", error);
            fetchUserVoices();
            alert("Failed to delete voice. Please try again.");
        }
    };

    const filteredVoices = voices.filter(v =>
        v.displayName.toLowerCase().includes(filter.toLowerCase()) ||
        v.description?.toLowerCase().includes(filter.toLowerCase())
    );

    const totalPages = Math.ceil(filteredVoices.length / itemsPerPage);
    const currentVoices = filteredVoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 p-4 md:p-6 lg:p-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">My Cloned Voices</h1>
                    <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium">Manage and monitor the performance of your custom voice clones.</p>
                </div>
                <Link
                    href="/dashboard/voice-clone"
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-lg shadow-primary/20 active:scale-95 shrink-0 group"
                >
                    <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Clone New Voice
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-6 md:p-8 shadow-sm group hover:border-primary/20 transition-colors">
                    <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <Mic className="w-6 h-6" />
                    </div>
                    <p className="text-xs md:text-sm font-black text-zinc-400 uppercase tracking-widest mb-1">Total Clones</p>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-none">{voices.length}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-6 md:p-8 shadow-sm group hover:border-red-500/20 transition-colors">
                    <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <p className="text-xs md:text-sm font-black text-zinc-400 uppercase tracking-widest mb-1">Total Likes</p>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-none">{voices.reduce((acc, v) => acc + (v.likes || 0), 0)}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-6 md:p-8 shadow-sm group hover:border-amber-500/20 transition-colors sm:col-span-2 lg:col-span-1">
                    <div className="bg-amber-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <p className="text-xs md:text-sm font-black text-zinc-400 uppercase tracking-widest mb-1">Total Uses</p>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-none">{voices.reduce((acc, v) => acc + (v.uses || 0), 0)}</h3>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search my voices..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm"
                />
                {filter && (
                    <button
                        onClick={() => setFilter("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/20 transition-all scale-90 hover:scale-100"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Voices List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Loading your voices...</p>
                </div>
            ) : filteredVoices.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900/40 border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-[2rem] md:rounded-[2.5rem] py-16 md:py-24 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-zinc-700 mb-8">
                        <Mic className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">No Voices Found</h3>
                    <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-sm mb-10 font-medium leading-relaxed">
                        {filter ? "We couldn't find any voices matching your search." : "You haven't cloned any voices yet. Start now to create your first digital twin."}
                    </p>
                    {!filter && (
                        <Link
                            href="/dashboard/voice-clone"
                            className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                        >
                            Get Started
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Voice</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center leading-none">Privacy</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center leading-none">Created</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right leading-none">Metrics</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right leading-none">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                    {currentVoices.map((voice) => (
                                        <tr key={voice.voiceId} className="group hover:bg-zinc-50/80 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0
                                                        ${voice.gender === 'MALE' ? 'bg-blue-600 shadow-blue-500/20' :
                                                            voice.gender === 'FEMALE' ? 'bg-pink-600 shadow-pink-500/20' : 'bg-primary shadow-primary/20'}
                                                    `}>
                                                        {voice.displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-zinc-900 dark:text-white truncate">{voice.displayName}</h3>
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                            <span>{voice.gender}</span>
                                                            <span className="text-zinc-200 dark:text-zinc-800">•</span>
                                                            <span>{voice.languages?.[0] || 'EN'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => handleTogglePrivacy(voice)}
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${voice.isPublic
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:scale-105'
                                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:scale-105'
                                                        }`}
                                                >
                                                    {voice.isPublic ? <Globe className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                                    {voice.isPublic ? 'Public' : 'Private'}
                                                </button>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                                                    {voice.createdAt ? new Date(voice.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    }) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Likes</span>
                                                        <span className="font-black text-zinc-900 dark:text-white">{voice.likes || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end min-w-[50px]">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Uses</span>
                                                        <span className="font-black text-zinc-900 dark:text-white">{voice.uses || 0}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right relative">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handlePreview(voice)}
                                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all
                                                            ${playingVoiceId === voice.voiceId
                                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                                : 'bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-primary dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-primary/10 border border-zinc-200 dark:border-white/10'}
                                                        `}
                                                    >
                                                        {isPreviewLoading === voice.voiceId ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : playingVoiceId === voice.voiceId ? (
                                                            <Pause className="w-4 h-4 fill-current" />
                                                        ) : (
                                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleShare(voice)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-primary dark:hover:text-primary border border-zinc-200 dark:border-white/10 transition-all hover:bg-zinc-100 dark:hover:bg-primary/10"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    <Link
                                                        href={`/dashboard?voiceId=${voice.voiceId}`}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                                    >
                                                        <Zap className="w-4 h-4 fill-current" />
                                                    </Link>
                                                    <div className="relative group/menu">
                                                        <button
                                                            onClick={() => setActiveMenu(activeMenu === voice.voiceId ? null : voice.voiceId)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-primary dark:hover:text-primary border border-zinc-200 dark:border-white/10 transition-all"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                        {activeMenu === voice.voiceId && (
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                <button
                                                                    onClick={() => handleDeleteVoice(voice)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors uppercase tracking-widest text-[9px]"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Delete Voice
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                        {currentVoices.map((voice) => (
                            <div key={voice.voiceId} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 p-5 shadow-sm space-y-5 animate-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0
                                            ${voice.gender === 'MALE' ? 'bg-blue-600 shadow-blue-500/20' :
                                                voice.gender === 'FEMALE' ? 'bg-pink-600 shadow-pink-500/20' : 'bg-primary shadow-primary/20'}
                                        `}>
                                            {voice.displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-zinc-900 dark:text-white truncate text-base leading-tight">{voice.displayName}</h3>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                                                <span>{voice.gender}</span>
                                                <span className="text-zinc-200 dark:text-zinc-800">•</span>
                                                <span>{voice.languages?.[0] || 'EN'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePreview(voice)}
                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shrink-0
                                            ${playingVoiceId === voice.voiceId
                                                ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30'
                                                : 'bg-zinc-50 dark:bg-white/5 text-zinc-400 border border-zinc-200 dark:border-white/10 shadow-sm'}
                                        `}
                                    >
                                        {isPreviewLoading === voice.voiceId ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : playingVoiceId === voice.voiceId ? (
                                            <Pause className="w-5 h-5 fill-current" />
                                        ) : (
                                            <Play className="w-5 h-5 fill-current ml-0.5" />
                                        )}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <Heart className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Likes</span>
                                        </div>
                                        <span className="text-sm font-black text-zinc-900 dark:text-white leading-none">{voice.likes || 0}</span>
                                    </div>
                                    <div className="p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <Zap className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Uses</span>
                                        </div>
                                        <span className="text-sm font-black text-zinc-900 dark:text-white leading-none">{voice.uses || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleTogglePrivacy(voice)}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${voice.isPublic
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                                                }`}
                                        >
                                            {voice.isPublic ? <Globe className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                            {voice.isPublic ? 'Public' : 'Private'}
                                        </button>
                                        <span className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                            title={voice.createdAt ? new Date(voice.createdAt).toLocaleDateString() : ''}
                                        >
                                            <Info className="w-4 h-4" />
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard?voiceId=${voice.voiceId}`}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        >
                                            <Zap className="w-4 h-4 fill-current" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteVoice(voice)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-100 dark:border-red-500/20 active:scale-95 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 px-2">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                Showing <span className="text-zinc-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-zinc-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredVoices.length)}</span> of <span className="text-zinc-900 dark:text-white">{filteredVoices.length}</span> voices
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-1 mx-2">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        if (totalPages <= 5 || pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all active:scale-95 ${currentPage === pageNum
                                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-primary/50 hover:text-primary'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-zinc-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {sharingVoice && (
                <ShareVoiceModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    voiceName={sharingVoice.name}
                    shareUrl={sharingVoice.url}
                />
            )}
        </div>
    );
}
