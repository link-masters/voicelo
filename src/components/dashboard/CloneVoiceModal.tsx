"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Mic, Loader2, CheckCircle2, AlertCircle, Music, Globe } from "lucide-react";
import { cloneInworldVoice } from "@/app/actions";
import { useAuth } from "@/context/AuthContext";

interface CloneVoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (voice: any) => void;
}

const LANGUAGES = [
    { code: "EN_US", label: "English (US)" },
    { code: "ZH_CN", label: "Chinese" },
    { code: "KO_KR", label: "Korean" },
    { code: "JA_JP", label: "Japanese" },
    { code: "RU_RU", label: "Russian" },
    { code: "IT_IT", label: "Italian" },
    { code: "ES_ES", label: "Spanish" },
    { code: "PT_BR", label: "Portuguese" },
    { code: "DE_DE", label: "German" },
    { code: "FR_FR", label: "French" },
    { code: "HI_IN", label: "Hindi" },
];

export default function CloneVoiceModal({ isOpen, onClose, onSuccess }: CloneVoiceModalProps) {
    const { user, refreshUser } = useAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const [formData, setFormData] = useState({
        displayName: "",
        description: "",
        langCode: "EN_US",
        audioData: "", // base64
        fileName: ""
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

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

        // 15 seconds limit check could be added here if needed using an Audio element
        // But for now, we'll just process it.

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            // Remove the data:audio/...;base64, prefix
            const base64Content = result.split(",")[1];
            setFormData(prev => ({
                ...prev,
                audioData: base64Content,
                fileName: file.name
            }));
            setError(null);
            setStep(2);
        };
        reader.onerror = () => setError("Failed to read file.");
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!formData.displayName) {
            setError("Please enter a name for your voice.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setProgress(10);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 500);

            const result = await cloneInworldVoice({
                displayName: formData.displayName,
                description: formData.description,
                langCode: formData.langCode,
                audioData: formData.audioData,
                userId: user?.$id || "",
            });

            clearInterval(progressInterval);
            setProgress(100);
            await refreshUser();

            setTimeout(() => {
                onSuccess(result.voice);
                onClose();
                // Reset for next time
                setStep(1);
                setFormData({
                    displayName: "",
                    description: "",
                    langCode: "EN_US",
                    audioData: "",
                    fileName: ""
                });
            }, 1000);

        } catch (err: any) {
            setError(err.message || "An error occurred while cloning the voice.");
            setIsSubmitting(false);
            setProgress(0);
        }
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => !isSubmitting && onClose()}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-white dark:bg-zinc-950 border border-border dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-border dark:border-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                <Mic className="w-5 h-5 text-indigo-500" />
                            </div>
                            Clone New Voice
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Create a custom neural voice from a short sample.</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative border-2 border-dashed border-border dark:border-white/10 rounded-[32px] p-12 flex flex-col items-center justify-center text-center hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all cursor-pointer"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="audio/*"
                                />

                                <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <Upload className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Upload Audio Sample</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                                    Drag and drop your audio file or click to browse.<br />
                                    <span className="text-indigo-500 font-medium">Recommended: 10-15 seconds of clear audio.</span>
                                </p>

                                <div className="mt-8 flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> MP3 / WAV / M4A</div>
                                    <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-white/10" />
                                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Clear Speech</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Voice Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. My Custom Voice"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                        className="w-full bg-zinc-50 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Language</label>
                                    <div className="relative">
                                        <select
                                            value={formData.langCode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, langCode: e.target.value }))}
                                            className="w-full bg-zinc-50 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                                            ))}
                                        </select>
                                        <Globe className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 px-1">Description (Optional)</label>
                                    <textarea
                                        placeholder="Describe the tone or use case..."
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-zinc-50 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none"
                                    />
                                </div>

                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-border dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Music className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{formData.fileName}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Ready to process</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-xs font-bold text-zinc-400 hover:text-indigo-500 transition-colors uppercase"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-zinc-50 dark:bg-white/2 border-t border-border dark:border-white/5 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-3.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={step === 1 || isSubmitting || !formData.displayName}
                        className={`relative group h-14 min-w-[160px] flex items-center justify-center gap-3 px-8 rounded-2xl text-sm font-bold uppercase tracking-widest overflow-hidden transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${isSubmitting ? 'bg-indigo-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Cloning... {progress}%</span>
                            </>
                        ) : (
                            <>
                                <span>Start Cloning</span>
                            </>
                        )}

                        {/* Progress Bar Background */}
                        {isSubmitting && (
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
