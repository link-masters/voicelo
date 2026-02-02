import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicelo.com";

    const routes = [
        '',
        '/pricing',
        '/terms',
        '/privacy',
        '/refund',
        '/cookies',
        '/contact',
    ].map((route) => ({
        url: `${siteUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
