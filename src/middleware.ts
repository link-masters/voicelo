import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Maintenance Mode Logic
    const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    const bypassKey = process.env.MAINTENANCE_BYPASS_KEY || 'secret_bypass_key_123';

    // Check for bypass cookie
    const hasBypass = request.cookies.get('maintenance_bypass')?.value === bypassKey;

    // Check for bypass query param (sets the cookie)
    const url = new URL(request.nextUrl);
    const bypassQuery = url.searchParams.get('maintenance_key');

    // If bypass query param matches, set cookie and redirect to home
    if (bypassQuery === bypassKey) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.set('maintenance_bypass', bypassKey, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        return response;
    }

    // Paths that are ALWAYS allowed (even in maintenance)
    const isPublicAsset =
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/favicon.ico') ||
        url.pathname.startsWith('/images') ||
        url.pathname.includes('.'); // files like .png, .svg

    const isMaintenancePage = url.pathname === '/maintenance';

    if (maintenanceMode && !hasBypass && !isPublicAsset && !isMaintenancePage) {
        return NextResponse.rewrite(new URL('/maintenance', request.url));
    }

    return NextResponse.next();
}

// Config to match all paths except for some specific ones
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
