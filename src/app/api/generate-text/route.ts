import { NextResponse } from 'next/server';
import { createAdminClient } from "@/lib/appwrite-server";
import { ID, Permission, Role } from "node-appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const HISTORY_COLLECTION_ID = 'ai_history';

export async function POST(request: Request) {
    try {
        const { prompt, userId, modelId, projectId } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project context is required' },
                { status: 400 }
            );
        }

        // 1. Credit Check
        const adminClient = createAdminClient();
        const user = await adminClient.users.get(userId);
        const creditsTotal = Number(user.prefs.creditsTotal || 0);
        const creditsUsed = Number(user.prefs.creditsUsed || 0);
        const creditsBalance = creditsTotal - creditsUsed;

        if (creditsBalance <= 0) {
            return NextResponse.json(
                { error: 'Insufficient credits. Please top up to use the AI Writer.' },
                { status: 403 }
            );
        }

        const apiKey = process.env.INWORLD_KEY;
        const apiSecret = process.env.INWORLD_SECRET;

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: 'Inworld credentials not configured' },
                { status: 500 }
            );
        }

        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        const response = await fetch('https://api.inworld.ai/llm/v1alpha/completions:completeChat', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                servingId: {
                    modelId: {
                        model: modelId || 'gpt-4o-mini',
                        serviceProvider: (modelId || '').startsWith('gemini') ? 'SERVICE_PROVIDER_GOOGLE' : 'SERVICE_PROVIDER_OPENAI'
                    },
                    userId: 'voicelo-user'
                },
                messages: [
                    {
                        role: 'MESSAGE_ROLE_SYSTEM',
                        content: 'You are an award-winning creative director and senior scriptwriter. Your task is to write COMPLETE, PRODUCTION-READY scripts. DO NOT describe what you will write. DO NOT summarize the theme. START writing the actual script immediately. Use clear segment markers like [INTRO], [SCENE 1], [VOICEOVER], etc. If the user asks for a specific length, follow it, but ensure the content is substantial and high-quality.'
                    },
                    {
                        role: 'MESSAGE_ROLE_USER',
                        content: prompt
                    }
                ],
                textGenerationConfig: {
                    maxTokens: 3000,
                    // Modern reasoning models like GPT-4.1/o1 often only support the default temperature (1.0)
                    temperature: modelId === 'gpt-4.1-nano' ? 1.0 : 0.8,
                    stream: true
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Inworld API Error:', errorData);
            return NextResponse.json(
                { error: 'Failed to generate text', details: errorData },
                { status: response.status }
            );
        }

        // Create a transform stream to parse the Inworld stream and send only the text to the client
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let totalCharsGenerated = 0;

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                let fullGeneratedText = '';

                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) continue;

                        try {
                            const json = JSON.parse(trimmedLine);
                            // Inworld stream structure: result.choices[0].delta.content or message.content
                            const text = json.result?.choices?.[0]?.delta?.content ||
                                json.result?.choices?.[0]?.message?.content ||
                                '';
                            if (text) {
                                totalCharsGenerated += text.length;
                                fullGeneratedText += text;
                                controller.enqueue(encoder.encode(text));
                            }
                        } catch (e) {
                            // Some lines might not be full JSON yet
                            // console.error('Error parsing line:', trimmedLine);
                        }
                    }
                }

                // 2. Deduct Credits and Save History at the end of the stream
                try {
                    const creditsPer1k = Number(process.env.AI_WRITER_CREDITS_PER_1000_CHARACTERS) || 10;
                    const creditCost = Math.max(1, Math.round((totalCharsGenerated / 1000) * creditsPer1k));

                    // Sequential updates to ensure data integrity
                    await adminClient.users.updatePrefs(userId, {
                        ...user.prefs,
                        creditsUsed: creditsUsed + creditCost
                    });

                    // Save to History
                    await adminClient.databases.createDocument(
                        DATABASE_ID,
                        HISTORY_COLLECTION_ID,
                        ID.unique(),
                        {
                            userId,
                            projectId,
                            prompt,
                            generatedText: fullGeneratedText,
                            charCount: totalCharsGenerated,
                            creditCost: creditCost,
                        },
                        // Grant read and delete permission to the user specifically
                        [
                            Permission.read(Role.user(userId)),
                            Permission.delete(Role.user(userId))
                        ]
                    );

                    console.log(`[AI-Writer] Success: Deducted ${creditCost} credits and saved history (User: ${userId})`);
                } catch (creditError) {
                    console.error('Failed to update credits or history:', creditError);
                }

                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Generate Text Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
