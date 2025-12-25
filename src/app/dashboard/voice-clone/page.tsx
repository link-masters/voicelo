"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, Play, Info, CheckCircle2, AlertCircle, Loader2, Music, Globe, Trash2, ChevronDown, Check } from "lucide-react";
import { cloneInworldVoice } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const LANGUAGES = [
    { code: "EN_US", label: "English" },
    { code: "ZH_CN", label: "Chinese" },
    { code: "JA_JP", label: "Japanese" },
    { code: "KO_KR", label: "Korean" },
    { code: "RU_RU", label: "Russian" },
    { code: "IT_IT", label: "Italian" },
    { code: "ES_ES", label: "Spanish" },
    { code: "PT_BR", label: "Portuguese" },
    { code: "DE_DE", label: "German" },
    { code: "FR_FR", label: "French" },
    { code: "AR_SA", label: "Arabic" },
    { code: "HI_IN", label: "Hindi" },
    { code: "HE_IL", label: "Hebrew" },
    { code: "PL_PL", label: "Polish" },
    { code: "NL_NL", label: "Dutch" },
];

export default function VoiceClonePage() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState(0);

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
            setError("Please upload an audio file (mp3, wav, etc.).");
            return;
        }

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
        reader.onerror = () => setError("Failed to read file.");
        reader.readAsDataURL(file);
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
            setError("Please enter a name for your voice.");
            return;
        }
        if (!formData.audioData) {
            setError("Please upload an audio sample first.");
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

            await cloneInworldVoice({
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

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (err: any) {
            setError(err.message || "An error occurred while cloning the voice.");
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
        <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-indigo-500" />
                    </div>
                    Voice Cloning
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    Create a digital twin of any voice with high-fidelity neural processing. Our engine captures nuances, tone, and inflection.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left: Settings & Details */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div className="glass-panel rounded-[2rem] p-8 border border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/30 space-y-6 shadow-xl shadow-zinc-200/20 dark:shadow-none">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">Voice Configuration</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Voice Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. My Professional Voice"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                    disabled={isSubmitting}
                                    className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Language</label>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => !isSubmitting && setIsLangDropdownOpen(!isLangDropdownOpen)}
                                        disabled={isSubmitting}
                                        className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white flex items-center justify-between hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-indigo-500" />
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
                                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
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
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Description (Optional)</label>
                                <textarea
                                    placeholder="Briefly describe this voice..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    disabled={isSubmitting}
                                    className="w-full bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 px-1">Voice Gender</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "MALE" }))}
                                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${formData.gender === 'MALE'
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/10'
                                            : 'bg-white dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${formData.gender === 'MALE' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                                        Male
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, gender: "FEMALE" }))}
                                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${formData.gender === 'FEMALE'
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
                            <div className="p-5 rounded-[2rem] border border-zinc-200 dark:border-white/5 bg-indigo-50/30 dark:bg-indigo-500/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-500 shadow-sm">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Make Public</h4>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Share this voice with the community</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                                        className={`w-12 h-6 rounded-full transition-all relative ${formData.isPublic ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isPublic ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {formData.isPublic && (
                                    <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-indigo-500/10">
                                        <p className="text-[10px] leading-relaxed text-indigo-600/80 dark:text-indigo-400/80 italic text-center">
                                            "Public voices appear in the Community Shared tab for all users to discover and use."
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-3 text-green-600 dark:text-green-400 text-sm animate-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <p>Voice cloned successfully! Redirecting...</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20 flex gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 h-fit">
                                <Info className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Quality Tip</h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    High-quality audio (10-15s) results in a better digital twin.
                                </p>
                            </div>
                        </div>
                        <div className="p-5 rounded-3xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20 flex gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 h-fit">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Ethics</h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
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
                            className="glass-panel rounded-[2.5rem] p-16 border-2 border-dashed border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center gap-8 group hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all duration-500 cursor-pointer min-h-[400px]"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="audio/*"
                            />

                            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600/10 flex items-center justify-center text-zinc-400 group-hover:text-indigo-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl shadow-indigo-500/5">
                                <Upload className="w-10 h-10" />
                            </div>

                            <div className="max-w-md space-y-3">
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Upload Reference Audio</h3>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    Drag and drop your audio file or click to browse.<br />
                                    We recommend 10-15 seconds of clear, uninterrupted speech.
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    WAV, MP3, M4A
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    No Background Noise
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-[2.5rem] p-12 border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center gap-8 min-h-[400px] animate-in zoom-in-95 duration-500 shadow-2xl shadow-zinc-200/20 dark:shadow-none">
                            <div className="w-24 h-24 rounded-[2rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shadow-xl shadow-green-500/5">
                                <Music className="w-10 h-10" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{formData.fileName}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400">Audio sample loaded and ready to process.</p>
                            </div>

                            {/* Audio Verification Player */}
                            {audioUrl && (
                                <div className="w-full max-w-sm p-4 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 animate-in slide-in-from-bottom-2 duration-500">
                                    <audio
                                        src={audioUrl}
                                        controls
                                        controlsList="nodownload"
                                        autoPlay={false}
                                        className="w-full h-10 custom-audio-player"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={resetFile}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove File
                                </button>
                                <button
                                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
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
                    <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 max-w-xl mx-auto">
                        <div className="relative flex items-center h-5">
                            <input
                                id="agreement"
                                type="checkbox"
                                checked={hasAgreed}
                                onChange={(e) => setHasAgreed(e.target.checked)}
                                className="w-4 h-4 rounded border-zinc-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500/50 bg-white dark:bg-black/20 transition-all cursor-pointer"
                            />
                        </div>
                        <label htmlFor="agreement" className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
                            I confirm that I have the <span className="text-zinc-900 dark:text-white font-bold">legal rights and explicit permission</span> to clone this voice, and I agree to utilize this technology responsibly and ethically in accordance with the terms of service.
                        </label>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.audioData || !formData.displayName || !hasAgreed || !formData.langCode}
                        className={`w-fit mx-auto group relative h-14 flex items-center justify-center gap-3 px-10 rounded-2xl text-xs font-bold uppercase tracking-widest overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${isSubmitting ? 'bg-indigo-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Processing Neural Model... {progress}%</span>
                                <div
                                    className="absolute bottom-0 left-0 h-1.5 bg-white/30 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </>
                        ) : (
                            <>
                                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Initialize Voice Clone</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
