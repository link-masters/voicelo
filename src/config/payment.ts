export type PaymentProvider = 'lemonsqueezy' | 'paddle' | 'creem';

export interface PaymentConfig {
    /**
     * The currently active payment gateway.
     * Switching this will change how products are fetched and how checkouts are created.
     */
    activeProvider: PaymentProvider;

    /**
     * Lemon Squeezy specific configuration
     */
    lemonsqueezy: {
        storeId: string;
    };

    /**
     * Paddle specific configuration
     */
    paddle: {
        vendorId: string;
        environment: 'sandbox' | 'production';
        clientToken: string;
    };

    /**
     * Creem specific configuration
     */
    creem: {
        apiKey: string;
        webhookSecret: string;
        environment: 'test' | 'production';
    };
}

/**
 * Global payment configuration.
 * Change this to switch gateways.
 */
export const paymentConfig: PaymentConfig = {
    // Use environment variable if available, otherwise default to 'lemonsqueezy'
    activeProvider: (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER as PaymentProvider) || 'lemonsqueezy',

    lemonsqueezy: {
        storeId: process.env.LEMON_SQUEEZY_STORE_ID || '',
    },

    paddle: {
        vendorId: process.env.PADDLE_VENDOR_ID || '',
        environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
    },

    creem: {
        apiKey: process.env.CREEM_API_KEY || '',
        webhookSecret: process.env.CREEM_WEBHOOK_SECRET || '',
        environment: (process.env.NEXT_PUBLIC_CREEM_ENVIRONMENT as 'test' | 'production') || 'production',
    }
};

/**
 * Helper to check which provider is active
 */
export const isLemonSqueezy = () => paymentConfig.activeProvider === 'lemonsqueezy';
export const isPaddle = () => paymentConfig.activeProvider === 'paddle';
export const isCreem = () => paymentConfig.activeProvider === 'creem';

/**
 * Get the human-readable name of the active provider
 */
export const getActiveProviderName = () => {
    switch (paymentConfig.activeProvider) {
        case 'lemonsqueezy':
            return 'Lemon Squeezy';
        case 'paddle':
            return 'Paddle';
        case 'creem':
            return 'Creem';
        default:
            return 'our payment processor';
    }
};

/**
 * Get Paddle client configuration for frontend use
 * Safe to use in client components
 */
export const getPaddleClientConfig = () => ({
    clientToken: paymentConfig.paddle.clientToken,
    environment: paymentConfig.paddle.environment,
});

/**
 * Check if payment provider is properly configured
 */
export const isPaymentConfigured = (): boolean => {
    if (isLemonSqueezy()) {
        return Boolean(paymentConfig.lemonsqueezy.storeId);
    }
    if (isPaddle()) {
        return Boolean(paymentConfig.paddle.clientToken);
    }
    if (isCreem()) {
        return Boolean(paymentConfig.creem.apiKey);
    }
    return false;
};

