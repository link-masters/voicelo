import { NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
    try {
        const { variantId, userId, userEmail, userName, discountCode } = await req.json();

        console.log(`[Checkout API] Creating checkout for variant: ${variantId}, user: ${userId}, discount: ${discountCode || 'none'}`);

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
            process.env.LEMON_SQUEEZY_STORE_ID!,
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

        console.log(`[Checkout API] Successfully created checkout: ${url}`);
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("[Checkout API System Error]:", error);
        return NextResponse.json({ error: "An unexpected system error occurred while generating your checkout link." }, { status: 500 });
    }
}
