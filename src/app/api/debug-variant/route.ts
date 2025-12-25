import { NextResponse } from "next/server";
import { listVariants } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

export async function GET() {
    try {
        configureLemonSqueezy();
        // Since I can't easily list prices directly without a weird query, 
        // I'll look at the variant again and see if there are relationships to prices.
        const variants = await listVariants();
        return NextResponse.json(variants.data?.data[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
