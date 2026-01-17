import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { createTransactionRecord } from "@/lib/transactions";

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const hmac = crypto.createHmac("sha256", process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!);
        const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
        const signature = Buffer.from(req.headers.get("x-signature") || "", "utf8");

        if (!crypto.timingSafeEqual(digest, signature)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const eventName = payload.meta.event_name;
        const customData = payload.meta.custom_data;
        const userId = customData?.user_id || customData?.userId;

        console.log("🔔 Webhook received:", eventName);
        console.log("📦 Custom Data:", customData);

        if (!userId) {
            console.warn("⚠️ Missing userId. If this is a 'Test Webhook' click, this is normal.");
            return NextResponse.json({ error: "No userId in custom data" }, { status: 400 });
        }

        const { users, databases } = createAdminClient();
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

        // Handle one-time payment events
        switch (eventName) {
            case "order_created":
                const attributes = payload.data.attributes;

                // For 'order_created' events, details are often inside 'first_order_item'
                const firstItem = attributes.first_order_item;
                const variantName = attributes.variant_name || firstItem?.variant_name || "Unknown";
                const productName = firstItem?.product_name || "Unknown";

                console.log("💎 Purchase Info:", { variantName, productName });

                let creditsToAdd = 0;
                // Check both product name and variant name (lowercase)
                const searchStr = `${productName} ${variantName}`.toLowerCase();
                const starterCredits = Number(process.env.NEXT_PUBLIC_CREDITS_STARTER_PACK) || 10000;
                const plusCredits = Number(process.env.NEXT_PUBLIC_CREDITS_PLUS_PACK) || 50000;
                const eliteCredits = 200000;

                if (searchStr.includes("starter")) creditsToAdd = starterCredits;
                else if (searchStr.includes("plus") || searchStr.includes("turbo") || searchStr.includes("pro")) creditsToAdd = plusCredits;
                else if (searchStr.includes("elite")) creditsToAdd = eliteCredits;

                console.log(`💰 Adding ${creditsToAdd} credits. Search string: "${searchStr}"`);

                if (creditsToAdd === 0) {
                    console.error("❌ Unknown variant name:", variantName);
                    return NextResponse.json({ error: `Unknown variant: ${variantName}` }, { status: 400 });
                }

                const user = await users.get(userId);

                // Deduplication Check (Fix for double credits)
                const processingTxId = payload.data.id;
                const isLastPurchase = user.prefs?.lastPurchaseId === processingTxId;
                let isDbRecorded = false;
                const txCollectionId = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID;

                if (txCollectionId) {
                    const existingDocs = await databases.listDocuments(
                        databaseId,
                        txCollectionId,
                        [Query.equal('transactionId', processingTxId)]
                    );
                    if (existingDocs.total > 0) isDbRecorded = true;
                }

                if (isLastPurchase || isDbRecorded) {
                    console.log(`[LemonSqueezy] ⚠️ Transaction ${processingTxId} already processed. Skipping.`);
                    return NextResponse.json({ success: true, message: "Transaction already processed" });
                }
                // Force currentTotal and creditsToAdd to be numbers to avoid concatenation
                const currentTotal = Number(user.prefs.creditsTotal) || 0;
                const validatedCreditsToAdd = Number(creditsToAdd);

                // Calculate 30 days from now for the billing cycle
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                const displayName = variantName && variantName !== "Default" && variantName !== "Unknown"
                    ? variantName
                    : (productName !== "Unknown" ? productName : "Standard Pack");

                await users.updatePrefs(userId, {
                    ...user.prefs,
                    plan: "Pro User",
                    creditsTotal: currentTotal + validatedCreditsToAdd,
                    lastPurchaseId: payload.data.id,
                    lastPurchaseDate: new Date().toISOString(),
                    billingCycleEnd: thirtyDaysFromNow.toISOString()
                });

                // Record Transaction
                const transactionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID;
                if (transactionsCollectionId && databases) {
                    await createTransactionRecord(databases, databaseId, transactionsCollectionId, {
                        userId: user.$id,
                        transactionId: payload.data.id,
                        credits: validatedCreditsToAdd,
                        packageName: displayName,
                        provider: "lemonsqueezy",
                        status: "active",
                        purchasedAt: new Date().toISOString(),
                        expiresAt: thirtyDaysFromNow.toISOString()
                    });
                } else {
                    console.error("Missing transactions collection ID or databases client");
                }

                // --- Influencer / Affiliate Tracking ---
                const discountCodeUsed = attributes.discount_code;
                if (discountCodeUsed) {
                    console.log(`🏷️ Discount code used: ${discountCodeUsed}. Searching for influencer...`);

                    try {
                        // Search for influencers by iterating through users (Appwrite limit is 100 per request)
                        let influencer: any = null;
                        let offset = 0;
                        const limit = 100;

                        while (!influencer) {
                            const result = await users.list([
                                Query.limit(limit),
                                Query.offset(offset)
                            ]);
                            if (result.users.length === 0) break;

                            influencer = result.users.find(u => (u.prefs as any)?.influencerCode === discountCodeUsed);

                            if (influencer || result.users.length < limit || offset >= 1000) break;
                            offset += limit;
                        }

                        if (influencer) {
                            console.log(`👤 Influencer found: ${influencer.name} (${influencer.$id})`);

                            const influencerPrefs = influencer.prefs as any;
                            const commPercentage = Number(influencerPrefs.influencer_commission_rate) || 30;
                            const orderAmount = attributes.total / 100;
                            const calculatedCommission = (orderAmount * commPercentage) / 100;

                            const newRedemption = {
                                id: payload.data.id,
                                timestamp: new Date().toISOString(),
                                planName: displayName,
                                amount: orderAmount,
                                commission: calculatedCommission,
                                status: "Approved", // Defaulting to Approved for influencers
                                currency: attributes.currency,
                                userEmail: user.email.replace(/(.{2})(.*)(?=@)/, "$1***"), // Mask email for privacy
                            };

                            const redemptions = Array.isArray(influencerPrefs.redemptions)
                                ? [newRedemption, ...influencerPrefs.redemptions].slice(0, 100) // Keep last 100
                                : [newRedemption];

                            await users.updatePrefs(influencer.$id, {
                                ...influencerPrefs,
                                totalRedemptions: (Number(influencerPrefs.totalRedemptions) || 0) + 1,
                                totalEarningsRevenue: (Number(influencerPrefs.totalEarningsRevenue) || 0) + orderAmount,
                                approvedCommission: (Number(influencerPrefs.approvedCommission) || 0) + calculatedCommission,
                                redemptions: redemptions
                            });

                            console.log("✅ Influencer stats updated successfully.");
                        } else {
                            console.log(`ℹ️ No matching influencer found for code: ${discountCodeUsed}`);
                        }
                    } catch (influencerError) {
                        console.error("❌ Error during influencer tracking:", influencerError);
                        // We don't return an error here to ensure the user still gets their credits
                    }
                }
                break;

            default:
                console.log(`Unhandled event: ${eventName}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
