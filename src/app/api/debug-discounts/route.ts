import { NextResponse } from "next/server";
import { listDiscounts } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

export async function GET() {
    try {
        configureLemonSqueezy();
        const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
        const response = await listDiscounts({ filter: { storeId: storeId! } });
        return NextResponse.json(response.data?.data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
