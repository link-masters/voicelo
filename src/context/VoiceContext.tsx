"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
    creatorId?: string;
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
    const lastFetchedRef = useRef<number>(0);
    const lastUserIdRef = useRef<string | null>(user?.$id || null);

    const refreshVoices = useCallback(async (force = false) => {
        // Force refresh if user changed (login/logout)
        const userChanged = user?.$id !== lastUserIdRef.current;

        // Only fetch if forced, user changed, or if it's been more than 5 minutes since last fetch
        const now = Date.now();
        if (!force && !userChanged && lastFetchedRef.current !== 0 && now - lastFetchedRef.current < 5 * 60 * 1000) return;

        setLoading(true);
        lastUserIdRef.current = user?.$id || null;
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
            let trueCommunity = community.filter((v: any) => v.creator !== 'Inworld AI');

            // Also fetch private voices if user is logged in
            if (user?.$id) {
                try {
                    const userVoices = await getUserVoices(user.$id);
                    if (userVoices && userVoices.length > 0) {
                        userVoices.forEach(uv => {
                            if (!trueCommunity.some(cv => cv.voiceId === uv.voiceId)) {
                                trueCommunity.push(uv);
                            }
                        });
                    }
                } catch (userVoicesError) {
                    console.error("Failed to fetch private voices:", userVoicesError);
                }
            }

            setOfficialVoices(mergedOfficial);
            setCommunityVoices(trueCommunity);
            lastFetchedRef.current = now;
        } catch (error) {
            console.error("Failed to fetch voices in context:", error);
        } finally {
            setLoading(false);
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
