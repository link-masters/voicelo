import { NextResponse } from "next/server";
import { validatePaddleWebhook, getCreditsFromPaddleProduct } from "@/lib/paddle";
import { createAdminClient } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { createTransactionRecord } from "@/lib/transactions";

/**
 * Paddle Webhook Handler
 * 
 * Handles the following Paddle events:
 * - transaction.completed: When a payment is successfully completed
 */
export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const paddleSignature = req.headers.get("paddle-signature") || "";
        const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || "";
        const starterCredits = Number(process.env.NEXT_PUBLIC_CREDITS_STARTER_PACK) || 10000;
        const plusCredits = Number(process.env.NEXT_PUBLIC_CREDITS_PLUS_PACK) || 50000;

        // Validate webhook signature
        const isValid = await validatePaddleWebhook(rawBody, paddleSignature, webhookSecret);

        if (!isValid) {
            console.error("[Paddle Webhook] Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const eventType = payload.event_type;
        const data = payload.data;

        console.log("🔔 Paddle Webhook received:", eventType);

        // Extract user ID from custom data
        const customData = data.custom_data || {};
        const userId = customData.user_id || customData.userId;

        if (!userId) {
            console.warn("⚠️ No userId in custom data. This may be a test webhook.");
            // We return 200 to acknowledge receipt of test webhooks
            return NextResponse.json({ received: true, warning: "No userId provided" });
        }

        const { users, databases } = createAdminClient();
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

        switch (eventType) {
            case "transaction.completed": {
                console.log("💳 Processing completed transaction:", data.id);

                const transactionId = data.id;
                const customerEmail = data.customer?.email;
                const items = data.items || [];

                // Calculate total credits from items
                let totalCredits = 0;
                let packageDisplayName = "";

                for (const item of items) {
                    const priceName = item.price?.name || "";
                    const productName = item.product?.name || item.price?.product?.name || "";
                    const priceDescription = item.price?.description || "";

                    // Combine all available names into one search string for detection
                    const searchStr = `${productName} ${priceName} ${priceDescription}`.trim();
                    const credits = getCreditsFromPaddleProduct(searchStr);
                    const quantity = item.quantity || 1;

                    totalCredits += credits * quantity;

                    // Determine the best display name for this transaction
                    if (!packageDisplayName) {
                        if (credits === starterCredits) {
                            packageDisplayName = "starter_pack";
                        } else if (credits === plusCredits) {
                            packageDisplayName = "plus_pack";
                        } else if (credits === 200000) {
                            packageDisplayName = "elite_pack";
                        } else if (priceName && priceName.length > 5 && !priceName.startsWith('(')) {
                            packageDisplayName = priceName;
                        } else if (productName && productName !== "Unknown") {
                            packageDisplayName = productName;
                        }
                    }
                }

                if (!packageDisplayName) {
                    packageDisplayName = totalCredits >= plusCredits ? "plus_pack" : "starter_pack";
                }

                if (totalCredits === 0) {
                    console.error("❌ Could not determine credits for transaction items. Search strings were processed.");
                    return NextResponse.json({ error: "Unknown products" }, { status: 400 });
                }

                // Find user in Appwrite
                let user;
                try {
                    user = await users.get(userId);
                } catch (e) {
                    console.log(`🔍 User ${userId} not found by ID, searching by email...`);
                    if (customerEmail) {
                        const result = await users.list([Query.equal("email", customerEmail)]);
                        if (result.users.length > 0) {
                            user = result.users[0];
                        }
                    }
                }

                if (!user) {
                    console.error("❌ User not found for transaction:", userId);
                    return NextResponse.json({ error: "User not found" }, { status: 404 });
                }

                // Deduplication Check
                const isLastPurchase = user.prefs?.lastPurchaseId === transactionId;
                let isDbRecorded = false;
                const transactionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID;
                if (transactionsCollectionId && databases) {
                    const existingDocs = await databases.listDocuments(
                        databaseId,
                        transactionsCollectionId,
                        [Query.equal('transactionId', transactionId)]
                    );
                    if (existingDocs.total > 0) isDbRecorded = true;
                }

                if (isLastPurchase || isDbRecorded) {
                    console.log(`[Paddle Webhook] ⚠️ Transaction ${transactionId} already processed. Skipping.`);
                    return NextResponse.json({ received: true, message: "Transaction already processed" });
                }

                // Update credits
                const currentTotal = Number(user.prefs?.creditsTotal) || 0;
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                // Determine transaction status based on paddle status if available, or default "active"
                const status = data.status || "active";

                await users.updatePrefs(user.$id, {
                    ...user.prefs,
                    plan: "Pro User",
                    creditsTotal: currentTotal + totalCredits,
                    lastPurchaseId: transactionId,
                    lastPurchaseDate: new Date().toISOString(),
                    billingCycleEnd: thirtyDaysFromNow.toISOString(),
                    paymentProvider: "paddle"
                });

                // Create Transaction Record in new Table
                const dbTxColId = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID;
                if (dbTxColId && databases) {
                    await createTransactionRecord(databases, databaseId, dbTxColId, {
                        userId: user.$id,
                        transactionId: transactionId,
                        credits: totalCredits,
                        packageName: packageDisplayName,
                        provider: "paddle",
                        status: status,
                        purchasedAt: new Date().toISOString(),
                        expiresAt: thirtyDaysFromNow.toISOString()
                    });
                } else {
                    console.error("[Paddle Webhook] Missing NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID or Databases client");
                }
                console.log(`✅ Successfully added ${totalCredits} credits to user ${user.$id}`);

                // --- Influencer Tracking ---
                // Paddle might provide discount code directly or just discount_id
                let discountCode = data.discount?.code;
                const discountId = data.discount?.id || data.discount_id;

                // If code is missing but ID exists, try to fetch it from Paddle API
                if (!discountCode && discountId && process.env.PADDLE_API_KEY) {
                    try {
                        console.log(`🔍 Fetching discount details for ID: ${discountId}`);
                        const environment = process.env.PADDLE_ENVIRONMENT || process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';
                        const baseUrl = environment === 'production'
                            ? 'https://api.paddle.com'
                            : 'https://sandbox-api.paddle.com';

                        const res = await fetch(`${baseUrl}/discounts/${discountId}`, {
                            headers: {
                                'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`
                            }
                        });

                        if (res.ok) {
                            const discData = await res.json();
                            discountCode = discData.data?.code;
                            console.log(`🏷️ Found discount code: ${discountCode}`);
                        }
                    } catch (err) {
                        console.error("❌ Error fetching discount code:", err);
                    }
                }

                if (discountCode) {
                    try {
                        let influencer: any = null;
                        let offset = 0;
                        const limit = 100;

                        // Search for influencer
                        while (!influencer) {
                            const result = await users.list([
                                Query.limit(limit),
                                Query.offset(offset)
                            ]);
                            if (result.users.length === 0) break;

                            influencer = result.users.find(u => (u.prefs as any)?.influencerCode === discountCode);
                            if (influencer || result.users.length < limit || offset >= 1000) break;
                            offset += limit;
                        }

                        if (influencer) {
                            const influencerPrefs = influencer.prefs as any;
                            const commRate = Number(influencerPrefs.influencer_commission_rate) || 30;

                            // Use totals from transaction
                            const orderAmount = (data.details?.totals?.total || data.details?.totals?.grand_total || 0) / 100;
                            const commission = (orderAmount * commRate) / 100;

                            const redemption = {
                                id: transactionId,
                                timestamp: new Date().toISOString(),
                                planName: packageDisplayName,
                                amount: orderAmount,
                                commission: commission,
                                status: "Approved",
                                currency: data.currency_code || "USD",
                                userEmail: user.email?.replace(/(.{2})(.*)(?=@)/, "$1***"),
                            };

                            const redemptions = Array.isArray(influencerPrefs.redemptions)
                                ? [redemption, ...influencerPrefs.redemptions].slice(0, 100)
                                : [redemption];

                            // Save to user_transactions collection (same as regular purchases)
                            const transactionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID;
                            if (transactionsCollectionId && databases) {
                                const thirtyDaysFromNow = new Date();
                                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                                
                                await createTransactionRecord(databases, databaseId, transactionsCollectionId, {
                                    userId: influencer.$id,
                                    transactionId: `ref_${transactionId}`,
                                    credits: 0, // Commission-based rewards don't add credits directly
                                    packageName: "Referral Commission",
                                    provider: "internal",
                                    status: "completed",
                                    purchasedAt: new Date().toISOString(),
                                    expiresAt: thirtyDaysFromNow.toISOString()
                                });
                            }

                            await users.updatePrefs(influencer.$id, {
                                ...influencerPrefs,
                                totalRedemptions: (Number(influencerPrefs.totalRedemptions) || 0) + 1,
                                totalEarningsRevenue: (Number(influencerPrefs.totalEarningsRevenue) || 0) + orderAmount,
                                approvedCommission: (Number(influencerPrefs.approvedCommission) || 0) + commission,
                                redemptions
                            });
                            console.log(`✅ Influencer ${influencer.$id} updated for code ${discountCode}`);
                        }
                    } catch (err) {
                        console.error("❌ Error tracking influencer:", err);
                    }
                }
                break;
            }

            default:
                console.log(`ℹ️ Unhandled event: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("[Paddle Webhook Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
