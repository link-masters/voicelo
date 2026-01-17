import { Creem } from 'creem';

/**
 * Creem SDK Initialization
 * 
 * This module exports a configured Creem client.
 * Ensure CREEM_API_KEY is set in your environment variables.
 */

// Initialize the Creem SDK
// We use the API key from environment variables directly to avoid circular dependencies with config
export const creem = new Creem({
    apiKey: process.env.CREEM_API_KEY || '',
} as any);

/**
 * Get Creem Base URL
 * Returns test API URL if in test mode
 */
export const getCreemBaseUrl = (): string => {
    // Check for test environment
    const isTest = process.env.NEXT_PUBLIC_CREEM_ENVIRONMENT === 'test';
    return isTest ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1';
};

/**
 * Format price from Creem (cents to display)
 */
export const formatCreemPrice = (
    amount: number | string,
    currency: string = 'USD'
): string => {
    const numAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    const price = numAmount / 100;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: price % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(price);
};

/**
 * Map Creem product names/metadata to credits
 * This mimics the logic in paddle.ts/lemonsqueezy.ts
 */
export const getCreditsFromCreemProduct = (productName: string): number => {
    const name = productName.toLowerCase();

    // Get credit values from environment variables
    const starterCredits = Number(process.env.NEXT_PUBLIC_CREDITS_STARTER_PACK) || 10000;
    const plusCredits = Number(process.env.NEXT_PUBLIC_CREDITS_PLUS_PACK) || 50000;
    const eliteCredits = 200000; // Keep elite hardcoded or add to env if needed later

    // Specific product mappings based on name keywords
    if (name.includes('starter')) return starterCredits;
    if (name.includes('plus') || name.includes('turbo') || name.includes('pro')) return plusCredits;
    if (name.includes('elite') || name.includes('enterprise')) return eliteCredits;

    // Direct credit amount detection (e.g. "10,000 Credits")
    // Note: This logic overrides the env vars if the name explicitly contains numbers.
    // We keep this for flexibility, but the keyword match above takes precedence if found first within the name check logic.
    // Actually, to fully respect the user's wish to "use env vars instead of assuming",
    // we should prioritize the env vars for known pack names.

    if (name.includes('10,000') || name.includes('10000')) return starterCredits;
    if (name.includes('50,000') || name.includes('50000')) return plusCredits;
    if (name.includes('200,000') || name.includes('200000')) return eliteCredits;

    // Testing/Fallback mappings
    if (name.includes('test') || name.includes('pack')) return starterCredits;

    console.warn(`[Creem] Unknown product name mapping: ${productName}`);
    return 0;
};

/**
 * Validate Creem webhook signature
 */
export const validateCreemWebhook = async (
    rawBody: string,
    signature: string,
    webhookSecret: string
): Promise<boolean> => {
    if (!signature || !webhookSecret) {
        console.error('[Creem Webhook] Missing signature or webhook secret');
        return false;
    }

    try {
        const crypto = await import('crypto');

        // Compute HMAC-SHA256 signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        // Compare signatures (timing-safe)
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('[Creem Webhook] Signature validation error:', error);
        return false;
    }
};
