import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";
import { createInfluencerCode } from "@/lib/influencer";

export async function POST(req: Request) {
    try {
        const { userId, type: selectedType } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // 1. Get user from Appwrite
        const { users } = createAdminClient();
        const user = await users.get(userId);

        if ((user.prefs as any)?.influencerCode) {
            return NextResponse.json({ error: "User already has an influencer code" }, { status: 400 });
        }

        let userIPCountry = req.headers.get('x-vercel-ip-country') ||
            req.headers.get('cf-ipcountry') ||
            req.headers.get('x-country-code');

        // Handle local development bypass
        if (!userIPCountry && process.env.NODE_ENV === 'development') {
            userIPCountry = 'PK';
        }

        const prefs = user.prefs as any;
        const youtubeStats = prefs?.youtube_verification;

        // Restriction: Commission program only for Pakistan
        if (selectedType === 'commission' && userIPCountry && userIPCountry.toUpperCase() !== 'PK') {
            return NextResponse.json({
                error: "The Elite Creator (Commission) program is currently only available for creators based in Pakistan. You can still join as a Community Influencer!"
            }, { status: 403 });
        }

        const MIN_SUBS = Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_SUBS) || 500;
        const MIN_VIEWS = Number(process.env.NEXT_PUBLIC_YOUTUBE_MIN_VIEWS) || 2000;

        let influencerType = "credits";
        let awaitingVerification = false;

        if (selectedType === 'commission') {
            const meetsCriteria = youtubeStats &&
                youtubeStats.subscriberCount >= MIN_SUBS &&
                youtubeStats.viewCount >= MIN_VIEWS;

            if (meetsCriteria) {
                influencerType = "commission";
            } else {
                // DON'T create the code yet if they picked commission but aren't verified
                influencerType = "credits"; // Fallback to credits if they somehow bypass and we need a type
                awaitingVerification = true;
            }
        } else {
            influencerType = "credits";
        }

        // IF VERIFICATION IS REQUIRED: STOP HERE
        if (awaitingVerification) {
            console.log(`[Influencer] Deferring Join for user ${user.name}: Awaiting YouTube Verification.`);

            // Just update prefs to record their intent
            await users.updatePrefs(userId, {
                ...user.prefs,
                influencerType: 'commission', // Store their intent
                awaitingCommissionVerification: true,
                isInfluencer: false // Not an influencer yet (no code)
            });

            return NextResponse.json({
                success: true,
                influencerType: 'commission',
                awaitingCommissionVerification: true,
                needsVerification: true
            });
        }

        // IF WE GET HERE: Create the code immediately (either path 'credits' OR 'commission' with verified status)
        const result = await createInfluencerCode(userId, influencerType as "credits" | "commission");

        return NextResponse.json({
            ...result,
            awaitingCommissionVerification: false
        });

    } catch (error: any) {
        console.error("[Join Influencer API ERROR]:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
