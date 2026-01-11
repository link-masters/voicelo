import { Paddle, Environment } from '@paddle/paddle-node-sdk';

/**
 * Paddle Payment Gateway Configuration
 * 
 * This module provides utilities for working with Paddle payments.
 * Paddle uses client-side checkout, so most configuration is for webhooks.
 */

export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: (process.env.PADDLE_ENVIRONMENT || process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT) === 'production'
        ? Environment.production
        : Environment.sandbox,
});

export interface PaddleConfig {
    clientToken: string;
    environment: 'sandbox' | 'production';
    vendorId?: string;
}

/**
 * Get Paddle client configuration for frontend use
 */
export const getPaddleClientConfig = (): PaddleConfig => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    const vendorId = process.env.PADDLE_VENDOR_ID || '';

    return {
        clientToken,
        environment,
        vendorId,
    };
};

/**
 * Validate Paddle webhook signature
 * Paddle uses a shared secret for webhook verification
 */
export const validatePaddleWebhook = async (
    rawBody: string,
    signature: string,
    webhookSecret: string
): Promise<boolean> => {
    if (!signature || !webhookSecret) {
        console.error('[Paddle Webhook] Missing signature or webhook secret');
        return false;
    }

    try {
        // Paddle uses HMAC-SHA256 for webhook signatures
        const crypto = await import('crypto');
        const ts = signature.split(';').find(s => s.startsWith('ts='))?.split('=')[1];
        const h1 = signature.split(';').find(s => s.startsWith('h1='))?.split('=')[1];

        if (!ts || !h1) {
            console.error('[Paddle Webhook] Invalid signature format');
            return false;
        }

        // Build the signed payload
        const signedPayload = `${ts}:${rawBody}`;

        // Create HMAC
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');

        // Compare signatures (timing-safe)
        return crypto.timingSafeEqual(
            Buffer.from(h1, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('[Paddle Webhook] Signature validation error:', error);
        return false;
    }
};

/**
 * Map Paddle product names to credits
 */
export const getCreditsFromPaddleProduct = (productName: string): number => {
    const name = productName.toLowerCase();

    // Specific product mappings based on name keywords
    if (name.includes('starter')) return 10000;
    if (name.includes('plus') || name.includes('turbo') || name.includes('pro')) return 50000;
    if (name.includes('elite') || name.includes('enterprise')) return 200000;

    // Direct credit amount detection (e.g. "10,000 Credits")
    if (name.includes('10,000') || name.includes('10000')) return 10000;
    if (name.includes('50,000') || name.includes('50000')) return 50000;
    if (name.includes('200,000') || name.includes('200000')) return 200000;

    // Testing/Fallback mappings for simulations
    if (name.includes('test') || name.includes('pack')) return 10000;

    console.warn(`[Paddle] Unknown product name: ${productName}`);
    return 0;
};

/**
 * Format price from Paddle (cents to display)
 */
export const formatPaddlePrice = (
    amount: string | number,
    currencyCode: string
): string => {
    const numAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    const price = numAmount / 100;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: price < 10 ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(price);
};
