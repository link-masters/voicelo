import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { audioItems, projectName } = await request.json();

        if (!audioItems || audioItems.length === 0) {
            return NextResponse.json({ error: 'No audio items provided' }, { status: 400 });
        }

        // Convert base64 audio items to buffers
        const audioBuffers = audioItems.map((base64Audio: string) => {
            const binaryString = Buffer.from(base64Audio, 'base64');
            return binaryString;
        });

        // Merge all audio buffers into one
        // For MP3 files, we can simply concatenate them
        // This works because MP3 is a streaming format
        const mergedBuffer = Buffer.concat(audioBuffers);

        // Return the merged audio file
        return new NextResponse(mergedBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${projectName}_export.mp3"`,
                'Content-Length': mergedBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Audio export error:', error);
        return NextResponse.json(
            { error: 'Failed to export audio' },
            { status: 500 }
        );
    }
}
