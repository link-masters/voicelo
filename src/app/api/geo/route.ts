import { NextResponse } from "next/server";

export async function GET(req: Request) {
    let country = req.headers.get('x-vercel-ip-country') ||
        req.headers.get('cf-ipcountry') ||
        req.headers.get('x-country-code');

    // Handle Local Development
    if (!country && process.env.NODE_ENV === 'development') {
        country = 'PK';
    }

    return NextResponse.json({ country: country || 'unknown' });
}
