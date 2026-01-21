"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getInworldVoices, getCommunityVoices, getUserVoices, toggleCommunityVoiceLike } from '@/app/actions';
import { useAuth } from './AuthContext';

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
}

interface VoiceContextType {
    officialVoices: Voice[];
    communityVoices: Voice[];
    loading: boolean;
    refreshVoices: (force?: boolean) => Promise<void>;
    toggleVoiceLike: (voiceId: string, userId: string) => Promise<void>;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [officialVoices, setOfficialVoices] = useState<Voice[]>([]);
    const [communityVoices, setCommunityVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState<number>(0);

    const refreshVoices = useCallback(async (force = false) => {
        // Only fetch if forced or if it's been more than 5 minutes since last fetch
        const now = Date.now();
        if (!force && lastFetched !== 0 && now - lastFetched < 5 * 60 * 1000) return;

        setLoading(true);
        try {
            const [official, community] = await Promise.all([
                getInworldVoices(),
                getCommunityVoices()
            ]);

            // Merge shadow info into official voices
            const mergedOfficial = official.map((offVoice: Voice) => {
                const shadow = community.find((commVoice: Voice) => commVoice.voiceId === offVoice.voiceId);
                if (shadow) {
                    return {
                        ...offVoice,
                        likes: shadow.likes || 0,
                        likedBy: shadow.likedBy || []
                    };
                }
                return offVoice;
            });

            // Filter community voices to only true clones/shared voices
            // (Official voices bookmarked by users have creatorName 'Inworld AI')
            const trueCommunity = community.filter((v: any) => v.creator !== 'Inworld AI');

            setOfficialVoices(mergedOfficial);
            setCommunityVoices(trueCommunity);
            setLastFetched(now);
        } catch (error) {
            console.error("Failed to fetch voices in context:", error);
        } finally {
            setLoading(false);
        }
    }, [lastFetched]);

    // Separate effect to fetch private voices only on the client when user is available
    useEffect(() => {
        if (user?.$id) {
            const fetchPrivateVoices = async () => {
                try {
                    const userVoices = await getUserVoices(user.$id);
                    if (userVoices && userVoices.length > 0) {
                        setCommunityVoices(prev => {
                            const combined = [...prev];
                            userVoices.forEach(uv => {
                                if (!combined.some(cv => cv.voiceId === uv.voiceId)) {
                                    combined.push(uv);
                                }
                            });
                            return combined;
                        });

                        // Also update official voices with user-specific shadow info if any
                        setOfficialVoices(prev => prev.map(offVoice => {
                            const shadow = userVoices.find(uv => uv.voiceId === offVoice.voiceId);
                            if (shadow) {
                                return {
                                    ...offVoice,
                                    likes: shadow.likes || 0,
                                    likedBy: shadow.likedBy || []
                                };
                            }
                            return offVoice;
                        }));
                    }
                } catch (error) {
                    console.error("Failed to fetch private voices:", error);
                }
            };
            fetchPrivateVoices();
        }
    }, [user?.$id]);

    const toggleVoiceLike = async (voiceId: string, userId: string) => {
        // 1. Find if it's in community OR official voices
        const isOfficial = officialVoices.some(v => v.voiceId === voiceId);
        const voice = isOfficial
            ? officialVoices.find(v => v.voiceId === voiceId)
            : communityVoices.find(v => v.voiceId === voiceId);

        if (!voice) return;

        const hasLiked = voice.likedBy?.includes(userId);
        const increment = hasLiked ? -1 : 1;

        // 2. Optimistic Update
        if (isOfficial) {
            setOfficialVoices(prev => prev.map(v =>
                v.voiceId === voiceId ? {
                    ...v,
                    likes: Math.max(0, (v.likes || 0) + increment),
                    likedBy: hasLiked
                        ? (v.likedBy || []).filter(id => id !== userId)
                        : [...(v.likedBy || []), userId]
                } : v
            ));
        } else {
            setCommunityVoices(prev => prev.map(v =>
                v.voiceId === voiceId ? {
                    ...v,
                    likes: Math.max(0, (v.likes || 0) + increment),
                    likedBy: hasLiked
                        ? (v.likedBy || []).filter(id => id !== userId)
                        : [...(v.likedBy || []), userId]
                } : v
            ));
        }

        try {
            // 3. Server Update (pass basic metadata for non-existent official voices)
            await toggleCommunityVoiceLike(voiceId, userId, {
                displayName: voice.displayName,
                isCommunity: voice.isCommunity || false,
                gender: voice.gender
            });
        } catch (error) {
            console.error("Failed to toggle like in context:", error);
            // 4. Revert on failure
            refreshVoices(true);
        }
    };

    useEffect(() => {
        refreshVoices();
    }, [refreshVoices]);

    return (
        <VoiceContext.Provider value={{ officialVoices, communityVoices, loading, refreshVoices, toggleVoiceLike }}>
            {children}
        </VoiceContext.Provider>
    );
}

export function useVoices() {
    const context = useContext(VoiceContext);
    if (context === undefined) {
        throw new Error('useVoices must be used within a VoiceProvider');
    }
    return context;
}
