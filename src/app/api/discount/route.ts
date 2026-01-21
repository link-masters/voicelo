import { NextResponse } from "next/server";
import { getCreemBaseUrl } from "@/lib/creem";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const discountCode = searchParams.get('code') || process.env.CREEM_DEFAULT_DISCOUNT_CODE;

    if (!discountCode) {
        return NextResponse.json({ error: "No discount code provided" }, { status: 400 });
    }

    try {
        const apiKey = process.env.CREEM_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Creem API key not configured" }, { status: 500 });
        }

        const baseUrl = getCreemBaseUrl();
        // The user provided the endpoint: GET https://api.creem.io/v1/discounts?discount_code=...
        const response = await fetch(`${baseUrl}/discounts?discount_code=${encodeURIComponent(discountCode)}`, {
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Discount not found" }, { status: 404 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Discount API] Error fetching discount:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
