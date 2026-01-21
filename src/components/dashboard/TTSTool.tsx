"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Pause, Download, Volume2, Type, RefreshCw, Wand2, Settings2, History, Clock, Loader2, RotateCcw, Trash2, Copy, Check, VolumeX, ChevronDown, X, User, AlertTriangle, Info } from "lucide-react";
import VoiceSelectionModal from "./VoiceSelectionModal";
import PricingModal from "./PricingModal";
import PaymentAlertModal, { AlertType } from "./PaymentAlertModal";
import { getInworldVoices, getCommunityVoices, synthesizeInworldSpeech } from "@/app/actions";
import { useAuth } from "@/context/AuthContext";
import { useVoices } from "@/context/VoiceContext";
import { useNotifications } from "@/context/NotificationContext";

interface VoiceOption {
    id: string;
    name: string;
    source: 'browser' | 'inworld';
    nativeVoice?: SpeechSynthesisVoice;
    inworldId?: string;
    isCommunity?: boolean;
    gender?: string;
    likedBy?: string[];
    creator?: string;
}

interface HistoryItem {
    id: string;
    text: string;
    voiceId: string;
    voiceName: string;
    timestamp: string;
    audioData?: string; // Base64 encoded audio data
    settings: {
        rate: number;
        pitch: number;
        textNormalization: 'APPLY_TEXT_NORMALIZATION_UNSPECIFIED' | 'ON' | 'OFF';
    };
}

export default function TTSTool() {
    const { user, refreshUser } = useAuth();
    const { officialVoices, communityVoices, loading: voicesLoading } = useVoices();
    const searchParams = useSearchParams();
    const voiceParam = searchParams.get('voice');
    const { addNotification } = useNotifications();

    const [text, setText] = useState("Welcome to VoiceLo. Experience the future of voice synthesis today.");
    const [voices, setVoices] = useState<VoiceOption[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [textNormalization, setTextNormalization] = useState<'APPLY_TEXT_NORMALIZATION_UNSPECIFIED' | 'ON' | 'OFF'>('APPLY_TEXT_NORMALIZATION_UNSPECIFIED');
    const [autoplay, setAutoplay] = useState(true);

    // Audio Player State
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playerVolume, setPlayerVolume] = useState(1);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isNormalizationOpen, setIsNormalizationOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentModalType, setPaymentModalType] = useState<AlertType>('billing_ended');
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    const isBillingEnded = (user?.prefs as any)?.isBillingEnded === true;

    // Refs
    const synth = useRef<SpeechSynthesis | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [generationHistory, setGenerationHistory] = useState<HistoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('tts_history');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { return []; }
            }
        }
        return [];
    });
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Use context voices to update local formatted voices
    useEffect(() => {
        const inworldList = [...officialVoices, ...communityVoices];
        const formattedVoices: VoiceOption[] = inworldList
            .filter((v: any) => {
                if (v.isCommunity) {
                    return v.isPublic || (user?.name && v.creator === user.name);
                }
                return true;
            })
            .map((v: any) => {
                const displayName = v.displayName || v.baseName || v.voiceId;
                return {
                    id: v.voiceId,
                    name: displayName,
                    source: 'inworld',
                    inworldId: v.voiceId,
                    isCommunity: v.isCommunity || v.voiceId.includes('__'),
                    gender: v.gender?.toUpperCase(),
                    likedBy: v.likedBy || [],
                    creator: v.creator
                };
            });

        formattedVoices.sort((a, b) => a.name.localeCompare(b.name));
        setVoices(formattedVoices);
    }, [officialVoices, communityVoices, user]);

    // Load Settings on mount
    useEffect(() => {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('voicelo_tts_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                setRate(settings.rate || 1);
                setPitch(settings.pitch || 1);
                setTextNormalization(settings.textNormalization || 'APPLY_TEXT_NORMALIZATION_UNSPECIFIED');
                setPlayerVolume(settings.playerVolume || 1);
                setAutoplay(settings.autoplay !== undefined ? settings.autoplay : true);
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, []);

    // Save History to SessionStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('tts_history', JSON.stringify(generationHistory));
        }
    }, [generationHistory]);

    // Effect to handle initial selection based on URL param or default
    useEffect(() => {
        if (voices.length > 0) {
            if (voiceParam) {
                // Try to find voice by name (case-insensitive)
                const preSelected = voices.find(v => v.name.toLowerCase() === voiceParam.toLowerCase());
                if (preSelected) {
                    setSelectedVoice(preSelected);
                } else if (!selectedVoice) {
                    const defaultVoice = voices.find(v => v.source === 'inworld') || voices[0];
                    setSelectedVoice(defaultVoice);
                }
            } else if (!selectedVoice) {
                const defaultVoice = voices.find(v => v.source === 'inworld') || voices[0];
                setSelectedVoice(defaultVoice);
            }
        }
    }, [voices, voiceParam]);


    // Update audio element volume when volume state changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = playerVolume;
        }
    }, [playerVolume]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };



    // Handle Generation Only
    const handleGenerate = async () => {
        if (!selectedVoice) return;

        // Check billing status
        if (isBillingEnded) {
            setPaymentModalType('billing_ended');
            setIsPaymentModalOpen(true);
            return;
        }

        // --- Stop Previous ---
        handleStop();

        // --- Add to History Function ---
        const addToHistory = (base64Audio?: string) => {
            const newItem: HistoryItem = {
                id: Date.now().toString(),
                text: text,
                voiceId: selectedVoice.id,
                voiceName: selectedVoice.name,
                timestamp: new Date().toLocaleString(),
                audioData: base64Audio,
                settings: { rate, pitch, textNormalization }
            };
            setGenerationHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
        };

        // --- Start New ---
        if (selectedVoice.source === 'inworld') {
            if (!selectedVoice.inworldId) return;

            try {
                setIsGenerating(true);
                if (!user?.$id) throw new Error("Please sign in to generate audio.");

                const result = await synthesizeInworldSpeech(text, selectedVoice.inworldId, user.$id, {
                    speed: rate,
                    pitch: pitch,
                    applyTextNormalization: textNormalization
                });

                if (result.audioContent) {
                    const binaryString = window.atob(result.audioContent);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'audio/mp3' });
                    const url = URL.createObjectURL(blob);

                    setAudioUrl(url);
                    if (autoplay) {
                        setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.play().catch(e => console.log("Playback failed:", e));
                            }
                        }, 100);
                    }

                    // Save the base64 audio data (not blob URL) to history
                    addToHistory(result.audioContent);
                    await refreshUser();
                }
            } catch (err: any) {
                console.error("Inworld synthesis failed", err);
                if (err.message?.toLowerCase().includes("insufficient credits")) {
                    setPaymentModalType('insufficient_credits');
                    setIsPaymentModalOpen(true);
                } else {
                    addNotification({
                        title: "Synthesis Error",
                        message: err.message || "Synthesis failed. Please try again.",
                        type: "error"
                    });
                }
            } finally {
                setIsGenerating(false);
            }

        } else if (selectedVoice.source === 'browser' && synth.current && selectedVoice.nativeVoice) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = selectedVoice.nativeVoice;
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = playerVolume;

            utterance.onstart = () => {
                setIsSpeaking(true);
                addToHistory();
            };
            utterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };

            synth.current.speak(utterance);
        }
    };

    const handlePause = () => {
        setIsPaused(true);
        setIsSpeaking(false);
        if (synth.current?.speaking) synth.current.pause();
        if (audioRef.current) audioRef.current.pause();
    };

    const handleStop = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        if (synth.current) synth.current.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleDownload = () => {
        if (audioUrl) {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `voicelo_generation_${Date.now()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            addNotification({
                title: "Download Started",
                message: "Your audio file is being downloaded.",
                type: "info"
            });
        } else {
            addNotification({
                title: "Download Warning",
                message: "No audio file generated to download. (Browser voices cannot be downloaded natively)",
                type: "warning"
            });
        }
    };

    const restoreHistoryItem = (item: HistoryItem) => {
        const proLimit = Number(process.env.NEXT_PUBLIC_PRO_USER_CHAR_LIMIT || 25000);
        const charLimit = (user?.prefs as any)?.plan === "Pro User" ? proLimit : 1000;
        setText(item.text.slice(0, charLimit));
        setRate(item.settings.rate);
        setPitch(item.settings.pitch);
        setTextNormalization(item.settings.textNormalization || 'APPLY_TEXT_NORMALIZATION_UNSPECIFIED');

        const voice = voices.find(v => v.id === item.voiceId);
        if (voice) {
            setSelectedVoice(voice);
        } else {
            console.warn("Original voice not found available.");
        }
    };

    const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setGenerationHistory(prev => prev.filter(item => item.id !== id));
    };

    const copyText = (e: React.MouseEvent, textToCopy: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(textToCopy);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const downloadHistoryItem = (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        if (item.audioData) {
            try {
                // Convert base64 to blob
                const binaryString = window.atob(item.audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/mp3' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `voicelo_${item.voiceName.replace(/[^a-zA-Z0-9]/g, '_')}_${item.id}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Clean up the blob URL
                URL.revokeObjectURL(url);

                addNotification({
                    title: "Download Started",
                    message: "Your audio file is being downloaded.",
                    type: "info"
                });
            } catch (err) {
                console.error("Download failed:", err);
                addNotification({
                    title: "Download Failed",
                    message: "Failed to download audio. Please try regenerating.",
                    type: "error"
                });
            }
        } else {
            addNotification({
                title: "Audio Not Available",
                message: "This history item doesn't have audio saved. Please regenerate it.",
                type: "warning"
            });
        }
    };

    const handleResetSettings = () => {
        setRate(1);
        setPitch(1);
        setTextNormalization('APPLY_TEXT_NORMALIZATION_UNSPECIFIED');
        addNotification({
            title: "Settings Reset",
            message: "Voice settings have been reset to default.",
            type: "info"
        });
    };

    return (
        <div className="w-full h-full flex flex-col gap-6">
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
            />

            <PaymentAlertModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                type={paymentModalType}
                onUpgrade={() => {
                    setIsPaymentModalOpen(false);
                    setIsPricingModalOpen(true);
                }}
            />

            {isBillingEnded && (
                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">Billing Cycle Ended</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Your credits have expired. Purchase a new pack to resume generation.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shrink-0"
                    >
                        Buy Credits
                    </button>
                </div>
            )}


            {/* Hidden Audio Element for Playback */}
            <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onPlay={() => setIsSpeaking(true)}
                onPause={() => setIsSpeaking(false)}
                onEnded={() => {
                    setIsSpeaking(false);
                    setIsPaused(false);
                    setCurrentTime(0);
                }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onError={(e) => console.error("Audio Playback Error", e)}
            />

            {/* Content Grid */}
            <div className="w-full flex flex-col lg:grid lg:grid-cols-12 gap-6 relative z-10 h-full">

                {/* Left Side: Main Card */}
                <div className="lg:col-span-8 xl:col-span-9 w-full glass-panel rounded-2xl md:rounded-3xl shadow-xl border border-border dark:border-white/5 flex flex-col lg:h-[calc(100vh-140px)] min-h-[500px] md:min-h-[600px] relative">

                    {/* Editor Area */}
                    <div className="flex flex-col md:flex-row flex-1 overflow-visible">

                        {/* Left: Input */}
                        <div className="flex-1 p-4 md:p-6 lg:p-8 border-b md:border-b-0 md:border-r border-border dark:border-white/5 relative group bg-zinc-50/50 dark:bg-zinc-900/40 min-h-[300px] md:min-h-0 rounded-t-2xl md:rounded-t-0 md:rounded-tl-3xl">
                            {(() => {
                                const proLimit = Number(process.env.NEXT_PUBLIC_PRO_USER_CHAR_LIMIT || 25000);
                                const charLimit = (user?.prefs as any)?.plan === "Pro User" ? proLimit : 1000;
                                return (
                                    <>
                                        <div className="absolute top-4 md:top-6 left-4 md:left-8 flex items-center space-x-2 text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-50 select-none pointer-events-none">
                                            <Type className="w-3 h-3" />
                                            <span>Text Input</span>
                                        </div>
                                        <textarea
                                            className="w-full h-full bg-transparent border-none outline-none resize-none text-base md:text-lg lg:text-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 font-light leading-relaxed mt-8 md:mt-6 scrollbar-hide"
                                            placeholder="Type something amazing here..."
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            maxLength={charLimit}
                                            spellCheck={false}
                                        />
                                        <div className="absolute top-3 md:top-5 right-4 md:right-8 text-[10px] md:text-xs text-zinc-600 dark:text-zinc-300 font-bold bg-white/90 dark:bg-zinc-800/90 px-3 py-1.5 rounded-full backdrop-blur-md border border-zinc-200 dark:border-white/10 shadow-lg flex items-center gap-1 z-10">
                                            <span className={text.length >= charLimit ? "text-red-500" : "text-primary dark:text-primary"}>
                                                {text.length.toLocaleString()}
                                            </span>
                                            <span className="text-zinc-400 dark:text-zinc-500 font-medium">/ {charLimit.toLocaleString()} chars</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Right: Controls */}
                        <div className="w-full md:w-72 lg:w-80 bg-white/50 dark:bg-zinc-900/60 p-4 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-6 backdrop-blur-md border-t md:border-t-0 md:border-l border-border dark:border-white/5 md:rounded-tr-3xl">

                            {/* Voice Actor Selection */}
                            <div className="space-y-2 md:space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center text-[10px] md:text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        <User className="w-3 h-3 mr-2" />
                                        Voice Actor
                                    </label>
                                    <button
                                        onClick={handleResetSettings}
                                        title="Reset all settings to default"
                                        className="text-zinc-400 hover:text-primary transition-colors p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                                    >
                                        <RotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsVoiceModalOpen(true)}
                                        className="w-full flex items-center justify-between bg-white dark:bg-zinc-800/80 border border-border dark:border-zinc-700/50 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm dark:shadow-lg text-left"
                                    >
                                        <span className="truncate pr-2">{selectedVoice?.name || "Select a voice..."}</span>
                                        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                                    </button>

                                    <VoiceSelectionModal
                                        isOpen={isVoiceModalOpen}
                                        onClose={() => setIsVoiceModalOpen(false)}
                                        onSelectVoice={(voice) => setSelectedVoice(voice)}
                                        voices={voices}
                                        currentVoiceId={selectedVoice?.id}
                                        userId={user?.$id}
                                        userName={user?.name}
                                    />
                                </div>
                            </div>

                            {/* Sliders Area */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-col gap-4 md:gap-6 flex-1">
                                {/* Speed */}
                                <div className="space-y-2 md:space-y-3">
                                    <div className="flex justify-between text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                        <span>Speed</span>
                                        <span>{rate}x</span>
                                    </div>
                                    <input
                                        type="range" min="0.5" max="2" step="0.1"
                                        value={rate}
                                        onChange={(e) => setRate(parseFloat(e.target.value))}
                                        className="slider"
                                    />
                                </div>

                                {/* Pitch */}
                                <div className="space-y-2 md:space-y-3">
                                    <div className="flex justify-between text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                        <span>Pitch</span>
                                        <span>{pitch}</span>
                                    </div>
                                    <input
                                        type="range" min="0.5" max="2" step="0.1"
                                        value={pitch}
                                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                                        className="slider"
                                    />
                                </div>

                                {/* Text Normalization */}
                                <div className="space-y-2 md:space-y-3">
                                    <label className="flex items-center text-[10px] md:text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        <Wand2 className="w-3 h-3 mr-2" />
                                        Text Normalization
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsNormalizationOpen(!isNormalizationOpen)}
                                            className="w-full flex items-center justify-between bg-white dark:bg-zinc-800/80 border border-border dark:border-zinc-700/50 text-zinc-900 dark:text-zinc-200 text-sm rounded-xl px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm dark:shadow-lg text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${textNormalization === 'ON'
                                                    ? 'bg-emerald-500'
                                                    : textNormalization === 'OFF'
                                                        ? 'bg-zinc-400'
                                                        : 'bg-primary'
                                                    }`} />
                                                <span className="truncate">
                                                    {textNormalization === 'ON'
                                                        ? 'On - Expand text'
                                                        : textNormalization === 'OFF'
                                                            ? 'Off - Exact text'
                                                            : 'Auto (Recommended)'}
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${isNormalizationOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isNormalizationOpen && (
                                            <>
                                                {/* Backdrop */}
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setIsNormalizationOpen(false)}
                                                />

                                                {/* Options */}
                                                <div className="absolute z-50 w-full bottom-full mb-2 bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700/50 rounded-xl shadow-xl dark:shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                    {/* Auto Option */}
                                                    <button
                                                        onClick={() => {
                                                            setTextNormalization('APPLY_TEXT_NORMALIZATION_UNSPECIFIED');
                                                            setIsNormalizationOpen(false);
                                                        }}
                                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 ${textNormalization === 'APPLY_TEXT_NORMALIZATION_UNSPECIFIED'
                                                            ? 'bg-primary/5 dark:bg-primary/10'
                                                            : ''
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${textNormalization === 'APPLY_TEXT_NORMALIZATION_UNSPECIFIED'
                                                            ? 'border-primary bg-primary'
                                                            : 'border-zinc-300 dark:border-zinc-600'
                                                            }`}>
                                                            {textNormalization === 'APPLY_TEXT_NORMALIZATION_UNSPECIFIED' && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Auto</span>
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">Recommended</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Automatically decides when to normalize</p>
                                                        </div>
                                                    </button>

                                                    {/* On Option */}
                                                    <button
                                                        onClick={() => {
                                                            setTextNormalization('ON');
                                                            setIsNormalizationOpen(false);
                                                        }}
                                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 border-t border-zinc-100 dark:border-zinc-700/50 ${textNormalization === 'ON'
                                                            ? 'bg-primary/5 dark:bg-primary/10'
                                                            : ''
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${textNormalization === 'ON'
                                                            ? 'border-emerald-500 bg-emerald-500'
                                                            : 'border-zinc-300 dark:border-zinc-600'
                                                            }`}>
                                                            {textNormalization === 'ON' && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">On - Expand Text</span>
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                                "Dr. Smith" → "Doctor Smith"<br />
                                                                "3/10/25" → "March tenth, twenty twenty-five"
                                                            </p>
                                                        </div>
                                                    </button>

                                                    {/* Off Option */}
                                                    <button
                                                        onClick={() => {
                                                            setTextNormalization('OFF');
                                                            setIsNormalizationOpen(false);
                                                        }}
                                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 border-t border-zinc-100 dark:border-zinc-700/50 ${textNormalization === 'OFF'
                                                            ? 'bg-primary/5 dark:bg-primary/10'
                                                            : ''
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${textNormalization === 'OFF'
                                                            ? 'border-zinc-500 bg-zinc-500'
                                                            : 'border-zinc-300 dark:border-zinc-600'
                                                            }`}>
                                                            {textNormalization === 'OFF' && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Off - Exact Text</span>
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full font-medium whitespace-nowrap">Lower latency</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Reads text exactly as written</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto pt-4 md:pt-0">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !text.trim()}
                                    className={`w-full btn btn-primary py-3 md:py-4 text-xs md:text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow ${(isGenerating || !text.trim()) ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <Wand2 className="w-4 h-4 md:w-5 md:h-5 mr-2 fill-current" />
                                            Generate
                                        </div>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Modern Audio Player Footer */}
                    <div className="h-auto md:h-20 py-4 md:py-0 bg-white/90 dark:bg-zinc-950/80 border-t border-border dark:border-white/5 flex flex-col md:flex-row items-center px-4 md:px-8 gap-4 md:gap-6 backdrop-blur-md rounded-b-2xl md:rounded-b-3xl">
                        {audioUrl ? (
                            <>
                                <div className="w-full flex items-center gap-4 md:w-auto">
                                    {/* Playback Controls */}
                                    <button
                                        onClick={isSpeaking ? handlePause : () => audioRef.current?.play()}
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary hover:opacity-90 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 transition-all shrink-0"
                                    >
                                        {isSpeaking ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />}
                                    </button>

                                    {/* Mobile/Compact Download Only visible on mobile in this row */}
                                    <button
                                        onClick={handleDownload}
                                        className="md:hidden flex ml-auto items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider border border-primary/20"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Save</span>
                                    </button>
                                </div>

                                {/* Time & Progress */}
                                <div className="flex-1 w-full flex flex-col gap-1 pr-2">
                                    <div className="flex items-center justify-between text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider uppercase">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                    <div className="relative h-1.5 md:h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden group">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100 ease-linear"
                                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 0}
                                            step="0.01"
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Volume & Desktop Actions */}
                                <div className="hidden md:flex items-center gap-3 shrink-0 text-zinc-500 dark:text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        {playerVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        <div className="w-16 lg:w-24">
                                            <input
                                                type="range" min="0" max="1" step="0.1"
                                                value={playerVolume}
                                                onChange={(e) => setPlayerVolume(parseFloat(e.target.value))}
                                                className="slider h-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-8 bg-zinc-200 dark:bg-white/10 mx-1" />

                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors text-xs font-medium uppercase tracking-wide border border-border dark:border-white/5"
                                        title="Download Audio"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="w-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 space-x-2 opacity-50 py-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse" />
                                <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-center">Generate Audio to Play</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Generation History */}
                <div className="lg:col-span-4 xl:col-span-3 lg:h-[calc(100vh-140px)] flex flex-col">
                    <div className="glass-panel rounded-2xl md:rounded-3xl p-0 flex-1 flex flex-col border border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/30 overflow-hidden min-h-[400px]">
                        <div className="p-4 flex items-center justify-between gap-2 text-primary border-b border-border dark:border-white/5 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4" />
                                <h2 className="font-semibold tracking-wide text-xs md:text-sm">Recent History</h2>
                            </div>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                {generationHistory.length}
                            </span>
                        </div>

                        {/* Session Information Banner */}
                        <div className="px-4 py-3 bg-zinc-50/80 dark:bg-zinc-950/40 border-b border-border dark:border-white/5 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Info className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 leading-normal">
                                History is not saved to our servers. It's stored locally for this session and will be lost when the tab is closed.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent max-h-[500px] lg:max-h-none">
                            {generationHistory.length === 0 ? (
                                <div className="h-full py-12 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500 space-y-2">
                                    <Clock className="w-8 h-8 opacity-50" />
                                    <p className="text-sm">No history yet</p>
                                </div>
                            ) : (
                                generationHistory.map((item) => (
                                    <div key={item.id} className="group relative p-3 md:p-4 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl border border-border dark:border-white/5 shadow-sm dark:shadow-none hover:border-primary/30 transition-all">
                                        {/* Header: Timestamp & Voice */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <User className="w-3 h-3 text-primary" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                                        {item.voiceName.split('(')[0]}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                        {item.timestamp}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => deleteHistoryItem(e, item.id)}
                                                    className="p-1.5 hover:bg-red-500/10 text-zinc-400 dark:text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Text Preview */}
                                        <p className="text-zinc-600 dark:text-zinc-400 text-[11px] md:text-xs italic line-clamp-2 md:line-clamp-3 mb-3 pl-6 md:pl-8 border-l-2 border-zinc-200 dark:border-white/5">
                                            "{item.text}"
                                        </p>

                                        {/* Settings & Actions */}
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                                <span title="Speed">{item.settings.rate}x</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-white/10" />
                                                <span title="Pitch">P:{item.settings.pitch}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {item.audioData && (
                                                    <button
                                                        onClick={(e) => downloadHistoryItem(e, item)}
                                                        className="p-1.5 hover:bg-emerald-500/10 text-zinc-400 dark:text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors"
                                                        title="Download Audio"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => copyText(e, item.text, item.id)}
                                                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                                                    title="Copy Text"
                                                >
                                                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => restoreHistoryItem(item)}
                                                    className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-lg flex items-center gap-1.5 transition-colors border border-primary/20"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    <span className="hidden sm:inline">Restore</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

