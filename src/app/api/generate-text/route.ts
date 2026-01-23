
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
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

        const response = await fetch('https://api.inworld.ai/llm/v1alpha/completions:completeText', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                servingId: {
                    modelId: {
                        model: 'gpt-4o-mini',
                        serviceProvider: 'SERVICE_PROVIDER_OPENAI'
                    },
                    userId: 'voicelo-user' // Generic user ID for the service call
                },
                prompt: {
                    text: prompt
                },
                textGenerationConfig: {
                    maxTokens: 1000,
                    temperature: 0.7,
                    stream: false
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

        const data = await response.json();

        // Extract the generated text from the response
        // Structure: { result: { choices: [ { text: "..." } ] } }
        const generatedText = data.result?.choices?.[0]?.text;

        if (!generatedText) {
            return NextResponse.json(
                { error: 'No text generated' },
                { status: 500 }
            );
        }

        return NextResponse.json({ text: generatedText });

    } catch (error: any) {
        console.error('Generate Text Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
