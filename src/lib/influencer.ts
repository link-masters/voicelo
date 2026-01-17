import { createDiscount as createLemonDiscount } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { createAdminClient } from "@/lib/appwrite-server";
import { paymentConfig, isLemonSqueezy, isPaddle, isCreem } from "@/config/payment";
import { getCreemBaseUrl } from "@/lib/creem";
import { paddle } from "@/lib/paddle";

export async function createInfluencerCode(userId: string, influencerType: "credits" | "commission") {
    const { users } = createAdminClient();
    const user = await users.get(userId);
    const prefs = user.prefs as any;

    // 1. Generate a unique code (MAX 8 characters)
    const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const prefix = cleanName.slice(0, 4) || "VOLC";
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    const generatedCode = (prefix + randomStr).slice(0, 8);

    // Determine rates based on influencer type and global admin settings
    let discountRate = 10; // Default
    let commissionRate = 0;

    if (influencerType === "commission") {
        // Use Global Admin Settings for Commission path
        discountRate = Number(process.env.INFLUENCER_COMMISSION_DISCOUNT_PERCENT) || 10;
        commissionRate = Number(process.env.INFLUENCER_COMMISSION_RATE_PERCENT) || 30;
    } else {
        // Use Global Admin Settings for Credits path (if needed) or default
        discountRate = Number(process.env.NEXT_PUBLIC_INFLUENCER_DISCOUNT_RATE) || 10;
        commissionRate = 0; // Credits path never gets cash commission
    }

    // Override with user-specific prefs ONLY if they exist (allows individual custom rates later)
    if (prefs?.influencer_discount_rate) discountRate = Number(prefs.influencer_discount_rate);
    if (prefs?.influencer_commission_rate && influencerType === "commission") {
        commissionRate = Number(prefs.influencer_commission_rate);
    }

    let success = false;
    let creemDiscountId = null;

    if (isLemonSqueezy()) {
        configureLemonSqueezy();
        const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
        if (!storeId) throw new Error("Store configuration missing");

        const { data, error } = await createLemonDiscount({
            storeId: storeId,
            name: `Influencer (${influencerType}): ${user.name}`,
            code: generatedCode,
            amount: discountRate,
            amountType: 'percent',
            isLimitedRedemptions: true,
            maxRedemptions: 1000
        });

        if (error) throw new Error(error.message);
        success = true;
    } else if (isPaddle()) {
        try {
            await paddle.discounts.create({
                amount: discountRate.toString(),
                type: "percentage",
                description: `Influencer (${influencerType}): ${user.name}`,
                enabledForCheckout: true,
                code: generatedCode,
                recur: false,
                usageLimit: 1000
            });
            success = true;
        } catch (error: any) {
            throw new Error(error.message || "Failed to create Paddle discount");
        }
    } else if (isCreem()) {
        const apiKey = process.env.CREEM_API_KEY;
        const baseUrl = getCreemBaseUrl();
        const influencerName = `Influencer: ${user.name}`.slice(0, 40);

        const resp = await fetch(`${baseUrl}/discounts`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: influencerName,
                code: generatedCode,
                type: 'percentage',
                percentage: discountRate,
                duration: 'forever',
                max_redemptions: 1000,
                applies_to_products: [
                    "prod_5THoii5ro6PT7K6sFTkmoc",
                    "prod_4a83983VsEExdTKj84zSIx"
                ]
            })
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.message || "Failed to create Creem discount");
        }

        const creemDiscount = await resp.json();
        creemDiscountId = creemDiscount.id;
        success = true;
    } else {
        throw new Error(`Influencer program is not yet compatible with ${paymentConfig.activeProvider}.`);
    }

    if (success) {
        // Update user prefs in Appwrite
        await users.updatePrefs(userId, {
            ...user.prefs,
            influencerCode: generatedCode,
            creemDiscountId: creemDiscountId,
            influencer_discount_rate: discountRate,
            influencer_commission_rate: commissionRate,
            influencerType,
            awaitingCommissionVerification: false, // Always clear this when code is created
            influencerJoinedAt: new Date().toISOString(),
            isInfluencer: true
        });

        return {
            success: true,
            influencerCode: generatedCode,
            influencerType
        };
    }

    throw new Error("Failed to finalize influencer setup.");
}
