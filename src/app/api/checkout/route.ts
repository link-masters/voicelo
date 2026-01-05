import { NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { paymentConfig, isLemonSqueezy, isPaddle } from "@/config/payment";

export async function POST(req: Request) {
    try {
        const { variantId, priceId, userId, userEmail, userName, discountCode } = await req.json();

        console.log(`[Checkout API] Creating checkout for ${paymentConfig.activeProvider}. ID: ${variantId || priceId}, user: ${userId}`);

        if (isLemonSqueezy()) {
            configureLemonSqueezy();

            // Only include discountCode if it's a non-empty string
            const checkoutData: any = {
                email: userEmail,
                name: userName,
                custom: {
                    userId: userId,
                },
            };

            if (discountCode && typeof discountCode === 'string') {
                checkoutData.discountCode = discountCode;
            }

            const checkout = await createCheckout(
                paymentConfig.lemonsqueezy.storeId,
                variantId,
                {
                    checkoutData,
                    checkoutOptions: {
                        discount: true,
                    },
                    productOptions: {
                        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/profile?checkout=success`,
                    },
                }
            );

            if (checkout.error) {
                console.error("[Checkout API Error] Lemon Squeezy SDK returned error:", checkout.error);
                const errorMsg = checkout.error.message || "The checkout could not be created. Please try again.";
                return NextResponse.json({ error: errorMsg }, { status: 422 });
            }

            const url = checkout.data?.data?.attributes?.url;
            if (!url) {
                console.error("[Checkout API Error] No URL in successful response:", JSON.stringify(checkout.data));
                return NextResponse.json({ error: "Lemon Squeezy did not return a valid checkout URL. Product may be misconfigured." }, { status: 500 });
            }

            console.log(`[Checkout API] Successfully created Lemon Squeezy checkout: ${url}`);
            return NextResponse.json({ url, provider: 'lemonsqueezy' });
        }

        if (isPaddle()) {
            // Paddle uses client-side checkout via Paddle.js
            // We return the configuration needed for the frontend to open checkout
            const paddlePriceId = priceId || variantId;

            if (!paddlePriceId || !paddlePriceId.startsWith('pri_')) {
                console.error("[Checkout API Error] Invalid Paddle price ID:", paddlePriceId);
                return NextResponse.json({
                    error: "Invalid price ID for Paddle checkout. Price ID must start with 'pri_'"
                }, { status: 400 });
            }

            console.log(`[Checkout API] Paddle checkout configured for price: ${paddlePriceId}`);

            // Return paddle checkout configuration
            // The actual checkout is handled client-side by Paddle.js
            return NextResponse.json({
                provider: 'paddle',
                priceId: paddlePriceId,
                customData: {
                    userId: userId,
                },
                customer: {
                    email: userEmail,
                    ...(userName && { name: userName }),
                },
                successUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/profile?checkout=success`,
                ...(discountCode && { discountCode }),
            });
        }

        return NextResponse.json({ error: "No active payment provider configured." }, { status: 500 });

    } catch (error: any) {
        console.error("[Checkout API System Error]:", error);
        return NextResponse.json({ error: "An unexpected system error occurred while generating your checkout link." }, { status: 500 });
    }
}
