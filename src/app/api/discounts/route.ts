import { NextResponse } from "next/server";
import { getCreemBaseUrl } from "@/lib/creem";

/**
 * Create a new discount code via Creem API
 * Proxy mainly for admin/system usage or influencer code generation
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const apiKey = process.env.CREEM_API_KEY;

        if (!apiKey) {
            console.error("[Discounts API] CREEM_API_KEY not configured");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Validate basic required fields
        if (!body.name || !body.code || !body.type || !body.limit) {
            // We allow the underlying API to handle most validation, but these are essential
            // Creem typically requires: name, code, type (percentage/fixed), percentage/amount, limit
        }

        const baseUrl = getCreemBaseUrl();

        console.log("[Discounts API] Creating discount:", body.code);

        const response = await fetch(`${baseUrl}/discounts`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            // Handle empty or text responses
            console.error("[Discounts API] Failed to parse response JSON");
            return NextResponse.json({ error: "Upstream API error" }, { status: 502 });
        }

        if (!response.ok) {
            console.error("[Discounts API] Creem error:", JSON.stringify(data));
            return NextResponse.json({
                error: data.message || data.error?.message || "Failed to create discount via Creem API"
            }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[Discounts API] System error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
