import { Webhook } from "@creem_io/nextjs";
import { getCreditsFromCreemProduct, getCreemBaseUrl } from "@/lib/creem";
import { createAdminClient } from "@/lib/appwrite-server";
import { Query, ID } from "node-appwrite";
import { paymentConfig } from "@/config/payment";

export const POST = Webhook({
    webhookSecret: paymentConfig.creem.webhookSecret,
    onCheckoutCompleted: async (payload: any) => {
        try {
            const checkout = payload;
            const checkoutId = checkout.id;
            const customer = checkout.customer;
            const product = checkout.product;
            const metadata = checkout.metadata;
            const userId = metadata?.userId as string;

            console.log(`[Creem Webhook] 🚀 Event received. Checkout ID: ${checkoutId}, User: ${userId}`);

            const { users, databases } = createAdminClient();
            const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const redemptionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_REDEMPTIONS_COLLECTION_ID!;

            // 1. Fetch User (for credits)
            if (userId) {
                let user;
                try {
                    user = await users.get(userId);
                } catch (e) {
                    const email = customer?.email;
                    if (email) {
                        const result = await users.list([Query.equal("email", email)]);
                        if (result.users.length > 0) user = result.users[0];
                    }
                }

                if (user) {
                    const existingTransactions = Array.isArray(user.prefs?.transactions) ? user.prefs.transactions : [];
                    const isTransactionProcessed = existingTransactions.some((t: any) => t.id === checkoutId);

                    if (!isTransactionProcessed) {
                        const productName = product?.name || "";
                        let totalCredits = getCreditsFromCreemProduct(productName);
                        let packageDisplayName = "";

                        console.log(`[Creem Debug] Product: "${productName}", Initial Credits: ${totalCredits}`);
                        console.log(`[Creem Debug] Env Var STARTER: "${process.env.NEXT_PUBLIC_CREDITS_STARTER_PACK}"`);

                        const starterCredits = Number((process.env.NEXT_PUBLIC_CREDITS_STARTER_PACK || '').replace(/,/g, '')) || 10000;
                        const plusCredits = Number((process.env.NEXT_PUBLIC_CREDITS_PLUS_PACK || '').replace(/,/g, '')) || 50000;

                        if (totalCredits === 0) {
                            const amount = checkout.subtotal || checkout.total || checkout.amount || 0;
                            if (amount >= 1000) { totalCredits = plusCredits; packageDisplayName = 'plus_pack'; }
                            else if (amount >= 500) { totalCredits = starterCredits; packageDisplayName = 'starter_pack'; }
                        }

                        if (!packageDisplayName) {
                            if (totalCredits === starterCredits) packageDisplayName = "starter_pack";
                            else if (totalCredits === plusCredits) packageDisplayName = "plus_pack";
                            else if (totalCredits === 200000) packageDisplayName = "elite_pack";
                            else packageDisplayName = productName || "unknown_pack";
                        }

                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                        const newTransaction = {
                            id: checkoutId,
                            purchasedAt: new Date().toISOString(),
                            creditsAllotted: totalCredits,
                            expiresAt: thirtyDaysFromNow.toISOString(),
                            packageName: packageDisplayName,
                            status: "active",
                            provider: "creem"
                        };

                        await users.updatePrefs(user.$id, {
                            ...user.prefs,
                            plan: "Pro User",
                            creditsTotal: (Number(user.prefs?.creditsTotal) || 0) + totalCredits,
                            lastPurchaseId: checkoutId,
                            transactions: [...existingTransactions, newTransaction],
                        });
                        console.log(`[Creem Webhook] ✅ Credits added successfully for user ${user.$id}.`);
                    }
                }
            }

            // 2. Handle Influencer Tracking (Database Stored)
            const discountIdUsed = checkout.order?.discount;
            if (discountIdUsed) {
                try {
                    const apiKey = process.env.CREEM_API_KEY;
                    const baseUrl = getCreemBaseUrl();

                    // Step 2a: Get discount details
                    let usedCode = "";
                    try {
                        const resp = await fetch(`${baseUrl}/discounts?discount_id=${discountIdUsed}`, {
                            headers: { 'x-api-key': apiKey! }
                        });
                        if (resp.ok) {
                            const discountData = await resp.json();
                            usedCode = (discountData.code || "").toUpperCase();
                        }
                    } catch (e) {
                        console.warn("[Creem Webhook] Could not fetch discount details:", e);
                    }

                    // Step 2b: Search for Influencer
                    let influencer: any = null;
                    let offset = 0;
                    const limit = 100;

                    while (offset < 2000) {
                        const result = await users.list([Query.limit(limit), Query.offset(offset)]);
                        if (result.users.length === 0) break;

                        influencer = result.users.find(u => {
                            const p = u.prefs as any;
                            return p?.creemDiscountId === discountIdUsed || (usedCode && p?.influencerCode?.toUpperCase() === usedCode);
                        });

                        if (influencer) break;
                        if (result.users.length < limit) break;
                        offset += limit;
                    }

                    if (influencer) {
                        console.log(`[Creem Webhook] 👤 Found influencer: ${influencer.name} (${influencer.$id})`);

                        // Check if redemption already exists in DB
                        const existingRedemptions = await databases.listDocuments(
                            databaseId,
                            redemptionsCollectionId,
                            [Query.equal("checkoutId", checkoutId)]
                        );

                        if (existingRedemptions.total > 0) {
                            console.log(`[Creem Webhook] ℹ️ Redemption ${checkoutId} already exists in database. Skipping.`);
                        } else {
                            const influencerPrefs = influencer.prefs as any;
                            const influencerType = influencerPrefs.influencerType || "credits";

                            // Fetch from Creem Product API for the most accurate price source of truth
                            let orderAmount = (checkout.subtotal || checkout.total || checkout.amount || 0) / 100;

                            try {
                                const productResp = await fetch(`${baseUrl}/products/${product?.id}`, {
                                    headers: { 'x-api-key': apiKey! }
                                });
                                if (productResp.ok) {
                                    const productData = await productResp.json();
                                    const officialPrice = (productData.price || 0) / 100;
                                    if (officialPrice > 0) {
                                        orderAmount = officialPrice;
                                        console.log(`[Creem Webhook] 💰 Using API price for ${product?.name}: $${orderAmount}`);
                                    }
                                }
                            } catch (e) {
                                console.warn("[Creem Webhook] Failed to fetch product price from API:", e);
                            }
                            let calculatedCommission = 0;
                            let earnedCredits = 0;

                            if (influencerType === "commission") {
                                const commPercentage = Number(influencerPrefs.influencer_commission_rate) || 30;
                                calculatedCommission = (orderAmount * commPercentage) / 100;
                            } else {
                                // Dynamic rewards from environment variables
                                const starterReward = Number(process.env.NEXT_PUBLIC_INFLUENCER_REWARD_CREDITS_STARTER) || 5000;
                                const plusReward = Number(process.env.NEXT_PUBLIC_INFLUENCER_REWARD_CREDITS_PLUS) || 10000;

                                const productName = product?.name?.toLowerCase() || "";
                                if (productName.includes("plus") || productName.includes("pro") || productName.includes("turbo")) {
                                    earnedCredits = plusReward;
                                } else {
                                    earnedCredits = starterReward;
                                }
                            }

                            // Insert into database
                            await databases.createDocument(
                                databaseId,
                                redemptionsCollectionId,
                                ID.unique(),
                                {
                                    checkoutId: checkoutId,
                                    influencerId: influencer.$id,
                                    amount: orderAmount,
                                    commission: calculatedCommission,
                                    earnedCredits: earnedCredits,
                                    status: "Approved",
                                    currency: checkout.currency || "USD",
                                    planName: product?.name || "Premium Plan",
                                    userEmail: customer?.email?.replace(/(.{2})(.*)(?=@)/, "$1***") || "Hidden",
                                    timestamp: new Date().toISOString()
                                }
                            );

                            // Update aggregated stats in prefs
                            const updatedPrefs = { ...influencerPrefs };
                            updatedPrefs.totalRedemptions = (Number(influencerPrefs.totalRedemptions) || 0) + 1;
                            updatedPrefs.totalEarningsRevenue = (Number(influencerPrefs.totalEarningsRevenue) || 0) + orderAmount;

                            if (influencerType === "commission") {
                                updatedPrefs.approvedCommission = (Number(influencerPrefs.approvedCommission) || 0) + calculatedCommission;
                            } else {
                                updatedPrefs.totalEarnedCredits = (Number(influencerPrefs.totalEarnedCredits) || 0) + earnedCredits;
                                updatedPrefs.creditsTotal = (Number(influencerPrefs.creditsTotal) || 0) + earnedCredits;

                                // Add a transaction record for the credits earned
                                const influencerTransactions = Array.isArray(influencerPrefs.transactions) ? [...influencerPrefs.transactions] : [];
                                influencerTransactions.push({
                                    id: `ref_${checkoutId}`,
                                    purchasedAt: new Date().toISOString(),
                                    creditsAllotted: earnedCredits,
                                    packageName: "Referral Reward",
                                    status: "active",
                                    provider: "internal"
                                });
                                updatedPrefs.transactions = influencerTransactions;
                            }

                            await users.updatePrefs(influencer.$id, updatedPrefs);

                            console.log(`[Creem Webhook] ✅ Influencer stats updated (${influencerType}).`);
                        }
                    }
                } catch (affiliateError) {
                    console.error("[Creem Webhook] ❌ Influencer logic error:", affiliateError);
                }
            }
        } catch (error: any) {
            console.error("[Creem Webhook Error]:", error?.message || error);
            throw error;
        }
    },
});
