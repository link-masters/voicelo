"use client";

import { Check, Zap, Rocket, Crown, Loader2, Star, User, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { getPaddleClientConfig, isPaddle } from "@/config/payment";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useTheme } from "@/context/ThemeContext";

const STARTER_CREDITS = Number(process.env.NEXT_PUBLIC_CREDITS_STARTER_PACK) || 100000;
const PLUS_CREDITS = Number(process.env.NEXT_PUBLIC_CREDITS_PLUS_PACK) || 200000;

interface PricingPlan {
    name: string;
    price: string;
    originalPrice?: string | null;
    discountPercent?: number | null;
    description: string;
    features: string[];
    variantId: string;
    priceId?: string; // Paddle uses priceId
    popular?: boolean;
    icon: any;
    color: string;
    productName?: string;
    discountCode?: string | null;
    provider?: 'lemonsqueezy' | 'paddle';
}

const planConfigs: Record<string, any> = {
    "free_plan": {
        icon: User,
        color: "zinc",
        features: [
            "1,000 Credits",
            "Standard Quality Audio",
            "1,000 char input limit",
            "Community Support",
            "Personal Use Only",
        ],
    },
    "starter_pack": {
        icon: Zap,
        color: "amber",
        features: [
            `${STARTER_CREDITS.toLocaleString()} Credits`,
            "Enhanced Quality Audio",
            "10 Instant Voice Clones",
            "Commercial rights",
            "5,000 char input limit",
            "Standard Support",
        ],
        description: "One-time Payment · No Auto Renewal",
    },
    "plus_pack": {
        icon: Rocket,
        color: "primary",
        popular: true,
        features: [
            `${PLUS_CREDITS.toLocaleString()} Credits`,
            "Studio Quality Audio",
            "Unlimited Voice Clones",
            "Commercial rights",
            "15,000 input length",
            "Priority Support",
        ],
        description: "One-time Payment · No Auto Renewal",
    },
};

export default function PricingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState<string | null>(null);
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [fetching, setFetching] = useState(true);
    const [paddle, setPaddle] = useState<Paddle>();

    const urlDiscount = searchParams.get('discount');

    // ... (effects remain same) ...
    // Initialize Paddle.js
    useEffect(() => {
        if (!isPaddle()) return;
        const { clientToken, environment } = getPaddleClientConfig();
        if (!clientToken) {
            console.warn('[PricingModal] Paddle client token not configured');
            return;
        }

        initializePaddle({
            environment: environment as 'sandbox' | 'production',
            token: clientToken,
            eventCallback(event) {
                console.log('[Paddle Event]:', event.name, event);
                switch (event.name) {
                    case 'checkout.completed':
                        setTimeout(() => {
                            router.push('/dashboard/profile?checkout=success');
                        }, 1500);
                        break;
                    case 'checkout.closed':
                        setLoading(null);
                        break;
                    case 'checkout.error':
                        console.error('[Paddle] Checkout error:', event);
                        setLoading(null);
                        break;
                }
            },
        }).then((paddleInstance) => {
            if (paddleInstance) {
                setPaddle(paddleInstance);
                console.log('[PricingModal] Paddle initialized successfully');
            }
        }).catch((error) => {
            console.error('[PricingModal] Paddle init error:', error);
        });
    }, [router]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchPlans = async () => {
            try {
                // Detect user currency from browser
                let userCurrency = "USD";
                try {
                    userCurrency = Intl.NumberFormat().resolvedOptions().currency || "USD";
                } catch (e) {
                    console.error("Failed to detect currency:", e);
                }

                const response = await fetch(`/api/products?currency=${userCurrency}${urlDiscount ? `&discountCode=${urlDiscount}` : ''}`);
                const data = await response.json();

                if (Array.isArray(data)) {
                    const mappedPlans = data.map((plan: any) => {
                        const config = planConfigs[plan.productName?.toLowerCase()] || {
                            icon: Star,
                            color: "primary",
                            features: ["Premium Access", "Cloud Storage", "Priority Support"]
                        };

                        let displayName = plan.name || plan.productName;
                        if (displayName && !displayName.toLowerCase().includes('pack')) {
                            displayName = `${displayName} Pack`;
                        }

                        return {
                            ...plan,
                            ...config,
                            name: displayName,
                        };
                    });

                    // Add Free Pack at the beginning
                    const freePlan: PricingPlan = {
                        name: "Free Pack",
                        price: "$0",
                        description: "",
                        ...planConfigs.free_plan,
                        variantId: "free",
                    };

                    const allPlans = [freePlan, ...mappedPlans];

                    // Sort plans: Free -> Starter -> Plus -> Others
                    allPlans.sort((a, b) => {
                        const nameA = a.productName?.toLowerCase() || a.name.toLowerCase();
                        const nameB = b.productName?.toLowerCase() || b.name.toLowerCase();

                        if (nameA.includes('free')) return -1;
                        if (nameB.includes('free')) return 1;

                        if (nameA.includes('starter')) return -1;
                        if (nameB.includes('starter')) return 1;

                        if (nameA.includes('plus')) return -1;
                        if (nameB.includes('plus')) return 1;

                        return 0;
                    });

                    setPlans(allPlans);
                }
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            } finally {
                setFetching(false);
            }
        };

        fetchPlans();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubscribe = async (plan: PricingPlan) => {
        if (!user) {
            alert("Please sign in to subscribe");
            return;
        }

        const variantId = plan.variantId;
        const priceId = plan.priceId || plan.variantId;
        const discountToUse = urlDiscount || plan.discountCode;

        setLoading(variantId);

        try {
            // Check if this is a Paddle plan
            if (plan.provider === 'paddle' || isPaddle()) {
                // Use Paddle.js for checkout
                if (!paddle) {
                    throw new Error('Payment system is loading. Please try again.');
                }

                const checkoutSettings: any = {
                    items: [{ priceId: priceId, quantity: 1 }],
                };

                // Custom data for webhook (userId tracking)
                if (user.$id) {
                    checkoutSettings.customData = { userId: user.$id };
                }

                // Pre-fill customer email
                if (user.email) {
                    checkoutSettings.customer = { email: user.email };
                }

                // Add discount code if provided
                if (discountToUse) {
                    checkoutSettings.discountCode = discountToUse;
                }

                // UI Customization
                checkoutSettings.settings = {
                    displayMode: 'overlay',
                    theme: theme === 'dark' ? 'dark' : 'light',
                    locale: 'en',
                    showAddDiscounts: true, // Allow users to enter discount codes
                    showAddTaxId: false, // Usually not needed for simple packs
                };

                console.log('[PricingModal] Opening Paddle checkout:', checkoutSettings);
                paddle.Checkout.open(checkoutSettings);
                return;
            }

            // Lemon Squeezy checkout (redirect flow)
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variantId,
                    priceId,
                    userId: user.$id,
                    userEmail: user.email,
                    userName: user.name,
                    discountCode: discountToUse
                }),
            });

            const data = await response.json();

            if (data.provider === 'paddle') {
                // API returned Paddle config, use Paddle.js
                if (!paddle) {
                    throw new Error('Payment system not ready');
                }

                const checkoutSettings: any = {
                    items: [{ priceId: data.priceId, quantity: 1 }],
                };

                if (data.customData) {
                    checkoutSettings.customData = data.customData;
                }

                if (data.customer) {
                    checkoutSettings.customer = data.customer;
                }

                if (data.discountCode) {
                    checkoutSettings.discountCode = data.discountCode;
                }

                paddle.Checkout.open(checkoutSettings);
            } else if (data.url) {
                // Lemon Squeezy redirect
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to create checkout");
            }
        } catch (error: any) {
            console.error('[PricingModal] Checkout error:', error);
            alert(error.message);
            setLoading(null);
        }
    };

    const colorStyles: Record<string, string> = {
        zinc: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        primary: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-secondary text-secondary-foreground border-border",
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-7xl lg:ml-64 bg-zinc-50 dark:bg-zinc-950 rounded-[3rem] border border-border dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors z-10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 md:p-12">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-4">Choose Your Pack</h2>
                        {urlDiscount && plans.some(p => p.discountCode === urlDiscount) && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
                                <Zap className="w-3 h-3" />
                                Special Offer Applied: {urlDiscount}
                            </div>
                        )}
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                            Unlock the full potential of VoiceLo. Higher limits, premium voices, and priority synthesis.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8">
                        {fetching ? (
                            <div className="w-full flex justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="w-full text-center py-20">
                                <p className="text-zinc-500">No plans available at the moment.</p>
                            </div>
                        ) : (
                            plans.map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative group p-8 w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] max-w-md rounded-[2.5rem] bg-white dark:bg-zinc-900/40 backdrop-blur-xl border transition-all duration-500 hover:translate-y-[-8px] ${plan.popular
                                        ? "border-primary/30 dark:border-primary/50 shadow-2xl shadow-primary/10"
                                        : "border-border hover:border-zinc-300 dark:hover:border-border/80"
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full tracking-wider uppercase shadow-xl shadow-primary/40">
                                            Best Value
                                        </div>
                                    )}

                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 mx-auto border ${colorStyles[plan.color] || colorStyles.primary}`}>
                                        <plan.icon className="w-7 h-7" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 text-center">{plan.name}</h3>

                                    <div className="flex flex-col items-center mb-6 text-center">
                                        {plan.discountPercent && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 text-sm font-bold uppercase tracking-wide">
                                                    {plan.discountPercent}% OFF
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-extrabold text-foreground">{plan.price}</span>
                                            <span className="text-xl text-muted-foreground font-medium">/ mo</span>
                                            {plan.originalPrice && (
                                                <span className="text-zinc-500 text-xl font-medium line-through decoration-zinc-600/50 ml-2">
                                                    {plan.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-center mb-8 h-8">
                                        {plan.description ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/80 border border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                {plan.description}
                                            </span>
                                        ) : <div className="h-full" />}
                                    </div>


                                    <div className="space-y-4 mb-10">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                                                </div>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => plan.variantId !== "free" && handleSubscribe(plan)}
                                        disabled={loading !== null || plan.variantId === "free"}
                                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn ${plan.variantId === "free"
                                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-border dark:border-zinc-700"
                                            : plan.popular
                                                ? "bg-primary hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/30"
                                                : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white"
                                            }`}
                                    >
                                        {loading === plan.variantId ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            plan.variantId === "free" ? "Default Pack" : "Buy Credits"
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

}
