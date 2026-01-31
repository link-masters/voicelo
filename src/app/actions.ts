'use server'

const INWORLD_KEY = process.env.INWORLD_KEY;
const INWORLD_SECRET = process.env.INWORLD_SECRET;
// Fallback if user puts full Basic string in one var
const INWORLD_AUTH_TOKEN = process.env.INWORLD_AUTH_TOKEN;

const BASE_URL = 'https://api.inworld.ai/tts/v1';

const INWORLD_WORKSPACE = process.env.INWORLD_WORKSPACE;
const INWORLD_TTS_MODEL = process.env.INWORLD_TTS_MODEL || 'inworld-tts-1';
const VOICES_BASE_URL = 'https://api.inworld.ai/voices/v1';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main';
const APPWRITE_VOICES_TABLE_ID = process.env.NEXT_PUBLIC_APPWRITE_VOICES_TABLE_ID || 'user_shared_voices';
const APPWRITE_BROADCASTS_ID = process.env.NEXT_PUBLIC_APPWRITE_BROADCASTS_ID || 'broadcasts';
const APPWRITE_USER_NOTIFICATIONS_ID = process.env.NEXT_PUBLIC_APPWRITE_USER_NOTIFICATIONS_ID || 'user_notifications';
const APPWRITE_TRANSACTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID || 'user_transactions';
const WELCOME_CREDITS = Number(process.env.NEXT_PUBLIC_WELCOME_CREDITS) || 1000;
const STARTER_CLONE_LIMIT = Number(process.env.NEXT_PUBLIC_VOICE_CLONE_LIMIT_STARTER) || 20;
const PLUS_CLONE_LIMIT = Number(process.env.NEXT_PUBLIC_VOICE_CLONE_LIMIT_PLUS) || 50;

// --- Long Form TTS Constants ---
const MIN_CHUNK_SIZE = 500;
const MAX_CHUNK_SIZE = 1900; // Inworld Max is 2000, using 1900 for safety
const MAX_CONCURRENT_REQUESTS = 1; // Keep it low to avoid rate limits
const SPLICE_BREAK_MS = 300; // Small silence between chunks in ms

interface TextChunk {
    text: string;
    start: number;
    end: number;
}

function findBreakPoint(text: string, minPos: number, maxPos: number): number {
    const searchText = text.slice(0, maxPos);

    // 1. Paragraph breaks (\n\n)
    let idx = searchText.lastIndexOf('\n\n');
    if (idx >= minPos) return idx + 2;

    // 2. Single line breaks (\n)
    idx = searchText.lastIndexOf('\n');
    if (idx >= minPos) return idx + 1;

    // 3. Sentence endings
    const sentenceMatch = searchText.match(/[.!?]["']?\s+|[.!?]["']?$/g);
    if (sentenceMatch) {
        // Find the last sentence end that is after minPos
        for (let i = searchText.length; i >= minPos; i--) {
            const char = searchText[i];
            const nextChar = searchText[i + 1];
            if (['.', '!', '?'].includes(char)) {
                // Check if it's followed by space or end of string
                if (!nextChar || /\s/.test(nextChar)) {
                    return i + 1;
                }
            }
        }
    }

    // 4. Last resort: last space
    idx = searchText.lastIndexOf(' ');
    if (idx >= minPos) return idx + 1;

    // 5. Hard cut
    return maxPos;
}

function chunkText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
        const remaining = text.slice(currentPos);

        if (remaining.length <= MAX_CHUNK_SIZE) {
            chunks.push({
                text: remaining.trim(),
                start: currentPos,
                end: text.length
            });
            break;
        }

        const breakPoint = findBreakPoint(remaining, MIN_CHUNK_SIZE, MAX_CHUNK_SIZE);
        const chunkText = remaining.slice(0, breakPoint).trim();

        if (chunkText) {
            chunks.push({
                text: chunkText,
                start: currentPos,
                end: currentPos + breakPoint
            });
        }
        currentPos += breakPoint;
    }
    return chunks;
}

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite-server";
import { OFFICIAL_VOICE_METADATA } from "@/config/voiceMetadata";
import { createTransactionRecord } from "@/lib/transactions";

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
    userId: string,
    options: {
        pitch?: number;
        speed?: number;
        isPreview?: boolean;
        applyTextNormalization?: 'APPLY_TEXT_NORMALIZATION_UNSPECIFIED' | 'ON' | 'OFF';
    } = {}
) {
    if (!options.isPreview && (!userId || typeof userId !== 'string')) {
        console.error("synthesizeInworldSpeech: Missing or invalid userId", { userId });
        throw new Error("Missing required parameter: userId");
    }

    try {
        let user: any = null;
        let users: any = null;

        if (!options.isPreview) {
            const clientData = createAdminClient();
            users = clientData.users;
            user = await users.get(userId);

            const billingCycleEnd = user.prefs.billingCycleEnd ? new Date(user.prefs.billingCycleEnd) : null;
            const now = new Date();

            if (user.prefs.lastPurchaseDate && billingCycleEnd && billingCycleEnd < now) {
                throw new Error("Your 30-day billing cycle has ended. Please purchase a new package to unlock and use your remaining credits.");
            }

            const creditCost = text.length;
            const creditsBalance = ((user.prefs.creditsTotal as number) || 0) - ((user.prefs.creditsUsed as number) || 0);
            if (creditsBalance < creditCost) {
                throw new Error(`Insufficient credits. You need ${creditCost} credits, but only have ${creditsBalance} left.`);
            }
        }

        const chunks = chunkText(text);
        console.log(`[TTS] Processing ${chunks.length} chunks for ${text.length} chars...`);

        // Helper to synthesize a single chunk
        const synthesizeChunk = async (chunkText: string) => {
            const body: any = {
                text: chunkText,
                voiceId,
                modelId: INWORLD_TTS_MODEL,
                speakingRate: options.speed || 1.0,
                pitch: options.pitch || 1.0,
                audioEncoding: 'MP3',
            };

            // Add text normalization if specified
            if (options.applyTextNormalization) {
                body.applyTextNormalization = options.applyTextNormalization;
            }

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
                throw new Error(`Inworld API Error: ${errorText}`);
            }

            const data = await response.json();
            return Buffer.from(data.audioContent, 'base64');
        };

        let resultBuffer: Buffer;

        if (chunks.length === 1) {
            resultBuffer = await synthesizeChunk(chunks[0].text);
        } else {
            // Process chunks with limited concurrency
            const results: Buffer[] = [];
            for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_REQUESTS) {
                const batch = chunks.slice(i, i + MAX_CONCURRENT_REQUESTS);
                const batchResults = await Promise.all(
                    batch.map(chunk => synthesizeChunk(chunk.text))
                );
                results.push(...batchResults);
            }
            resultBuffer = Buffer.concat(results);
        }

        if (!options.isPreview && users && user) {
            const creditCost = text.length;
            await users.updatePrefs(userId, {
                ...user.prefs,
                creditsUsed: Number(user.prefs.creditsUsed || 0) + creditCost
            });

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

        return {
            audioContent: resultBuffer.toString('base64')
        };
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

        // 1. Voice Clone Limit Check
        const limit = await getVoiceCloneLimit(formData.userId);
        const userVoices = await getUserVoices(formData.userId);

        if (userVoices.length >= limit) {
            throw new Error(`You have reached your voice clone limit (${userVoices.length}/${limit} slots used). Please delete an existing voice to free up a slot or upgrade your plan.`);
        }

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
            langCode: (formData.langCode && formData.langCode.trim()) ? formData.langCode : 'EN_US',
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
            creatorId: doc.creatorId,
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
            creatorId: doc.creatorId,
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

export async function getVoiceCloneLimit(userId: string) {
    try {
        if (!userId) return 0;
        const { databases } = createAdminClient();
        const now = new Date().toISOString();

        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_TRANSACTIONS_COLLECTION_ID,
            [
                Query.equal('userId', userId),
                Query.greaterThan('expiresAt', now),
                Query.equal('status', 'active')
            ]
        );

        let limit = 0;

        for (const doc of response.documents) {
            if (doc.packageName === 'plus_pack') {
                limit = Math.max(limit, PLUS_CLONE_LIMIT);
            } else if (doc.packageName === 'starter_pack') {
                limit = Math.max(limit, STARTER_CLONE_LIMIT);
            }
        }

        return limit;
    } catch (error) {
        console.error('getVoiceCloneLimit error:', error);
        return 0;
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
                    langCode: 'EN',
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

export async function deleteUserVoice(docId: string, voiceId: string) {
    try {
        if (!INWORLD_WORKSPACE) {
            throw new Error('INWORLD_WORKSPACE environment variable is not set.');
        }

        // 1. Delete from Inworld workspace first
        try {
            // If voiceId is in format "workspace__voiceid" or "workspaces/ws/voices/vid", extract just the vid
            const cleanVoiceId = voiceId.split('/').pop()?.split('__').pop() || voiceId;

            const response = await fetch(`${VOICES_BASE_URL}/workspaces/${INWORLD_WORKSPACE}/voices/${cleanVoiceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': getAuthHeader(),
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Inworld voice deletion error:", response.status, errorText);
                // Continue with Appwrite deletion even if Inworld fails
                // (voice might already be deleted from Inworld)
            }
        } catch (inworldError) {
            console.error('Inworld deletion failed, continuing with Appwrite deletion:', inworldError);
            // Continue with Appwrite deletion even if Inworld fails
        }

        // 2. Delete from Appwrite database
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
        if (!userId) return;

        const { users } = createAdminClient();
        const user = await users.get(userId);

        const currentSeen = (user.prefs.processedBroadcasts as string[]) || [];

        // Simple array comparison to avoid unnecessary updates
        const setsMatch = currentSeen.length === seenIds.length &&
            seenIds.every(id => currentSeen.includes(id));

        if (setsMatch) return;

        console.log(`[Broadcasts] Updating seen broadcasts for user ${userId}...`);

        await users.updatePrefs(userId, {
            ...user.prefs,
            processedBroadcasts: seenIds
        });
    } catch (error) {
        console.error('updateUserSeenBroadcasts error:', error);
    }
}

/**
 * Ensures a user has received their initial welcome credits and logs it as a transaction.
 */
export async function ensureInitialCreditsAwarded(userId: string) {
    try {
        const { users, databases } = createAdminClient();
        const user = await users.get(userId);
        const prefs = user.prefs as any;

        // Check if already awarded to prevent double-dipping
        // We check BOTH the flag AND if the user already has credits (to avoid awarding to old users who already had 1000)
        if (prefs.welcomeCreditsAwarded === true) {
            return { success: true, alreadyAwarded: true };
        }

        // If they have 1000 or more credits and no flag, they might be an old user
        // But to be safe and consistent, we'll mark them as awarded if we see they have 1000+ credits
        // OR we just award it if they are brand new (creditsTotal is empty/null/0)

        const currentTotal = Number(prefs.creditsTotal) || 0;
        const initialCredits = WELCOME_CREDITS;

        // If they have NO credits recorded yet, give them the bonus
        if (currentTotal === 0) {
            console.log(`[Credits] Awarding initial welcome credits to user ${userId}`);

            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            // 1. Update User prefs
            await users.updatePrefs(userId, {
                ...prefs,
                creditsTotal: initialCredits,
                welcomeCreditsAwarded: true,
                welcomeCreditsAwardedAt: new Date().toISOString()
            });

            // 2. Create Transaction Record
            try {
                await createTransactionRecord(databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, {
                    userId,
                    transactionId: `welcome_${userId}`,
                    credits: initialCredits,
                    packageName: "Welcome Bonus",
                    provider: "internal",
                    status: "active",
                    purchasedAt: new Date().toISOString(),
                    expiresAt: thirtyDaysFromNow.toISOString()
                });
            } catch (txError) {
                console.error("[Credits] Failed to log welcome transaction, but prefs updated:", txError);
            }

            return { success: true, awarded: initialCredits };
        } else {
            // They already have credits from somewhere (maybe a purchase or old setup), just mark the flag
            await users.updatePrefs(userId, {
                ...prefs,
                welcomeCreditsAwarded: true
            });
            return { success: true, alreadyHadCredits: true };
        }
    } catch (error: any) {
        console.error("ensureInitialCreditsAwarded error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Clears all generation history (TTS and AI Writer) for a user from the database.
 */
export async function clearAllHistory(userId: string) {
    try {
        if (!userId) throw new Error("User ID is required");
        const { databases } = createAdminClient();

        // Collections to clear
        const collections = ['generations', 'ai_history', 'ai_history_versions'];

        for (const collectionId of collections) {
            console.log(`Clearing collection: ${collectionId} for user: ${userId}`);
            let hasMore = true;
            let deletedCount = 0;

            while (hasMore) {
                const response = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    collectionId,
                    [
                        Query.equal('userId', userId),
                        Query.limit(100)
                    ]
                );

                if (response.documents.length === 0) {
                    hasMore = false;
                    break;
                }

                // Delete batch
                await Promise.all(
                    response.documents.map(doc =>
                        databases.deleteDocument(APPWRITE_DATABASE_ID, collectionId, doc.$id)
                    )
                );

                deletedCount += response.documents.length;

                // If we got fewer than 100, we're likely done
                if (response.documents.length < 100) {
                    hasMore = false;
                }
            }
            console.log(`Successfully deleted ${deletedCount} documents from ${collectionId}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("clearAllHistory error:", error);
        return { success: false, error: error.message || "Failed to clear history" };
    }
}

/**
 * Permanently deletes a user account and all associated data.
 */
export async function deleteUserAccountEntirely(userId: string) {
    try {
        if (!userId) throw new Error("User ID is required");

        const { databases, users } = createAdminClient();

        // 1. Clear history (TTS and AI Writer)
        await clearAllHistory(userId);

        // 2. Clear user voices (both Appwrite and Inworld)
        console.log(`Deleting voices for user: ${userId}`);
        let hasMoreVoices = true;
        while (hasMoreVoices) {
            const response = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_VOICES_TABLE_ID,
                [
                    Query.equal('creatorId', userId),
                    Query.limit(100)
                ]
            );

            if (response.documents.length === 0) {
                hasMoreVoices = false;
                break;
            }

            await Promise.allSettled(
                response.documents.map(doc =>
                    deleteUserVoice(doc.$id, (doc as any).voiceId)
                )
            );

            if (response.documents.length < 100) {
                hasMoreVoices = false;
            }
        }

        // 3. Delete user notifications
        console.log(`Deleting notifications for user: ${userId}`);
        let hasMoreNotifs = true;
        while (hasMoreNotifs) {
            const response = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_USER_NOTIFICATIONS_ID,
                [
                    Query.equal('userId', userId),
                    Query.limit(100)
                ]
            );

            if (response.documents.length === 0) {
                hasMoreNotifs = false;
                break;
            }

            await Promise.all(
                response.documents.map(doc =>
                    databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_USER_NOTIFICATIONS_ID, doc.$id)
                )
            );

            if (response.documents.length < 100) {
                hasMoreNotifs = false;
            }
        }

        // 4. Delete user transactions
        console.log(`Deleting transactions for user: ${userId}`);
        let hasMoreTx = true;
        while (hasMoreTx) {
            const response = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_TRANSACTIONS_COLLECTION_ID,
                [
                    Query.equal('userId', userId),
                    Query.limit(100)
                ]
            );

            if (response.documents.length === 0) {
                hasMoreTx = false;
                break;
            }

            await Promise.all(
                response.documents.map(doc =>
                    databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, doc.$id)
                )
            );

            if (response.documents.length < 100) {
                hasMoreTx = false;
            }
        }

        // 5. Delete projects
        console.log(`Deleting projects for user: ${userId}`);
        let hasMoreProjects = true;
        while (hasMoreProjects) {
            const response = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                'projects',
                [
                    Query.equal('userId', userId),
                    Query.limit(100)
                ]
            );

            if (response.documents.length === 0) {
                hasMoreProjects = false;
                break;
            }

            await Promise.all(
                response.documents.map(doc =>
                    databases.deleteDocument(APPWRITE_DATABASE_ID, 'projects', doc.$id)
                )
            );

            if (response.documents.length < 100) {
                hasMoreProjects = false;
            }
        }

        // 6. Delete user record from Appwrite Auth (Mandatory last step)
        try {
            console.log(`Deleting user record from Auth: ${userId}`);
            await users.delete(userId);
        } catch (authError: any) {
            console.error("Failed to delete user from Auth (might be already gone):", authError);
            // If they are gone from auth, we consider this a success overall
        }

        return { success: true };
    } catch (error: any) {
        console.error("deleteUserAccountEntirely error:", error);
        return { success: false, error: error.message || "Failed to delete account" };
    }
}

export async function updateUserName(userId: string, name: string) {
    try {
        if (!userId) throw new Error("User ID is required");
        if (!name) throw new Error("Name is required");

        const { users } = createAdminClient();
        await users.updateName(userId, name);

        return { success: true };
    } catch (error: any) {
        console.error("updateUserName error:", error);
        return { success: false, error: error.message || "Failed to update name" };
    }
}
