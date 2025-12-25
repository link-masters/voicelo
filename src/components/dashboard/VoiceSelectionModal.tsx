import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Mic, Speaker, Globe } from "lucide-react";

interface VoiceOption {
    id: string;
    name: string;
    source: 'browser' | 'inworld';
    nativeVoice?: SpeechSynthesisVoice;
    inworldId?: string;
    isCommunity?: boolean;
}

interface VoiceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectVoice: (voice: VoiceOption) => void;
    voices: VoiceOption[];
    currentVoiceId?: string;
}

export default function VoiceSelectionModal({ isOpen, onClose, onSelectVoice, voices, currentVoiceId }: VoiceSelectionModalProps) {
    const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
    const [searchTerm, setSearchTerm] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    // Filter voices based on tabs
    const defaultVoices = voices.filter(v => v.source === 'inworld' && !v.isCommunity && !v.id.includes('__'));
    const customVoices = voices.filter(v => v.source === 'browser' || (v.source === 'inworld' && (v.isCommunity || v.id.includes('__'))));

    const displayVoices = activeTab === 'default' ? defaultVoices : customVoices;

    const filteredVoices = displayVoices.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Select a Voice</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose the perfect voice for your content</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-6 pt-6 gap-6 border-b border-zinc-200 dark:border-white/5">
                    <button
                        onClick={() => setActiveTab('default')}
                        className={`pb-3 text-sm font-semibold transition-all relative ${activeTab === 'default'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        Default Voices
                        {activeTab === 'default' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`pb-3 text-sm font-semibold transition-all relative ${activeTab === 'custom'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        Custom Voices
                        {activeTab === 'custom' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-zinc-50 dark:bg-black/20 border-b border-zinc-200 dark:border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'default' ? 'default' : 'custom'} voices...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
                    {filteredVoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
                            <Mic className="w-12 h-12 mb-3 opacity-20" />
                            <p>No voices found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        filteredVoices.map((voice) => (
                            <button
                                key={voice.id}
                                onClick={() => {
                                    onSelectVoice(voice);
                                    onClose();
                                }}
                                className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${currentVoiceId === voice.id
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50'
                                    : 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-white/5 hover:border-indigo-500/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentVoiceId === voice.id
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400'
                                        }`}>
                                        {activeTab === 'default' ? <Mic className="w-5 h-5" /> : <Speaker className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold text-sm ${currentVoiceId === voice.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'
                                            }`}>
                                            {voice.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                            {activeTab === 'default' ? (
                                                <>
                                                    <Globe className="w-3 h-3" /> Inworld AI
                                                </>
                                            ) : (
                                                <>
                                                    <Speaker className="w-3 h-3" /> System Voice
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {currentVoiceId === voice.id && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                )}
                            </button>
                        ))
                    )}
                </div>


            </div>
        </div>,
        document.body
    );
}
