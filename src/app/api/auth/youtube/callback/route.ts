import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('state'); // Retrieve userId from state

    if (!code || !userId) {
        return NextResponse.json({ error: "Invalid request: code or state missing" }, { status: 400 });
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/youtube/callback`;

        // 1. Exchange code for access token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenResponse.json();
        if (tokens.error || !tokens.access_token) {
            console.error("YouTube Token Exchange Error:", tokens.error_description || tokens.error || "No access token");
            return NextResponse.json({ error: tokens.error_description || tokens.error || "Failed to get access token" }, { status: 500 });
        }

        // 2. Fetch YouTube Channel details and stats
        const youtubeResponse = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
            {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
        );

        const youtubeData = await youtubeResponse.json();
        if (!youtubeData.items || youtubeData.items.length === 0) {
            return NextResponse.json({ error: "No YouTube channels found for this account" }, { status: 404 });
        }

        // 3. Select the channel with the most subscribers (Standard for influencers)
        const sortedChannels = youtubeData.items.sort((a: any, b: any) =>
            (parseInt(b.statistics.subscriberCount) || 0) - (parseInt(a.statistics.subscriberCount) || 0)
        );
        const channel = sortedChannels[0];

        const channelStats = {
            channelId: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            customUrl: channel.snippet.customUrl,
            thumbnails: channel.snippet.thumbnails,
            subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
            videoCount: parseInt(channel.statistics.videoCount) || 0,
            viewCount: parseInt(channel.statistics.viewCount) || 0,
            verifiedAt: new Date().toISOString()
        };

        // 4. Update User Prefs in Appwrite
        const { users } = createAdminClient();
        const user = await users.get(userId);

        await users.updatePrefs(userId, {
            ...user.prefs,
            youtube_verification: channelStats
        });

        console.log(`✅ YouTube verification successful for user ${userId}: ${channelStats.title} (${channelStats.subscriberCount} subs)`);

        // 4. Redirect back to influencer program page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/influencer-program?verified=youtube`);

    } catch (error: any) {
        console.error("YouTube OAuth Callback Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
