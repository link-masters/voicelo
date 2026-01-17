import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";
import { createInfluencerCode } from "@/lib/influencer";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/influencer-program?error=missing_params`);
    }

    // state contains userId payload (passed directly from login route)
    const userId = state;
    if (!userId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/influencer-program?error=missing_user_id`);
    }

    try {
        // 1. Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        // 2. Fetch Channel Info
        const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const channelData = await channelResponse.json();
        if (!channelData.items || channelData.items.length === 0) throw new Error("No YouTube channel found");

        const channel = channelData.items[0];
        const channelStats = {
            id: channel.id,
            title: channel.snippet.title,
            thumbnail: channel.snippet.thumbnails.default.url,
            subscriberCount: parseInt(channel.statistics.subscriberCount),
            viewCount: parseInt(channel.statistics.viewCount),
            videoCount: parseInt(channel.statistics.videoCount),
            verifiedAt: new Date().toISOString()
        };

        // 3. Determine Criteria
        const MIN_SUBS = Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_SUBS) || 500;
        const MIN_VIEWS = Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_VIEWS) || 2000;
        const meetsCriteria = channelStats.subscriberCount >= MIN_SUBS && channelStats.viewCount >= MIN_VIEWS;

        // 4. Update User stats in Appwrite
        const { users } = createAdminClient();
        const user = await users.get(userId);
        const prefs = user.prefs as any;

        const isAwaiting = prefs.awaitingCommissionVerification === true || prefs.awaitingCommissionVerification === "true";
        const isAlreadyInfluencer = !!prefs.influencerCode;

        // Permanent Choice Logic:
        // We only grant "commission" if they picked it during onboarding (isAwaiting) OR if they are already commission.
        let finalType = prefs.influencerType || "credits";

        if (meetsCriteria && (isAwaiting || prefs.influencerType === 'commission')) {
            finalType = "commission";
        }

        // 5. AUTO-JOIN IF NECESSARY
        // If they chose commission but didn't have a code yet, and now they meet criteria -> Give them their code!
        if (meetsCriteria && isAwaiting && !isAlreadyInfluencer) {
            console.log(`[YouTube Callback] Auto-creating code for user ${userId} who now meets criteria.`);
            // Update stats first so helper can see them if needed
            await users.updatePrefs(userId, {
                ...user.prefs,
                youtube_verification: channelStats,
            });

            // This helper handles prefs update, code creation, and sets isInfluencer: true
            await createInfluencerCode(userId, "commission");
        } else {
            // Just update stats and type
            await users.updatePrefs(userId, {
                ...user.prefs,
                youtube_verification: channelStats,
                influencerType: finalType,
                // Clear awaiting if they met criteria (even if already influencer)
                awaitingCommissionVerification: (finalType === "commission" && meetsCriteria) ? false : prefs.awaitingCommissionVerification,
                is_influencer_allowed: meetsCriteria ? true : (prefs.is_influencer_allowed || false)
            });
        }

        console.log(`✅ YouTube verification processed for user ${userId}. Type: ${finalType}, Meets Criteria: ${meetsCriteria}`);

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/influencer-program?verify=success`);

    } catch (error: any) {
        console.error("[YouTube Callback ERROR]:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/influencer-program?error=${encodeURIComponent(error.message)}`);
    }
}
