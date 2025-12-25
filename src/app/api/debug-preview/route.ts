import { NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

export async function GET() {
    try {
        configureLemonSqueezy();
        const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
        const variantId = "1161786"; // Turbo Pack
        const code = "AZNDQ2MQ";

        const checkout = await createCheckout(storeId!, variantId, {
            preview: true,
            checkoutData: {
                discountCode: code,
                billingAddress: { country: 'US' }
            }
        });

        if (checkout.error) {
            return NextResponse.json({
                error: checkout.error.message,
                cause: checkout.error.cause
            });
        }

        return NextResponse.json(checkout.data?.data.attributes.preview);
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
