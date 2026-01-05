"use client";

import { useEffect, useCallback, useState } from "react";
import { Loader2 } from "lucide-react";


interface PaddleCheckoutProps {
    clientToken: string;
    environment: 'sandbox' | 'production';
    onSuccess?: (data: any) => void;
    onClose?: () => void;
    onError?: (error: any) => void;
}

interface CheckoutConfig {
    priceId: string;
    customData?: Record<string, any>;
    customer?: {
        email?: string;
        name?: string;
    };
    discountCode?: string;
    successUrl?: string;
}

/**
 * Paddle Checkout Hook
 * Provides methods to initialize Paddle.js and open checkout
 */
export function usePaddleCheckout({
    clientToken,
    environment,
    onSuccess,
    onClose,
    onError,
}: PaddleCheckoutProps) {
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load Paddle.js script
        if (typeof window !== 'undefined' && !window.Paddle) {
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
            script.async = true;

            script.onload = () => {
                try {
                    // Initialize Paddle - environment is determined by token prefix (test_ vs live_)
                    window.Paddle!.Initialize({
                        token: clientToken,
                        eventCallback: (event: any) => {
                            console.log('[Paddle Event]:', event.name, event);

                            switch (event.name) {
                                case 'checkout.completed':
                                    onSuccess?.(event.data);
                                    break;
                                case 'checkout.closed':
                                    onClose?.();
                                    break;
                                case 'checkout.error':
                                    onError?.(event.data);
                                    break;
                            }
                        },
                    });

                    setIsReady(true);
                    setIsLoading(false);
                    console.log('[Paddle] Initialized successfully');
                } catch (error) {
                    console.error('[Paddle] Initialization error:', error);
                    onError?.(error);
                    setIsLoading(false);
                }
            };

            script.onerror = () => {
                console.error('[Paddle] Failed to load Paddle.js');
                onError?.(new Error('Failed to load Paddle.js'));
                setIsLoading(false);
            };

            document.body.appendChild(script);
        } else if (window.Paddle) {
            setIsReady(true);
            setIsLoading(false);
        }
    }, [clientToken, environment, onSuccess, onClose, onError]);

    const openCheckout = useCallback((config: CheckoutConfig) => {
        if (!window.Paddle) {
            console.error('[Paddle] Paddle.js not loaded');
            onError?.(new Error('Paddle.js not loaded'));
            return;
        }

        try {
            const checkoutSettings: any = {
                items: [{ priceId: config.priceId, quantity: 1 }],
            };

            // Add customer info if available
            if (config.customer?.email) {
                checkoutSettings.customer = {
                    email: config.customer.email,
                };
            }

            // Add custom data
            if (config.customData) {
                checkoutSettings.customData = config.customData;
            }

            // Add discount/coupon code
            if (config.discountCode) {
                checkoutSettings.discountCode = config.discountCode;
            }

            // Add success URL for redirect after checkout
            if (config.successUrl) {
                checkoutSettings.settings = {
                    successUrl: config.successUrl,
                };
            }

            console.log('[Paddle] Opening checkout with config:', checkoutSettings);
            window.Paddle.Checkout.open(checkoutSettings);
        } catch (error) {
            console.error('[Paddle] Checkout error:', error);
            onError?.(error);
        }
    }, [onError]);

    return {
        isReady,
        isLoading,
        openCheckout,
    };
}

/**
 * Paddle Checkout Provider Component
 * Wraps the application to provide Paddle.js functionality
 */
export function PaddleProvider({
    children,
    clientToken,
    environment = 'sandbox',
}: {
    children: React.ReactNode;
    clientToken: string;
    environment?: 'sandbox' | 'production';
}) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && !window.Paddle && clientToken) {
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
            script.async = true;

            script.onload = () => {
                try {
                    // Environment is determined by token prefix (test_ vs live_)
                    window.Paddle!.Initialize({
                        token: clientToken,
                    });
                    console.log('[Paddle Provider] Initialized');
                } catch (error) {
                    console.error('[Paddle Provider] Init error:', error);
                }
                setIsLoading(false);
            };

            script.onerror = () => {
                console.error('[Paddle Provider] Failed to load script');
                setIsLoading(false);
            };

            document.body.appendChild(script);
        } else {
            setIsLoading(false);
        }
    }, [clientToken, environment]);

    if (isLoading) {
        return (
            <>
                {children}
            </>
        );
    }

    return <>{children}</>;
}

/**
 * Paddle Checkout Button Component
 * A ready-to-use button that opens Paddle checkout
 */
export function PaddleCheckoutButton({
    priceId,
    userId,
    userEmail,
    userName,
    discountCode,
    className,
    children,
    disabled,
    onSuccess,
    onError,
}: {
    priceId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    discountCode?: string;
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
}) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleClick = async () => {
        if (!window.Paddle) {
            console.error('[Paddle Button] Paddle.js not initialized');
            onError?.(new Error('Payment system not ready'));
            return;
        }

        setIsProcessing(true);

        try {
            const checkoutSettings: any = {
                items: [{ priceId, quantity: 1 }],
                customData: { userId },
            };

            if (userEmail) {
                checkoutSettings.customer = { email: userEmail };
            }

            if (discountCode) {
                checkoutSettings.discountCode = discountCode;
            }

            checkoutSettings.settings = {
                successUrl: `${window.location.origin}/dashboard/profile?checkout=success`,
            };

            window.Paddle.Checkout.open(checkoutSettings);
        } catch (error) {
            console.error('[Paddle Button] Error:', error);
            onError?.(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || isProcessing}
            className={className}
        >
            {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                children
            )}
        </button>
    );
}
