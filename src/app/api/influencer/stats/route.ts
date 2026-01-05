import { NextResponse } from "next/server";
import { listDiscounts, listDiscountRedemptions, getOrder } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { createAdminClient } from "@/lib/appwrite-server";
import { paymentConfig, isLemonSqueezy, isPaddle } from "@/config/payment";
import { paddle } from "@/lib/paddle";

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
        const { users } = createAdminClient();
        const user = await users.get(userId);
        const influencerCode = (user.prefs as any)?.influencerCode;

        if (!influencerCode) {
            return NextResponse.json({ error: "User is not an influencer" }, { status: 403 });
        }

        if (!isLemonSqueezy()) {
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
                    const redemptions = userPrefs.redemptions || [];

                    // Note: Paddle uses 'timesUsed' for usage count
                    const usageCount = paddleDiscount ? paddleDiscount.timesUsed : (userPrefs.totalRedemptions || 0);
                    const usageLimit = paddleDiscount ? paddleDiscount.usageLimit : null;

                    const responseData = {
                        totalRedemptions: usageCount,
                        totalEarnings: Number(userPrefs.totalEarningsRevenue) || 0,
                        approvedCommission: Number(userPrefs.approvedCommission) || 0,
                        redemptions: redemptions,
                        usageLimit: usageLimit,
                        usageCount: usageCount,
                        influencerCode,
                        currency: "USD",
                        message: paddleDiscount ? undefined : "Discount details synced from local records."
                    };

                    // Update Cache
                    statsCache[userId] = {
                        timestamp: Date.now(),
                        data: responseData
                    };

                    return NextResponse.json(responseData);
                } catch (err) {
                    console.error("[Influencer API] Paddle stats error:", err);
                    // Fallback to cached/stored data if Paddle API fails
                }
            }

            console.warn(`[Influencer API] Influencer stats not yet fully implemented for ${paymentConfig.activeProvider}`);
            return NextResponse.json({
                totalRedemptions: (user.prefs as any)?.totalRedemptions || 0,
                totalEarnings: (user.prefs as any)?.totalEarningsRevenue || 0,
                redemptions: (user.prefs as any)?.redemptions || [],
                message: `Influencer statistics are currently using local records for ${paymentConfig.activeProvider}.`
            });
        }

        configureLemonSqueezy();

        // 2. Find the Discount ID in Lemon Squeezy for this code
        const discountsResponse = await listDiscounts();
        const discount = discountsResponse.data?.data?.find(
            (d: any) => d.attributes.code.toUpperCase() === influencerCode.toUpperCase()
        );

        if (!discount) {
            return NextResponse.json({
                totalRedemptions: 0,
                totalEarnings: 0,
                redemptions: [],
                message: "No active discount found in Lemon Squeezy for this code."
            });
        }

        const discountId = discount.id;

        // 3. Fetch redemptions and INCLUDE the associated Order data
        const redemptionsResponse = await listDiscountRedemptions({
            filter: { discountId },
            page: { size: 100 },
            include: ['order'] // This is the key to getting REAL data
        });

        const redemptionsData = redemptionsResponse.data?.data || [];
        const included = (redemptionsResponse.data as any)?.included || [];

        // 4. Format the data by mapping redemptions to their Orders
        const formattedRedemptions = await Promise.all(redemptionsData.map(async (red: any) => {
            const attr = red.attributes;

            // Strict match on the 'included' order object
            let orderFull = included.find(
                (inc: any) => inc.type === 'orders' && String(inc.id) === String(attr.order_id)
            );

            let orderData = orderFull?.attributes;

            // FALLBACK: If order wasn't in 'included', fetch it explicitly
            if (!orderData) {
                try {
                    const singleOrder = await getOrder(attr.order_id);
                    orderData = singleOrder.data?.data?.attributes;
                } catch (e) {
                    console.warn(`Order ${attr.order_id} could not be fetched.`);
                }
            }

            // PRIORITY: Use total_usd if available (official Lemon Squeezy field for orders)
            const amountUsd = orderData
                ? (orderData.total_usd || orderData.total) / 100
                : attr.amount / 100;

            // 1. Precise Attribute Extraction (Official LS Doc structure)
            const item = orderData?.first_order_item;
            let detectedName = "";

            if (item?.variant_name && item.variant_name.toLowerCase() !== "default") {
                detectedName = item.variant_name;
            } else if (item?.product_name) {
                detectedName = item.product_name;
            } else if (orderData?.variant_name && orderData.variant_name.toLowerCase() !== "default") {
                detectedName = orderData.variant_name;
            } else if (orderData?.product_name) {
                detectedName = orderData.product_name;
            }

            // 2. Safeguard against empty or technical 'Default' names
            if (!detectedName || detectedName.toLowerCase() === "default") {
                detectedName = attr.discount_name || "Plan Purchase";
            }

            // 3. Technical to Beautiful Mapping
            // This handles the 'starter_pack' slug seen in your image
            const nameMapping: Record<string, string> = {
                "starter_pack": "Starter Pack",
                "turbo_pack": "Turbo Pack",
                "elite_pack": "Elite Pack",
                "test50": "Standard Pack" // Force it away from the code name if it somehow leaks here
            };

            const lookupKey = detectedName.toLowerCase().replace(/\s+/g, '_');
            const finalName = nameMapping[lookupKey] || detectedName.replace(" (Default)", "");

            return {
                id: red.id,
                orderId: attr.order_id,
                code: attr.discount_code,
                amount: amountUsd,
                currency: "USD",
                timestamp: attr.created_at,
                userEmail: "Verified Customer",
                planName: finalName
            };
        }));

        // 5. Calculate total earnings and commissions with NORMALIZATION
        // This prevents overpaying due to 1-cent currency conversion rounding (e.g. $1.79 instead of $1.78)
        const COMMISSION_RATE = 0.30;

        // Define your standard DISCOUNTED prices for your packs
        const priceStandards: Record<string, number> = {
            "Starter Pack": 1.25,
            "Turbo Pack": 1.78,
            "Elite Pack": 5.00 // Example
        };

        const redemptionsWithCommission = formattedRedemptions.map(r => {
            const standardPrice = priceStandards[r.planName];
            const commissionBase = standardPrice || r.amount;

            // 6. Calculate Status (3-day vetting period)
            const redemptionDate = new Date(r.timestamp).getTime();
            const now = Date.now();
            const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
            const status = (now - redemptionDate) > threeDaysInMs ? 'Approved' : 'Pending';

            return {
                ...r,
                commissionBase: commissionBase,
                commission: Number((commissionBase * COMMISSION_RATE).toFixed(2)),
                status
            };
        });

        const totalEarningsCalculated = redemptionsWithCommission.reduce((acc, curr) => acc + curr.amount, 0);
        const totalCommissionCalculated = redemptionsWithCommission.reduce((acc, curr) => acc + curr.commission, 0);
        const approvedCommissionCalculated = redemptionsWithCommission
            .filter(r => r.status === 'Approved')
            .reduce((acc, curr) => acc + curr.commission, 0);

        const responseData = {
            totalRedemptions: redemptionsData.length,
            totalEarnings: totalEarningsCalculated,
            totalCommission: totalCommissionCalculated,
            approvedCommission: approvedCommissionCalculated,
            commissionRate: COMMISSION_RATE,
            currency: "USD",
            redemptions: redemptionsWithCommission,
            influencerCode,
            usageLimit: (discount.attributes as any).is_limited_redemptions || (discount.attributes as any).max_redemptions > 0
                ? (discount.attributes as any).max_redemptions || (discount.attributes as any).usage_limit
                : null,
            usageCount: Math.max((discount.attributes as any).usage_count || 0, redemptionsData.length)
        };

        // Update Cache
        statsCache[userId] = {
            timestamp: Date.now(),
            data: responseData
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("[Influencer API Error]:", error);
        return NextResponse.json({ error: "Failed to fetch influencer stats" }, { status: 500 });
    }
}
