import { NextResponse } from "next/server";
import { listDiscounts, listDiscountRedemptions, getOrder } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { createAdminClient } from "@/lib/appwrite-server";
import { paymentConfig, isLemonSqueezy, isPaddle, isCreem } from "@/config/payment";
import { getCreemBaseUrl } from "@/lib/creem";
import { paddle } from "@/lib/paddle";
import { Query } from "node-appwrite";

// Global cache for influencer stats per user
interface CachedStats {
    timestamp: number;
    data: any;
}
const statsCache: Record<string, CachedStats> = {};
const CACHE_DURATION = 600 * 1000; // 10 minutes

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const refresh = searchParams.get("refresh") === "true";

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // 0. Check Cache
        if (!refresh && statsCache[userId]) {
            const cached = statsCache[userId];
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                console.log(`[Influencer API] Serving cached data for user ${userId}`);
                return NextResponse.json(cached.data);
            }
        }

        // 1. Get user's influencer code from Appwrite
        const { users, databases } = createAdminClient();
        const user = await users.get(userId);
        const influencerCode = (user.prefs as any)?.influencerCode;

        if (!influencerCode) {
            return NextResponse.json({ error: "User is not an influencer" }, { status: 403 });
        }

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const redemptionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_REDEMPTIONS_COLLECTION_ID!;

        // 2. Handle Specialized Providers
        if (isPaddle()) {
            try {
                console.log(`[Influencer API] Fetching Paddle stats for code: ${influencerCode}`);

                let paddleDiscount: any = null;
                const discountsCollection = paddle.discounts.list();

                for await (const discount of discountsCollection) {
                    if (discount.code && discount.code.toUpperCase() === influencerCode.toUpperCase()) {
                        paddleDiscount = discount;
                        break;
                    }
                }

                const userPrefs = user.prefs as any;
                // For Paddle, we still use prefs for now as requested for Creem specifically
                const redemptions = userPrefs.redemptions || [];

                const responseData = {
                    totalRedemptions: paddleDiscount ? paddleDiscount.timesUsed : (userPrefs.totalRedemptions || 0),
                    totalEarnings: Number(userPrefs.totalEarningsRevenue) || 0,
                    approvedCommission: Number(userPrefs.approvedCommission) || 0,
                    redemptions: redemptions,
                    usageLimit: paddleDiscount ? paddleDiscount.usageLimit : null,
                    usageCount: paddleDiscount ? paddleDiscount.timesUsed : 0,
                    influencerCode,
                    currency: "USD"
                };

                return NextResponse.json(responseData);
            } catch (err) {
                console.error("[Influencer API] Paddle stats error:", err);
            }
        }

        if (isCreem()) {
            const apiKey = process.env.CREEM_API_KEY;
            const baseUrl = getCreemBaseUrl();
            const discountId = (user.prefs as any)?.creemDiscountId;

            let usageCount = 0;
            let usageLimit: number | null = null;

            if (discountId) {
                try {
                    const resp = await fetch(`${baseUrl}/discounts?discount_id=${discountId}`, {
                        headers: { 'x-api-key': apiKey! }
                    });
                    if (resp.ok) {
                        const discount = await resp.json();
                        usageCount = discount.redeem_count || 0;
                        usageLimit = discount.max_redemptions || 1000;
                    }
                } catch (e) {
                    console.error("[Influencer Stats] Creem API Error:", e);
                }
            }

            // Fetch redemptions from Database
            let redemptionsList: any[] = [];
            try {
                const response = await databases.listDocuments(
                    databaseId,
                    redemptionsCollectionId,
                    [
                        Query.equal("influencerId", userId),
                        Query.orderDesc("timestamp"),
                        Query.limit(100)
                    ]
                );
                redemptionsList = response.documents.map(doc => ({
                    id: doc.checkoutId,
                    timestamp: doc.timestamp,
                    planName: doc.planName,
                    amount: doc.amount,
                    commission: doc.commission,
                    earnedCredits: doc.earnedCredits || 0,
                    status: doc.status,
                    currency: doc.currency,
                    userEmail: doc.userEmail
                }));
            } catch (dbError) {
                console.error("[Influencer Stats] Database fetch error:", dbError);
            }

            const prefs = user.prefs as any;
            const influencerType = prefs.influencerType || "credits";
            const totalRedemptions = Math.max(usageCount, redemptionsList.length, prefs.totalRedemptions || 0);

            // Recalculate stats from DB list if available, otherwise use prefs
            const totalEarnings = redemptionsList.length > 0
                ? redemptionsList.reduce((sum, r) => sum + r.amount, 0)
                : (Number(prefs.totalEarningsRevenue) || 0);

            const approvedCommission = redemptionsList.length > 0
                ? redemptionsList.filter(r => r.status === "Approved").reduce((sum, r) => sum + r.commission, 0)
                : (Number(prefs.approvedCommission) || 0);

            const totalEarnedCredits = redemptionsList.length > 0
                ? redemptionsList.reduce((sum, r) => sum + (r.earnedCredits || 0), 0)
                : (Number(prefs.totalEarnedCredits) || 0);

            const stats = {
                totalRedemptions,
                totalEarnings,
                approvedCommission,
                totalEarnedCredits,
                influencerType,
                redemptions: redemptionsList,
                usageLimit,
                usageCount,
                currency: "USD",
                influencerCode
            };

            statsCache[userId] = { data: stats, timestamp: Date.now() };
            return NextResponse.json(stats);
        }

        // 3. Fallback / Lemon Squeezy
        if (isLemonSqueezy()) {
            configureLemonSqueezy();
            const discountsResponse = await listDiscounts();
            const discount = discountsResponse.data?.data?.find(
                (d: any) => d.attributes.code.toUpperCase() === influencerCode.toUpperCase()
            );

            if (!discount) {
                return NextResponse.json({
                    totalRedemptions: 0,
                    totalEarnings: 0,
                    redemptions: [],
                    message: "No active discount found in Lemon Squeezy."
                });
            }

            const redemptionsResponse = await listDiscountRedemptions({
                filter: { discountId: discount.id },
                page: { size: 100 },
                include: ['order']
            });

            const redemptionsData = redemptionsResponse.data?.data || [];
            const included = (redemptionsResponse.data as any)?.included || [];

            const formattedRedemptions = await Promise.all(redemptionsData.map(async (red: any) => {
                const attr = red.attributes;
                let orderFull = included.find((inc: any) => inc.type === 'orders' && String(inc.id) === String(attr.order_id));
                let orderData = orderFull?.attributes;

                const amountUsd = orderData ? (orderData.total_usd || orderData.total) / 100 : attr.amount / 100;
                const status = (Date.now() - new Date(attr.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000 ? 'Approved' : 'Pending';

                const influencerCommissionRate = Number((user.prefs as any)?.influencer_commission_rate) || 30;
                const commission = (amountUsd * influencerCommissionRate) / 100;

                return {
                    id: red.id,
                    timestamp: attr.created_at,
                    planName: attr.discount_name || "Plan Purchase",
                    amount: amountUsd,
                    commission: commission,
                    status: status,
                    currency: orderData?.currency || 'USD',
                    userEmail: orderData?.user_email?.replace(/(.{2})(.*)(?=@)/, "$1***"),
                };
            }));

            formattedRedemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            const responseData = {
                totalRedemptions: formattedRedemptions.length,
                totalEarnings: formattedRedemptions.reduce((acc, r) => acc + r.amount, 0),
                approvedCommission: formattedRedemptions.filter(r => r.status === 'Approved').reduce((acc, r) => acc + r.commission, 0),
                redemptions: formattedRedemptions,
                usageLimit: (discount.attributes as any).usage_limit,
                usageCount: (discount.attributes as any).usage_count,
                influencerCode,
                currency: "USD"
            };

            statsCache[userId] = { timestamp: Date.now(), data: responseData };
            return NextResponse.json(responseData);
        }

        // Default Fallback
        return NextResponse.json({
            totalRedemptions: (user.prefs as any)?.totalRedemptions || 0,
            totalEarnings: (user.prefs as any)?.totalEarningsRevenue || 0,
            approvedCommission: (user.prefs as any)?.approvedCommission || 0,
            redemptions: [],
            influencerCode
        });

    } catch (err: any) {
        console.error("[Influencer API Error]:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
