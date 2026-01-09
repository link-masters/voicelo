import { NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { paymentConfig, isLemonSqueezy, isPaddle, isCreem } from "@/config/payment";
import { getCreemBaseUrl } from "@/lib/creem";

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

        if (isCreem()) {
            const creemProductId = priceId || variantId;

            if (!creemProductId) {
                return NextResponse.json({
                    error: "Product ID is required for Creem checkout."
                }, { status: 400 });
            }

            console.log(`[Checkout API] Creating Creem checkout for product: ${creemProductId}`);

            const apiKey = process.env.CREEM_API_KEY;
            if (!apiKey) {
                console.error("[Checkout API Error] CREEM_API_KEY not configured");
                return NextResponse.json({ error: "Payment provider configuration error." }, { status: 500 });
            }

            const baseUrl = getCreemBaseUrl();
            const response = await fetch(`${baseUrl}/checkouts`, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: creemProductId,
                    customer: {
                        email: userEmail,
                    },
                    metadata: {
                        userId: userId,
                    },
                    success_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/profile?checkout=success`,
                    ...(discountCode && { discount_code: discountCode }),
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[Checkout API Error] Creem API error:", response.status, errorText);
                return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
            }

            const data = await response.json();
            // Assuming response structure has { checkout_url: "..." } or similar
            // Inspecting docs or search result [1]: "This action generates a checkout URL"
            // Often it's `url` or `checkoutUrl`.
            const url = data.checkout_url || data.url;

            if (!url) {
                console.error("[Checkout API Error] Creem did not return a checkout URL:", JSON.stringify(data));
                return NextResponse.json({ error: "Invalid response from payment provider." }, { status: 500 });
            }

            return NextResponse.json({
                url: url,
                provider: 'creem'
            });
        }

        return NextResponse.json({ error: "No active payment provider configured." }, { status: 500 });

    } catch (error: any) {
        console.error("[Checkout API System Error]:", error);
        return NextResponse.json({ error: "An unexpected system error occurred while generating your checkout link." }, { status: 500 });
    }
}
