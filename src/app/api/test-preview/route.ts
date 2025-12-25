import { NextResponse, NextRequest } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

export async function GET(req: NextRequest) {
    try {
        configureLemonSqueezy();
        const { searchParams } = new URL(req.url);
        const country = searchParams.get('country') || 'US';
        const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
        const variantId = "1161696";

        if (!storeId) {
            return NextResponse.json({ error: "LEMON_SQUEEZY_STORE_ID is not defined" }, { status: 500 });
        }

        const preview = await createCheckout(storeId, variantId, {
            preview: true,
            checkoutData: {
                billingAddress: {
                    country: country as any
                }
            }
        });

        return NextResponse.json(preview.data?.data.attributes.preview);
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
