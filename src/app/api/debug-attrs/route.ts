import { NextResponse } from "next/server";
import { listVariants } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

export async function GET() {
    try {
        configureLemonSqueezy();
        const variantsResponse = await listVariants();
        // Find the one for starter_pack if possible
        const variant = variantsResponse.data?.data.find((v: any) => v.id === '1161696');
        return NextResponse.json({
            keys: Object.keys(variant?.attributes || {}),
            attributes: variant?.attributes
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
