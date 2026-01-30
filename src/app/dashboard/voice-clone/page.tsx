"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, Play, Info, CheckCircle2, AlertCircle, Loader2, Music, Globe, Trash2, ChevronDown, Check, AlertTriangle, ArrowRight, FileAudio } from "lucide-react";
import { cloneInworldVoice } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toast, { ToastType } from "@/components/dashboard/Toast";
import PricingModal from "@/components/dashboard/PricingModal";
import PaymentAlertModal, { AlertType } from "@/components/dashboard/PaymentAlertModal";

const LANGUAGES = [
    { code: "EN_US", label: "English - US" },
    { code: "ZH_CN", label: "Chinese - China" },
    { code: "JA_JP", label: "Japanese - Japan" },
    { code: "KO_KR", label: "Korean - Korea" },
    { code: "RU_RU", label: "Russian - Russia" },
    { code: "IT_IT", label: "Italian - Italy" },
    { code: "ES_ES", label: "Spanish - Spain" },
    { code: "PT_BR", label: "Portuguese - Brazil" },
    { code: "DE_DE", label: "German - Germany" },
    { code: "FR_FR", label: "French - France" },
    { code: "AR_SA", label: "Arabic - Saudi Arabia" },
    { code: "HI_IN", label: "Hindi - India" },
    { code: "HE_IL", label: "Hebrew - Israel" },
    { code: "PL_PL", label: "Polish - Poland" },
    { code: "NL_NL", label: "Dutch - Netherlands" },
];

import { useVoices } from "@/context/VoiceContext";

export default function VoiceClonePage() {
    const { user, refreshUser } = useAuth();
    const { refreshVoices } = useVoices();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: ToastType } | null>(null);
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentModalType, setPaymentModalType] = useState<AlertType>('billing_ended');
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);

    const isBillingEnded = (user?.prefs as any)?.isBillingEnded === true;

    const [formData, setFormData] = useState({
        displayName: "",
        description: "",
        langCode: "",
        audioData: "", // base64
        fileName: "",
        isPublic: false,
        gender: "MALE" // Default to MALE
    });

    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLanguage = LANGUAGES.find(l => l.code === formData.langCode);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith("audio/")) {
            setNotification({ message: "Please upload an audio file (mp3, wav, etc.).", type: "error" });
            return;
        }

        // Check file size (limit to ~10MB for a 1-minute audio file)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setNotification({ message: "Audio file is too large. Please upload a file smaller than 10MB (approximately 1 minute of audio).", type: "error" });
            return;
        }

        // Create audio element to check duration
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = URL.createObjectURL(file);

        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(audio.src); // Clean up the object URL

            // Check duration (limit to 60 seconds)
            if (audio.duration > 60) {
                setNotification({ message: "Audio file is too long. Please upload an audio file shorter than 1 minute.", type: "error" });
                return;
            }

            // Read the file if it passes validation
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                const base64Content = result.split(",")[1];

                // Create URL for preview
                const url = URL.createObjectURL(file);
                setAudioUrl(url);

                setFormData(prev => ({
                    ...prev,
                    audioData: base64Content,
                    fileName: file.name
                }));
                setError(null);
            };
            reader.onerror = () => setNotification({ message: "Failed to read file.", type: "error" });
            reader.readAsDataURL(file);
        };

        audio.onerror = () => {
            URL.revokeObjectURL(audio.src); // Clean up the object URL
            setNotification({ message: "Invalid audio file or unable to read metadata.", type: "error" });
        };
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) await processFile(file);
    };

    const handleSubmit = async () => {
        if (!formData.displayName) {
            setNotification({ message: "Please enter a name for your voice.", type: "error" });
            return;
        }
        if (!formData.audioData) {
            setNotification({ message: "Please upload an audio sample first.", type: "error" });
            return;
        }
        if (!formData.langCode) {
            setNotification({ message: "Please select a language for your voice.", type: "error" });
            return;
        }

        if (isBillingEnded) {
            setPaymentModalType('billing_ended');
            setIsPaymentModalOpen(true);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setProgress(10);

        try {
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 800);

            if (!user?.$id) throw new Error("Please sign in to clone a voice.");

            const result = await cloneInworldVoice({
                displayName: formData.displayName,
                description: formData.description,
                langCode: formData.langCode,
                audioData: formData.audioData,
                userId: user.$id,
                isPublic: formData.isPublic,
                gender: formData.gender
            });

            clearInterval(progressInterval);
            setIsSubmitting(false);
            setProgress(100);
            setSuccess(true);
            await refreshUser();
            await refreshVoices(true);

            // Extract voice ID from result
            const voiceId = result?.voice?.voiceId || result?.voiceId || null;
            setClonedVoiceId(voiceId);
            setIsSuccessModalOpen(true);

        } catch (err: any) {
            if (err.message?.toLowerCase().includes("insufficient credits")) {
                setPaymentModalType('insufficient_credits');
                setIsPaymentModalOpen(true);
            } else if (err.message?.toLowerCase().includes("reached your voice clone limit")) {
                setPaymentModalType('limit_reached');
                setIsPaymentModalOpen(true);
            } else {
                setNotification({ message: err.message || "An error occurred while cloning the voice.", type: "error" });
            }
            setIsSubmitting(false);
            setProgress(0);
        }
    };

    const resetFile = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setFormData(prev => ({ ...prev, audioData: "", fileName: "" }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="h-full flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
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

            {/* Success Modal */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsSuccessModalOpen(false)}
                    ></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-green-500/10 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>

                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Voice Cloned Successfully!</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed text-sm md:text-base">
                                Your voice "{formData.displayName}" has been cloned and is ready to use.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push(`/dashboard/text-to-speech?voice=${encodeURIComponent(formData.displayName)}`)}
                                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group">
                                    <Mic className="w-5 h-5" />
                                    Use This Voice
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/my-voices')}
                                    className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-200 dark:hover:bg-white/10 transition-all font-sans text-sm flex items-center justify-center gap-2">
                                    <FileAudio className="w-4 h-4" />
                                    Go to My Voices
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Mic className="w-5 h-5 text-primary" />
                    </div>
                    Voice Cloning
                </h1>
                <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
                    Create a clone of any voice with high-fidelity neural processing. Our engine captures nuances, tone, and inflection.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left: Settings & Details */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-4 md:space-y-6">
                    <div className="glass-panel rounded-[2rem] p-6 md:p-8 border border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/30 space-y-5 md:space-y-6 shadow-xl shadow-zinc-200/20 dark:shadow-none">
                        <h3 className="text-[10px] md:text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">Voice Configuration</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Voice Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. My Professional Voice"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                    disabled={isSubmitting}
                                    className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 md:py-3.5 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium disabled:opacity-50 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Language</label>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => !isSubmitting && setIsLangDropdownOpen(!isLangDropdownOpen)}
                                        disabled={isSubmitting}
                                        className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 md:py-3.5 px-5 text-zinc-900 dark:text-white flex items-center justify-between hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium disabled:opacity-50 text-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-primary" />
                                            <div className="flex items-center gap-2">
                                                <span className={!selectedLanguage ? 'text-zinc-400' : ''}>
                                                    {selectedLanguage ? selectedLanguage.label : 'Select Language'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Custom Dropdown Content */}
                                    {isLangDropdownOpen && (
                                        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                                            <div className="max-h-60 overflow-y-auto scrollbar-hide py-2">
                                                {LANGUAGES.map(lang => (
                                                    <button
                                                        key={lang.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, langCode: lang.code }));
                                                            setIsLangDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-5 py-3 text-left flex items-center justify-between transition-colors ${formData.langCode === lang.code
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{lang.label}</span>
                                                        </div>
                                                        {formData.langCode === lang.code && <Check className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Description (Optional)</label>
                                <textarea
                                    placeholder="Briefly describe this voice..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    disabled={isSubmitting}
                                    className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 md:py-3.5 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium resize-none disabled:opacity-50 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 px-1">Voice Gender</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "MALE" }))}
                                        className={`flex items-center justify-center gap-3 py-3.5 md:p-4 rounded-2xl border transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest ${formData.gender === 'MALE'
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/10'
                                            : 'bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${formData.gender === 'MALE' ? 'bg-primary animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                                        Male
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "FEMALE" }))}
                                        className={`flex items-center justify-center gap-3 py-3.5 md:p-4 rounded-2xl border transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest ${formData.gender === 'FEMALE'
                                            ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-lg shadow-pink-500/10'
                                            : 'bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${formData.gender === 'FEMALE' ? 'bg-pink-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                                        Female
                                    </button>
                                </div>
                            </div>

                            {/* Public Choice */}
                            <div className="p-4 md:p-5 rounded-[2rem] border border-zinc-200 dark:border-white/5 bg-primary/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-primary shadow-sm shrink-0">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white">Make Public</h4>
                                            <p className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400">Share with the community</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                                        className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${formData.isPublic ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isPublic ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-xs md:text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-3 text-green-600 dark:text-green-400 text-sm animate-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <p className="text-xs md:text-sm">Voice cloned successfully! Redirecting...</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20 flex gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 h-fit shrink-0">
                                <Info className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white">Quality Tip</h4>
                                <p className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    High-quality audio (10-15s) results in a better clone.
                                </p>
                            </div>
                        </div>
                        <div className="p-5 rounded-3xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20 flex gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary h-fit shrink-0">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white">Ethics</h4>
                                <p className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    Only clone voices you have explicit permission to use.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Audio Sample Upload */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    {!formData.audioData ? (
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => !isSubmitting && fileInputRef.current?.click()}
                            className="glass-panel rounded-[2.5rem] p-8 md:p-16 border-2 border-dashed border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center gap-6 md:gap-8 group hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 cursor-pointer min-h-[300px] md:min-h-[400px]"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="audio/*"
                            />

                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl shadow-primary/5">
                                <Upload className="w-8 h-8 md:w-10 md:h-10" />
                            </div>

                            <div className="max-w-md space-y-3">
                                <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">Upload Reference Audio</h3>
                                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                                    Drag and drop your audio file or click to browse.<br />
                                    We recommend 10-15 seconds of clear speech (maximum 1 minute allowed).
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                                <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    WAV, MP3, M4A
                                </div>
                                <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    Clean Audio
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center gap-6 md:gap-8 min-h-[300px] md:min-h-[400px] animate-in zoom-in-95 duration-500 shadow-2xl shadow-zinc-200/20 dark:shadow-none">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-xl shadow-green-500/5 transition-all">
                                <Music className="w-8 h-8 md:w-10 md:h-10" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white truncate max-w-[250px] md:max-w-md mx-auto">{formData.fileName}</h3>
                                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Audio sample loaded and ready to process.</p>
                            </div>

                            {/* Audio Verification Player */}
                            {audioUrl && (
                                <div className="w-full max-w-sm p-3.5 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 animate-in slide-in-from-bottom-2 duration-500">
                                    <audio
                                        src={audioUrl}
                                        controls
                                        controlsList="nodownload"
                                        autoPlay={false}
                                        className="w-full h-10 custom-audio-player"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={resetFile}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                </button>
                                <button
                                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    Change File
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="audio/*"
                            />
                        </div>
                    )}

                    {/* Ethical Agreement */}
                    <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-200 dark:border-white/10 max-w-xl mx-auto">
                        <div className="relative flex items-center h-5 mt-0.5">
                            <input
                                id="agreement"
                                type="checkbox"
                                checked={hasAgreed}
                                onChange={(e) => setHasAgreed(e.target.checked)}
                                className="w-4.5 h-4.5 rounded border-zinc-300 dark:border-white/10 text-primary focus:ring-primary/50 bg-white dark:bg-black/20 transition-all cursor-pointer"
                            />
                        </div>
                        <label htmlFor="agreement" className="text-[10px] md:text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
                            I confirm that I have the <span className="text-zinc-900 dark:text-white font-bold">legal rights and explicit permission</span> to clone this voice, and I agree to use this technology responsibly and ethically.
                        </label>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.audioData || !formData.displayName || !hasAgreed || !formData.langCode}
                        className={`w-full sm:w-fit mx-auto group relative h-12 md:h-13 flex items-center justify-center gap-3 px-8 rounded-full text-[11px] font-black uppercase tracking-[0.15em] overflow-hidden transition-all duration-500 active:scale-[0.95] disabled:opacity-40 disabled:grayscale disabled:pointer-events-none
                            ${isSubmitting
                                ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400'
                                : 'bg-primary text-primary-foreground shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.1)] hover:-translate-y-0.5'
                            }`}
                    >
                        {/* Shine effect */}
                        {!isSubmitting && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                        )}

                        {isSubmitting ? (
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                </div>
                                <span className="text-zinc-600 dark:text-zinc-300">Cloning... {progress}%</span>

                                {/* Minimalist Progress Indicator */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-200 dark:bg-white/5">
                                    <div
                                        className="h-full bg-primary transition-all duration-500 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-white/20 blur-lg rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                                </div>
                                <span className="relative z-10">Initialize Voice Clone</span>
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
