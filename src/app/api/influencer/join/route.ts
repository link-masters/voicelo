import { NextResponse } from "next/server";
import { createDiscount } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { createAdminClient } from "@/lib/appwrite-server";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // 1. Get user from Appwrite
        const { users } = createAdminClient();
        const user = await users.get(userId);

        if ((user.prefs as any)?.influencerCode) {
            return NextResponse.json({ error: "User already has an influencer code" }, { status: 400 });
        }

        // 2. Generate a unique code
        // Use user name (cleaned) + random characters to ensure uniqueness and brand-ability
        const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        // Fallback if name is empty
        const baseCode = cleanName || "FRIEND";
        const generatedCode = `${baseCode}${randomStr}`;

        // 3. Create discount in Lemon Squeezy
        configureLemonSqueezy();
        const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
        if (!storeId) {
            console.error("Missing LEMON_SQUEEZY_STORE_ID in environment variables");
            return NextResponse.json({ error: "Store configuration missing" }, { status: 500 });
        }

        console.log(`[Influencer] Creating discount code "${generatedCode}" for user ${user.name}...`);

        const { data, error } = await createDiscount({
            storeId: storeId,
            name: `Influencer: ${user.name} (${user.email})`,
            code: generatedCode,
            amount: 10, // Default 10% discount for their followers
            amountType: 'percent',
            isLimitedRedemptions: true,
            maxRedemptions: 1000
        });

        if (error) {
            console.error("Lemon Squeezy Create Discount Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 4. Update user prefs in Appwrite to store the code
        await users.updatePrefs(userId, {
            ...user.prefs,
            influencerCode: generatedCode,
            influencerJoinedAt: new Date().toISOString(),
            isInfluencer: true
        });

        console.log(`✅ User ${user.name} joined the influencer program with code: ${generatedCode}`);

        return NextResponse.json({
            success: true,
            influencerCode: generatedCode
        });

    } catch (error: any) {
        console.error("[Join Influencer API ERROR]:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
