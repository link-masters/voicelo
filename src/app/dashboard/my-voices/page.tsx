"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Search, Play, Zap, Loader2, Pause, Heart, Share2, MoreHorizontal, Shield, ShieldOff, Globe, Trash2, Calendar, User, X, ChevronLeft, ChevronRight } from "lucide-react";
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
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
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
        const handleInteraction = (e: MouseEvent | WheelEvent) => {
            if (openMenuId && !(e.target as HTMLElement).closest('.menu-container')) {
                setOpenMenuId(null);
                setMenuPosition(null);
            }
        };

        const handleScroll = () => {
            if (openMenuId) {
                setOpenMenuId(null);
                setMenuPosition(null);
            }
        };

        document.addEventListener('mousedown', handleInteraction);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [openMenuId]);

    const handleMenuClick = (e: React.MouseEvent, voiceId: string) => {
        if (openMenuId === voiceId) {
            setOpenMenuId(null);
            setMenuPosition(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.top,
            left: rect.left + rect.width
        });
        setOpenMenuId(voiceId);
    };

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

        // Optimistic Update
        setVoices(prev => prev.map(v => v.docId === voice.docId ? { ...v, isPublic: newStatus } : v));

        try {
            await updateVoicePrivacy(voice.docId, newStatus);
        } catch (error) {
            console.error("Privacy update failed", error);
            // Rollback
            setVoices(prev => prev.map(v => v.docId === voice.docId ? { ...v, isPublic: !newStatus } : v));
        }
    };

    const handleDeleteVoice = async (voice: Voice) => {
        if (!voice.docId) return;

        const confirmed = window.confirm(`Are you sure you want to delete "${voice.displayName}"? This action cannot be undone.`);
        if (!confirmed) return;

        // Optimistic Update
        setVoices(prev => prev.filter(v => v.docId !== voice.docId));
        setOpenMenuId(null);
        setMenuPosition(null);

        try {
            await deleteUserVoice(voice.docId);
        } catch (error) {
            console.error("Delete failed", error);
            // Rollback - fetch voices again to be safe
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

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 p-6 lg:p-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">My Cloned Voices</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Manage and monitor the performance of your custom voice clones.</p>
                </div>
                <Link
                    href="/dashboard/voice-clone"
                    className="flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0 group"
                >
                    <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Clone New Voice
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-8 shadow-sm group hover:border-indigo-500/20 transition-colors">
                    <div className="bg-indigo-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                        <Mic className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500 mb-1">Total Clones</p>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{voices.length}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-8 shadow-sm group hover:border-red-500/20 transition-colors">
                    <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500 mb-1">Total Likes</p>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{voices.reduce((acc, v) => acc + (v.likes || 0), 0)}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5 p-8 shadow-sm group hover:border-amber-500/20 transition-colors">
                    <div className="bg-amber-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500 mb-1">Total Uses</p>
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{voices.reduce((acc, v) => acc + (v.uses || 0), 0)}</h3>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search my voices..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-sm"
                />
                {filter && (
                    <button
                        onClick={() => setFilter("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/20 transition-all scale-90 hover:scale-100"
                        title="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Voices List Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Loading your voices...</p>
                </div>
            ) : filteredVoices.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900/40 border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-zinc-700 mb-6">
                        <Mic className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">No Voices Found</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8 font-medium">
                        {filter ? "We couldn't find any voices matching your search." : "You haven't cloned any voices yet. Start now to create your first digital twin."}
                    </p>
                    {!filter && (
                        <Link
                            href="/dashboard/voice-clone"
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                        >
                            Get Started
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/5">
                                        <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Voice</th>
                                        <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Privacy</th>
                                        <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Created</th>
                                        <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Metrics</th>
                                        <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                    {currentVoices.map((voice) => (
                                        <tr key={voice.voiceId} className="group hover:bg-zinc-50/80 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0
                                                    ${voice.gender === 'MALE' ? 'bg-blue-600 shadow-blue-500/20' :
                                                            voice.gender === 'FEMALE' ? 'bg-pink-600 shadow-pink-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}
                                                `}>
                                                        {voice.displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-zinc-900 dark:text-white truncate">{voice.displayName}</h3>
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                            <span>{voice.gender}</span>
                                                            <span>•</span>
                                                            <span>{voice.languages?.[0] || 'EN'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {voice.isPublic ? (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                        <Globe className="w-3 h-3" />
                                                        Public
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                        <Shield className="w-3 h-3" />
                                                        Private
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                                                    {voice.createdAt ? new Date(voice.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Likes</span>
                                                        <span className="font-black text-zinc-900 dark:text-white">{voice.likes || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end min-w-[50px]">
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Uses</span>
                                                        <span className="font-black text-zinc-900 dark:text-white">{voice.uses || 0}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right relative">
                                                <div className="flex items-center justify-end gap-2 text-right">
                                                    <button
                                                        onClick={() => handlePreview(voice)}
                                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all
                                                        ${playingVoiceId === voice.voiceId
                                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10'}
                                                    `}
                                                        title={playingVoiceId === voice.voiceId ? "Stop" : "Listen"}
                                                    >
                                                        {isPreviewLoading === voice.voiceId ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : playingVoiceId === voice.voiceId ? (
                                                            <Pause className="w-4 h-4 fill-current" />
                                                        ) : (
                                                            <Play className="w-4 h-4 fill-current" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleShare(voice)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 transition-all"
                                                        title="Share Voice"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/text-to-speech?voice=${voice.voiceId}`}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 dark:text-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-lg border border-transparent dark:border-white/10"
                                                        title="Use in Studio"
                                                    >
                                                        <Zap className="w-4 h-4 fill-current" />
                                                    </Link>

                                                    <div className="menu-container">
                                                        <button
                                                            onClick={(e) => handleMenuClick(e, voice.voiceId)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all border border-transparent"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>

                                                        {openMenuId === voice.voiceId && menuPosition && (
                                                            <div
                                                                style={{
                                                                    position: 'fixed',
                                                                    top: `${menuPosition.top - 8}px`,
                                                                    left: `${menuPosition.left - 224}px`, // w-56 is 224px
                                                                    transform: 'translateY(-100%)'
                                                                }}
                                                                className="w-56 bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ring-1 ring-zinc-200 dark:ring-white/5"
                                                            >
                                                                {/* Privacy Toggle Section */}
                                                                <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 mb-1">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <Globe className="w-4 h-4 text-zinc-500" />
                                                                            <span className="text-sm font-medium text-zinc-900 dark:text-white">Public Mode</span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleTogglePrivacy(voice)}
                                                                            className={`relative w-9 h-5 rounded-full transition-colors ${voice.isPublic ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-white/10'}`}
                                                                        >
                                                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${voice.isPublic ? 'translate-x-4' : ''}`} />
                                                                        </button>
                                                                    </div>
                                                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium text-left">
                                                                        {voice.isPublic
                                                                            ? "Anyone can discover and use this voice in the community."
                                                                            : "Only you can see and use this voice. It won't appear in discovery."}
                                                                    </p>
                                                                </div>

                                                                {/* Delete Action */}
                                                                <button
                                                                    onClick={() => handleDeleteVoice(voice)}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete Voice
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 px-2">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
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
                                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all active:scale-95 ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-600'
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
                </>
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
