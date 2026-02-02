import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicelo.com";

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/api/',
                '/verify-email/',
                '/checkout/',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
