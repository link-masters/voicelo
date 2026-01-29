import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Mic, Speaker, Globe, Zap, User, Heart } from "lucide-react";

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
    creatorId?: string;
    isFavorite?: boolean;
}

interface VoiceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectVoice: (voice: VoiceOption) => void;
    voices: VoiceOption[];
    currentVoiceId?: string;
    userId?: string;
    userName?: string;
}

import ModalPortal from "./ModalPortal";

export default function VoiceSelectionModal({ isOpen, onClose, onSelectVoice, voices, currentVoiceId, userId, userName }: VoiceSelectionModalProps) {
    const [activeTab, setActiveTab] = useState<'default' | 'my-voices' | 'favorites'>('default');
    const [searchTerm, setSearchTerm] = useState("");

    // Filter voices based on categories
    const defaultVoices = voices.filter(v => v.source === 'inworld' && !v.isCommunity);

    // My Voices: Voices created by the user (clones)
    const myVoices = voices.filter(v =>
        v.isCommunity && userId && v.creatorId === userId
    );

    // Favorites: Voices bookmarked/liked by the user
    const favoriteVoices = voices.filter(v =>
        userId && v.likedBy?.includes(userId)
    );

    const displayVoices = activeTab === 'default'
        ? defaultVoices
        : activeTab === 'my-voices'
            ? myVoices
            : favoriteVoices;

    const filteredVoices = displayVoices.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh] md:max-h-[80vh] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-5 md:p-6 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">Select a Voice</h2>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Choose the perfect voice for your content</p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors z-20 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border border-border dark:border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Tabs */}
                <div className="flex-shrink-0 flex items-center px-4 md:px-6 overflow-x-auto scrollbar-hide gap-4 md:gap-8 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <button
                        onClick={() => setActiveTab('default')}
                        className={`py-3.5 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'default'
                            ? 'text-primary'
                            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <Zap className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === 'default' ? 'fill-primary/20' : ''}`} />
                        Default
                        {activeTab === 'default' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('my-voices')}
                        className={`py-3.5 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'my-voices'
                            ? 'text-primary'
                            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <User className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === 'my-voices' ? 'fill-primary/20' : ''}`} />
                        My Voices
                        {activeTab === 'my-voices' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`py-3.5 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'favorites'
                            ? 'text-primary'
                            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === 'favorites' ? 'fill-primary/20' : ''}`} />
                        Favorites
                        {activeTab === 'favorites' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="flex-shrink-0 p-4 md:p-5 bg-zinc-50/50 dark:bg-black/20 border-b border-zinc-200 dark:border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'default' ? 'default' : activeTab === 'my-voices' ? 'my cloned' : 'favorite'} voices...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl md:rounded-2xl py-3 md:py-3.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30 custom-scrollbar-alt">
                    {filteredVoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                <Mic className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-sm font-medium">No voices found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        filteredVoices.map((voice) => (
                            <button
                                key={voice.id}
                                onClick={() => {
                                    onSelectVoice(voice);
                                    onClose();
                                }}
                                className={`w-full text-left flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${currentVoiceId === voice.id
                                    ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/50'
                                    : 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-white/5 hover:border-primary/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${currentVoiceId === voice.id
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                                        : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400'
                                        }`}>
                                        {activeTab === 'favorites' ? <Heart className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-bold text-sm md:text-base mb-1 truncate transition-colors ${currentVoiceId === voice.id ? 'text-primary' : 'text-zinc-900 dark:text-white'
                                            }`}>
                                            {voice.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {voice.gender && (
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all
                                                    ${voice.gender === 'MALE'
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                                                        : voice.gender === 'FEMALE'
                                                            ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400'
                                                            : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${voice.gender === 'MALE' ? 'bg-blue-400' : voice.gender === 'FEMALE' ? 'bg-pink-400' : 'bg-zinc-400'}`} />
                                                    {voice.gender}
                                                </div>
                                            )}
                                            {activeTab === 'my-voices' && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                                                    OWNED
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${currentVoiceId === voice.id
                                    ? 'border-primary bg-primary'
                                    : 'border-zinc-200 dark:border-white/10'}`}>
                                    {currentVoiceId === voice.id && <Zap className="w-3 h-3 text-primary-foreground fill-current" />}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <style jsx>{`
                    .custom-scrollbar-alt::-webkit-scrollbar {
                        width: 10px;
                    }
                    .custom-scrollbar-alt::-webkit-scrollbar-track {
                        background: transparent;
                        margin: 10px 4px;
                    }
                    .custom-scrollbar-alt::-webkit-scrollbar-thumb {
                        background: rgba(161, 161, 170, 0.2);
                        border-radius: 20px;
                        border: 3px solid transparent;
                        background-clip: content-box;
                    }
                    .custom-scrollbar-alt::-webkit-scrollbar-thumb:hover {
                        background: rgba(161, 161, 170, 0.5);
                        border: 3px solid transparent;
                        background-clip: content-box;
                    }
                `}</style>
            </div>
        </ModalPortal>
    );
}
