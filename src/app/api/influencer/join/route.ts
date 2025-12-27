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

        const prefs = user.prefs as any;
        if (prefs?.is_influencer_allowed !== true && prefs?.is_influencer_allowed !== "true") {
            return NextResponse.json({ error: "Your account is not authorized to join the influencer program. Please contact support." }, { status: 403 });
        }

        // 2. Generate a unique code (MAX 8 characters)
        const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const prefix = cleanName.slice(0, 4) || "VOLC"; // 4 chars or fallback
        const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
        const generatedCode = (prefix + randomStr).slice(0, 8);

        // 3. Create discount in Lemon Squeezy
        configureLemonSqueezy();
        const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
        if (!storeId) {
            console.error("Missing LEMON_SQUEEZY_STORE_ID in environment variables");
            return NextResponse.json({ error: "Store configuration missing" }, { status: 500 });
        }

        console.log(`[Influencer] Creating discount code "${generatedCode}" for user ${user.name}...`);

        const discountRate = Number(prefs?.influencer_discount_rate) || 10;
        const commissionRate = Number(prefs?.influencer_commission_rate) || 30;

        const { data, error } = await createDiscount({
            storeId: storeId,
            name: `Influencer: ${user.name} (${user.email})`,
            code: generatedCode,
            amount: discountRate,
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
            influencer_discount_rate: discountRate,
            influencer_commission_rate: commissionRate,
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
