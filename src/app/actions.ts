'use server'

const INWORLD_KEY = process.env.INWORLD_KEY;
const INWORLD_SECRET = process.env.INWORLD_SECRET;
// Fallback if user puts full Basic string in one var
const INWORLD_AUTH_TOKEN = process.env.INWORLD_AUTH_TOKEN;

const BASE_URL = 'https://api.inworld.ai/tts/v1';

const INWORLD_WORKSPACE = process.env.INWORLD_WORKSPACE;
const VOICES_BASE_URL = 'https://api.inworld.ai/voices/v1';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main';
const APPWRITE_VOICES_TABLE_ID = process.env.NEXT_PUBLIC_APPWRITE_VOICES_TABLE_ID || 'user_shared_voices';
const APPWRITE_BROADCASTS_ID = process.env.NEXT_PUBLIC_APPWRITE_BROADCASTS_ID || 'broadcasts';
const APPWRITE_USER_NOTIFICATIONS_ID = process.env.NEXT_PUBLIC_APPWRITE_USER_NOTIFICATIONS_ID || 'user_notifications';

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite-server";
import { OFFICIAL_VOICE_METADATA } from "@/config/voiceMetadata";

const getAuthHeader = () => {
    if (INWORLD_AUTH_TOKEN) {
        return `Basic ${INWORLD_AUTH_TOKEN}`;
    }
    if (!INWORLD_KEY || !INWORLD_SECRET) {
        throw new Error('Inworld API credentials not configured. Set INWORLD_KEY and INWORLD_SECRET.');
    }
    const token = Buffer.from(`${INWORLD_KEY}:${INWORLD_SECRET}`).toString('base64');
    return `Basic ${token}`;
};

export async function getInworldVoices() {
    try {
        const response = await fetch(`${BASE_URL}/voices`, {
            headers: {
                'Authorization': getAuthHeader(),
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error fetching voices:", response.status, errorText);
            return [];
        }

        const data = await response.json();
        const voices = data.voices || [];

        // Return only Official Voices and manually inject gender from config
        return voices
            .filter((v: any) => !v.voiceId.includes('__') && !v.description?.includes('[SHARED_BY:'))
            .map((v: any) => {
                const meta = OFFICIAL_VOICE_METADATA[v.voiceId];
                return {
                    ...v,
                    gender: meta?.gender || 'NEUTRAL',
                    tags: [] // Clear tags as requested
                };
            });
    } catch (error) {
        console.error('getInworldVoices error:', error);
        return [];
    }
}


export async function synthesizeInworldSpeech(
    text: string,
    voiceId: string,
    userId: string, // Pass userId for tracking
    options: {
        pitch?: number;
        speed?: number;
        isPreview?: boolean;
    } = {}
) {
    if (!options.isPreview && (!userId || typeof userId !== 'string')) {
        console.error("synthesizeInworldSpeech: Missing or invalid userId", { userId });
        throw new Error("Missing required parameter: userId");
    }

    try {
        let user: any = null;
        let creditsTotal = 0;
        let users: any = null;

        if (!options.isPreview) {
            const clientData = createAdminClient();
            users = clientData.users;
            user = await users.get(userId);

            creditsTotal = (user.prefs.creditsTotal as number) || 0;
            const billingCycleEnd = user.prefs.billingCycleEnd ? new Date(user.prefs.billingCycleEnd) : null;
            const now = new Date();

            // 1. Check if billing cycle has expired (Professional Locked State)
            if (user.prefs.lastPurchaseDate && billingCycleEnd && billingCycleEnd < now) {
                throw new Error("Your 30-day billing cycle has ended. Please purchase a new package to unlock and use your remaining credits.");
            }

            // 2. Check if user has enough credits
            const creditCost = text.length;
            const creditsBalance = ((user.prefs.creditsTotal as number) || 0) - ((user.prefs.creditsUsed as number) || 0);
            if (creditsBalance < creditCost) {
                throw new Error(`Insufficient credits. You need ${creditCost} credits, but only have ${creditsBalance} left.`);
            }
        }

        const body = {
            text,
            voiceId,
            modelId: 'inworld-tts-1',
            speakingRate: options.speed || 1.0,
            pitch: options.pitch || 1.0,
            audioEncoding: 'MP3',
        };

        const response = await fetch(`${BASE_URL}/voice`, {
            method: 'POST',
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Synthesize error:", response.status, errorText);
            throw new Error(`Inworld API Error: ${errorText}`);
        }

        const data = await response.json();

        // 3. Deduct credits on success (only if not a preview)
        if (!options.isPreview && users && user) {
            const creditCost = text.length;
            await users.updatePrefs(userId, {
                ...user.prefs,
                creditsUsed: Number(user.prefs.creditsUsed || 0) + creditCost
            });

            // 4. Increment usage if it's a community voice
            // We can check if this voiceId exists in our Appwrite table
            try {
                const { databases } = createAdminClient();
                const sharedVoices = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    APPWRITE_VOICES_TABLE_ID,
                    [Query.equal('voiceId', voiceId)]
                );

                if (sharedVoices.total > 0) {
                    const voiceDoc = sharedVoices.documents[0];
                    await databases.updateDocument(
                        APPWRITE_DATABASE_ID,
                        APPWRITE_VOICES_TABLE_ID,
                        voiceDoc.$id,
                        { uses: (voiceDoc.uses || 0) + 1 }
                    );
                }
            } catch (useError) {
                console.error("Failed to increment voice usage:", useError);
            }
        }

        return data;
    } catch (error) {
        console.error('synthesizeInworldSpeech error:', error);
        throw error;
    }
}

export async function cloneInworldVoice(formData: {
    displayName: string;
    description: string;
    langCode: string;
    audioData: string; // base64
    userId: string; // Add userId
    isPublic?: boolean;
    gender?: string;
}) {
    try {
        if (!INWORLD_WORKSPACE) {
            throw new Error('INWORLD_WORKSPACE environment variable is not set.');
        }

        if (!formData.userId || typeof formData.userId !== 'string') {
            console.error("cloneInworldVoice: Missing or invalid userId", { userId: formData.userId });
            throw new Error("Missing required parameter: userId");
        }

        const { users } = createAdminClient();
        const user = await users.get(formData.userId);

        const creditsTotal = (user.prefs.creditsTotal as number) || 0;
        const billingCycleEnd = user.prefs.billingCycleEnd ? new Date(user.prefs.billingCycleEnd) : null;
        const now = new Date();

        // 1. Billing Cycle Lock
        if (user.prefs.lastPurchaseDate && billingCycleEnd && billingCycleEnd < now) {
            throw new Error("Your 30-day billing cycle mode has ended. Purchase any package to unlock your credits and cloning features.");
        }

        // 2. Credit Cost (cloning is expensive, let's say 1000 credits)
        const CLONE_COST = 1000;
        const creditsBalance = ((user.prefs.creditsTotal as number) || 0) - ((user.prefs.creditsUsed as number) || 0);
        if (creditsBalance < CLONE_COST) {
            throw new Error(`Insufficient credits. Cloning costs ${CLONE_COST} credits.`);
        }

        const metadata = `[SHARED_BY:${user.name}][PUBLIC:${formData.isPublic || false}]`;
        const enrichedDescription = `${metadata} ${formData.description}`;

        const body = {
            displayName: formData.displayName,
            description: enrichedDescription,
            langCode: formData.langCode || 'EN_US',
            voiceSamples: [
                {
                    audioData: formData.audioData,
                }
            ],
            audioProcessingConfig: {
                removeBackgroundNoise: true
            }
        };

        const response = await fetch(`${VOICES_BASE_URL}/workspaces/${INWORLD_WORKSPACE}/voices:clone`, {
            method: 'POST',
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Cloning error:", response.status, errorText);
            throw new Error(`Inworld API Error: ${errorText}`);
        }

        const data = await response.json();

        // Inworld voices:clone often returns a nested 'voice' object
        // Example: { "voice": { "name": "workspaces/*/voices/ID", "voiceId": "ID", ... } }
        const voiceObj = data.voice || data;
        const voiceIdRaw = voiceObj.voiceId || voiceObj.name || "";
        const finalVoiceId = voiceIdRaw.includes('/') ? voiceIdRaw.split('/').pop() || voiceIdRaw : voiceIdRaw;

        // 3. Save to Appwrite
        await saveCommunityVoice({
            voiceId: finalVoiceId,
            name: formData.displayName,
            description: formData.description,
            creatorName: user.name,
            creatorId: formData.userId,
            isPublic: formData.isPublic || false,
            langCode: formData.langCode || 'EN_US',
            gender: formData.gender || 'MALE'
        });

        // 4. Deduct on success
        await users.updatePrefs(formData.userId, {
            ...user.prefs,
            creditsUsed: Number(user.prefs.creditsUsed || 0) + CLONE_COST
        });

        return data;
    } catch (error) {
        console.error('cloneInworldVoice error:', error);
        throw error;
    }
}


export async function getCommunityVoices(userId?: string) {
    try {
        const { databases } = createAdminClient();
        const queries = [
            Query.equal('isPublic', true),
            Query.orderDesc('$createdAt'),
            Query.limit(100)
        ];

        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_VOICES_TABLE_ID,
            queries
        );

        return response.documents.map((doc: any) => ({
            voiceId: doc.voiceId,
            docId: doc.$id,
            displayName: doc.name,
            description: doc.description,
            creator: doc.creatorName,
            isCommunity: true,
            isPublic: true,
            languages: [doc.langCode],
            gender: doc.gender,
            tags: doc.tags || [],
            likes: doc.likes || 0,
            likedBy: doc.likedBy || [],
            uses: doc.uses || 0,
            createdAt: doc.$createdAt
        }));
    } catch (error) {
        console.error('getCommunityVoices error:', error);
        return [];
    }
}

export async function getUserVoices(userId: string) {
    try {
        if (!userId) return [];
        const { databases } = createAdminClient();
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_VOICES_TABLE_ID,
            [
                Query.equal('creatorId', userId),
                Query.orderDesc('$createdAt')
            ]
        );

        return response.documents.map((doc: any) => ({
            voiceId: doc.voiceId,
            docId: doc.$id,
            displayName: doc.name,
            description: doc.description,
            creator: doc.creatorName,
            isCommunity: true,
            isPublic: doc.isPublic,
            languages: [doc.langCode],
            gender: doc.gender,
            tags: doc.tags || [],
            likes: doc.likes || 0,
            likedBy: doc.likedBy || [],
            uses: doc.uses || 0,
            createdAt: doc.$createdAt
        }));
    } catch (error) {
        console.error('getUserVoices error:', error);
        return [];
    }
}

export async function saveCommunityVoice(voiceData: {
    voiceId: string;
    name: string;
    description: string;
    creatorName: string;
    creatorId: string;
    isPublic: boolean;
    langCode: string;
    gender?: string;
}) {
    try {
        const { databases } = createAdminClient();
        return await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_VOICES_TABLE_ID,
            ID.unique(),
            {
                ...voiceData,
                likes: 0,
                uses: 0
            }
        );
    } catch (error) {
        console.error('saveCommunityVoice error:', error);
        throw error;
    }
}
export async function toggleCommunityVoiceLike(voiceId: string, userId: string, metadata?: { displayName: string, isCommunity: boolean, gender?: string }) {
    try {
        const { databases } = createAdminClient();
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_VOICES_TABLE_ID,
            [Query.equal('voiceId', voiceId)]
        );

        if (response.total > 0) {
            const doc = response.documents[0];
            const likedBy = (doc.likedBy as string[]) || [];
            const hasLiked = likedBy.includes(userId);

            let newLikedBy;
            let increment;

            if (hasLiked) {
                newLikedBy = likedBy.filter(id => id !== userId);
                increment = -1;
            } else {
                newLikedBy = [...likedBy, userId];
                increment = 1;
            }

            return await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_VOICES_TABLE_ID,
                doc.$id,
                {
                    likes: Math.max(0, (doc.likes || 0) + increment),
                    likedBy: newLikedBy
                }
            );
        } else if (metadata) {
            // If voice doesn't exist (Official Voice liked for the first time)
            return await databases.createDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_VOICES_TABLE_ID,
                ID.unique(),
                {
                    voiceId: voiceId,
                    name: metadata.displayName,
                    description: `Official Inworld voice: ${metadata.displayName}`,
                    creatorName: 'Inworld AI',
                    creatorId: 'system',
                    langCode: 'EN_US',
                    gender: metadata.gender || 'NEUTRAL',
                    likes: 1,
                    likedBy: [userId],
                    isPublic: true // Always public for global lookup
                }
            );
        }
    } catch (error) {
        console.error('toggleCommunityVoiceLike error:', error);
    }
}

export async function getVoiceByDocId(docId: string) {
    try {
        const { databases } = createAdminClient();
        const doc: any = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_VOICES_TABLE_ID,
            docId
        );

        if (doc) {
            return {
                voiceId: doc.voiceId,
                docId: doc.$id,
                displayName: doc.name,
                description: doc.description,
                creator: doc.creatorName,
                isCommunity: true,
                isPublic: doc.isPublic,
                languages: [doc.langCode],
                gender: doc.gender,
                tags: doc.tags || [],
                likes: doc.likes || 0,
                uses: doc.uses || 0,
                createdAt: doc.$createdAt
            };
        }
        return null;
    } catch (error) {
        console.error('getVoiceByDocId error:', error);
        return null;
    }
}
export async function updateVoicePrivacy(docId: string, isPublic: boolean) {
    try {
        const { databases } = createAdminClient();
        return await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_VOICES_TABLE_ID,
            docId,
            { isPublic }
        );
    } catch (error) {
        console.error('updateVoicePrivacy error:', error);
        throw error;
    }
}

export async function deleteUserVoice(docId: string) {
    try {
        const { databases } = createAdminClient();
        return await databases.deleteDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_VOICES_TABLE_ID,
            docId
        );
    } catch (error) {
        console.error('deleteUserVoice error:', error);
        throw error;
    }
}

// --- ADMIN BROADCAST NOTIFICATIONS ---

export async function createBroadcast(data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'system';
    category?: string;
    expiresAt?: string;
}) {
    try {
        const { databases } = createAdminClient();
        return await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_BROADCASTS_ID,
            ID.unique(),
            {
                ...data,
                createdAt: new Date().toISOString(),
            }
        );
    } catch (error) {
        console.error('createBroadcast error:', error);
        throw error;
    }
}

export async function getActiveBroadcasts() {
    try {
        const { databases } = createAdminClient();
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_BROADCASTS_ID,
            [
                Query.orderDesc('$createdAt'),
                Query.limit(20)
            ]
        );

        return response.documents.map((doc: any) => ({
            id: doc.$id,
            title: doc.title,
            message: doc.message,
            type: doc.type,
            category: doc.category || 'system',
            timestamp: doc.$createdAt,
        }));
    } catch (error) {
        // Fail silently if collection doesn't exist yet
        console.debug('Broadcasts collection not found or error fetching:', error);
        return [];
    }
}

// --- USER SPECIFIC NOTIFICATIONS (SYNCED) ---

export async function getUserNotifications(userId: string) {
    try {
        const { databases } = createAdminClient();
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_NOTIFICATIONS_ID,
            [
                Query.equal('userId', userId),
                Query.orderDesc('$createdAt'),
                Query.limit(50)
            ]
        );

        return response.documents.map((doc: any) => ({
            id: doc.$id,
            title: doc.title,
            message: doc.message,
            type: doc.type,
            timestamp: new Date(doc.$createdAt).getTime(),
            read: doc.read,
            category: doc.category || 'general'
        }));
    } catch (error) {
        console.debug('User notifications collection error:', error);
        return [];
    }
}

export async function createUserNotification(userId: string, data: any) {
    try {
        const { databases } = createAdminClient();
        return await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_NOTIFICATIONS_ID,
            ID.unique(),
            {
                userId,
                title: data.title,
                message: data.message,
                type: data.type,
                read: false,
                category: data.category || 'general'
            }
        );
    } catch (error) {
        console.error('createUserNotification error:', error);
    }
}

export async function markNotificationSync(docId: string, read: boolean) {
    try {
        const { databases } = createAdminClient();
        return await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_NOTIFICATIONS_ID,
            docId,
            { read }
        );
    } catch (error) {
        console.error('markNotificationSync error:', error);
    }
}

export async function deleteNotificationSync(docId: string) {
    try {
        const { databases } = createAdminClient();
        return await databases.deleteDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_NOTIFICATIONS_ID,
            docId
        );
    } catch (error) {
        console.error('deleteNotificationSync error:', error);
    }
}

export async function updateUserSeenBroadcasts(userId: string, seenIds: string[]) {
    try {
        const { users } = createAdminClient();
        const user = await users.get(userId);
        await users.updatePrefs(userId, {
            ...user.prefs,
            processedBroadcasts: seenIds
        });
    } catch (error) {
        console.error('updateUserSeenBroadcasts error:', error);
    }
}
