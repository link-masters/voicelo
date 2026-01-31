"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Check, Zap, Rocket, Loader2, ArrowRight, User, Minus, ChevronDown, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPaddleClientConfig, isPaddle } from "@/config/payment";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useTheme } from "@/context/ThemeContext";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import DiscountCountdown from "@/components/pricing/DiscountCountdown";

interface PricingPlan {
    name: string;
    price: string;
    originalPrice?: string | null;
    discountPercent?: number | null;
    description: string;
    features: string[];
    variantId: string;
    priceId?: string;
    popular?: boolean;
    icon: any;
    color: string;
    productName?: string;
    discountCode?: string | null;
    provider?: 'lemonsqueezy' | 'paddle';
    recurring?: boolean;
}

const STARTER_CREDITS = Number(process.env.NEXT_PUBLIC_CREDITS_STARTER_PACK) || 50000;
const PLUS_CREDITS = Number(process.env.NEXT_PUBLIC_CREDITS_PLUS_PACK) || 100000;
const STARTER_CLONE_LIMIT = Number(process.env.NEXT_PUBLIC_VOICE_CLONE_LIMIT_STARTER) || 20;
const PLUS_CLONE_LIMIT = Number(process.env.NEXT_PUBLIC_VOICE_CLONE_LIMIT_PLUS) || 50;
const PRO_CHAR_LIMIT = Number(process.env.NEXT_PUBLIC_PRO_USER_CHAR_LIMIT) || 5000;

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
            "Instant Voice Clones",
            `${STARTER_CLONE_LIMIT} Voice Cloning Slots`,
            "Commercial rights",
            `${PRO_CHAR_LIMIT.toLocaleString()} char input limit`,
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
            "Instant Voice Clones",
            `${PLUS_CLONE_LIMIT} Voice Cloning Slots`,
            "Commercial rights",
            `${PRO_CHAR_LIMIT.toLocaleString()} char input limit`,
            "Priority Support",
        ],
        description: "One-time Payment · No Auto Renewal",
    },
};

function PricingContent() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState<string | null>(null);
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [fetching, setFetching] = useState(true);
    const [paddle, setPaddle] = useState<Paddle>();
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeDiscount, setActiveDiscount] = useState<{ expiry_date: string; code: string; percentage?: number; name?: string } | null>(null);

    const faqs = [
        {
            q: "How are credits calculated?",
            a: "1 credit equals approximately 1 word of generated speech. Our system calculates based on character count to ensure maximum transparency and value for every generation."
        },
        {
            q: "Do my credits expire?",
            a: "Yes, credits expire since each package is valid for one month, but credits can be purchased again at any time."
        },
        {
            q: "Do you offer refunds?",
            a: "We offer refunds for unused credits if requested within 7 days of purchase. However, once credits are partially used for speech generation, the transaction becomes non-refundable."
        },

        {
            q: "Is the checkout process secure?",
            a: (
                <>
                    Absolutely. All transactions are handled by{" "}
                    <a
                        href="https://creem.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Creem
                    </a>
                    , our Merchant of Record, to ensure your transaction is encrypted and your data remains private.
                </>
            ),
        },
    ];

    const comparisonFeatures = [
        { name: "Number of credits", free: "1,000", starter: STARTER_CREDITS.toLocaleString(), plus: PLUS_CREDITS.toLocaleString() },
        { name: "Audio quality", free: "Standard", starter: "Enhanced", plus: "Studio" },
        { name: "Instant voice clones", free: false, starter: true, plus: true },
        { name: "Voice cloning slots", free: false, starter: `${STARTER_CLONE_LIMIT} Slots`, plus: `${PLUS_CLONE_LIMIT} Slots` },
        { name: "Text input length", free: "1,000 chars", starter: `${PRO_CHAR_LIMIT.toLocaleString()} chars`, plus: `${PRO_CHAR_LIMIT.toLocaleString()} chars` },
        { name: "Support included", free: true, starter: true, plus: true },
        { name: "Commercial use", free: false, starter: true, plus: true },
    ];

    const urlDiscount = searchParams.get('discount');

    // Initialize Paddle.js using official package if Paddle is the active provider
    useEffect(() => {
        if (!isPaddle()) return;

        const { clientToken, environment } = getPaddleClientConfig();
        if (!clientToken) {
            console.warn('[PricingPage] Paddle client token not configured');
            return;
        }

        // initializePaddle handles singleton initialization - safe to call multiple times
        initializePaddle({
            environment: environment as 'sandbox' | 'production',
            token: clientToken,
            eventCallback(event) {
                console.log('[Paddle Event]:', event.name, event);
                switch (event.name) {
                    case 'checkout.completed':
                        // Close the checkout modal first, then redirect after a short delay
                        // This prevents the success message from sticking on screen
                        setTimeout(() => {
                            router.push('/dashboard/profile?checkout=success');
                        }, 1500); // Wait 1.5 seconds to show success briefly
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
                console.log('[PricingPage] Paddle initialized successfully');
            }
        }).catch((error) => {
            console.error('[PricingPage] Paddle init error:', error);
        });
    }, [router]);

    useEffect(() => {
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

                if (!response.ok) {
                    console.error(`[PricingPage] Products API error: ${response.status}`);
                    return;
                }

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

                    // Add Free Pack
                    const freePlan: PricingPlan = {
                        name: "Free Pack",
                        price: "$0",
                        description: "",
                        ...planConfigs.free_plan,
                        variantId: "free",
                        recurring: false,
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
    }, [urlDiscount]);

    useEffect(() => {
        const fetchDiscountDetails = async () => {
            try {
                const code = urlDiscount || undefined;
                const response = await fetch(`/api/discount${code ? `?code=${code}` : ''}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.expiry_date && data.status === 'active') {
                        setActiveDiscount({
                            expiry_date: data.expiry_date,
                            code: data.code,
                            percentage: data.percentage,
                            name: data.name
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch discount details:", error);
            }
        };

        fetchDiscountDetails();
    }, [urlDiscount]);

    const handleSubscribe = async (plan: PricingPlan) => {
        if (!user) {
            setIsSignUpOpen(true);
            return;
        }

        const variantId = plan.variantId;
        const priceId = plan.priceId || plan.variantId;
        const discountToUse = urlDiscount || plan.discountCode;

        setLoading(variantId);

        try {
            // Check if this is a Paddle plan
            if (plan.provider === 'paddle' || isPaddle()) {
                if (!paddle) {
                    throw new Error('Payment system is loading. Please try again.');
                }

                // Build checkout settings following Paddle.js v2 API
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

                console.log('[PricingPage] Checkout priceId:', priceId);
                console.log('[PricingPage] Opening Paddle checkout:', JSON.stringify(checkoutSettings, null, 2));

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
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to create checkout");
            }
        } catch (error: any) {
            console.error('[PricingPage] Checkout error:', error);
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
        <div className="min-h-screen text-foreground selection:bg-primary/30 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white dark:bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-50 dark:bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <Header />

            <main className="relative z-10 pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header Section */}
                    <div className="text-center mb-20 space-y-4 animate-fade-in-up">

                        {urlDiscount && plans.some(p => p.discountCode === urlDiscount) && !activeDiscount && (
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold animate-pulse">
                                    <Zap className="w-4 h-4 fill-current" />
                                    Special Influencer Offer: {urlDiscount} Applied
                                </div>
                            </div>
                        )}
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
                            Simple, Transparent <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-primary">Monthly Credit Packages</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Choose the perfect credit package for your creative needs.
                        </p>

                        {activeDiscount && (
                            <div className="hidden md:block">
                                <DiscountCountdown
                                    expiryDate={activeDiscount.expiry_date}
                                    discountCode={activeDiscount.code}
                                    percentage={activeDiscount.percentage}
                                    discountName={activeDiscount.name}
                                />
                            </div>
                        )}
                    </div>

                    {/* Pricing Grid */}
                    <div className="flex flex-wrap justify-center gap-8 mb-20">
                        {fetching ? (
                            <div className="w-full flex justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="w-full text-center py-20">
                                <p className="text-muted-foreground">No plans available at the moment.</p>
                            </div>
                        ) : (
                            plans.map((plan, index) => (
                                <div
                                    key={plan.name}
                                    className={`group relative p-8 w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] max-w-sm rounded-[2.5rem] bg-card/50 dark:bg-zinc-900/40 backdrop-blur-xl border transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up ${plan.popular
                                        ? "border-primary/30 dark:border-primary/50 shadow-2xl shadow-primary/10 hover:shadow-primary/20"
                                        : "border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5"
                                        }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Clipping container for effects */}
                                    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                                        {/* Hover Shine Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                                        {/* Content Background Glow */}
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>

                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full tracking-wider uppercase shadow-xl shadow-primary/40 z-20">
                                            Best Value
                                        </div>
                                    )}

                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 mx-auto border ${colorStyles[plan.color] || colorStyles.primary}`}>
                                        <plan.icon className="w-7 h-7" />
                                    </div>

                                    <h3 className="text-2xl font-bold mb-2 text-center">{plan.name}</h3>

                                    <div className="flex flex-col items-center mb-6 text-center">
                                        {plan.discountPercent && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 text-sm font-bold uppercase tracking-wide">
                                                    {plan.discountPercent}% Off
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
                                            <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full bg-secondary/80 border border-border text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                                {plan.description}
                                            </span>
                                        ) : <div className="h-full" />}
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                </div>
                                                <span className="text-muted-foreground text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => plan.variantId === "free" ? (!user && setIsSignUpOpen(true)) : handleSubscribe(plan)}
                                        disabled={loading !== null || (!!user && plan.variantId === "free")}
                                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn ${plan.variantId === "free" && user
                                            ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed"
                                            : plan.popular
                                                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/30"
                                                : "bg-secondary/50 hover:bg-secondary text-foreground border border-border"
                                            }`}
                                    >
                                        {loading === plan.variantId ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {plan.variantId === "free" ? (user ? "Current Active" : "Get Started") : "Buy Credits"}
                                                {(plan.variantId !== "free" || !user) && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Detailed Comparison Table */}
                    <div className="mt-32 mb-32 animate-fade-in-up delay-200">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Compare Features</h2>
                            <p className="text-muted-foreground text-lg">Detailed breakdown of what's included.</p>
                        </div>

                        <div className="overflow-hidden rounded-[2.5rem] bg-card/30 dark:bg-zinc-900/20 border border-border/50 backdrop-blur-xl relative shadow-2xl shadow-black/5">
                            {/* Gloss Effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-border/50 bg-secondary/20">
                                            <th className="py-8 px-8 text-left text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest w-1/3">Features</th>
                                            <th className="py-8 px-6 text-center w-1/5">
                                                <div className="font-extrabold text-lg md:text-xl mb-1">Free</div>
                                                <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Pack</div>
                                            </th>
                                            <th className="py-8 px-6 text-center w-1/5">
                                                <div className="font-extrabold text-lg md:text-xl text-amber-500 mb-1">Starter</div>
                                                <div className="text-[10px] md:text-xs font-bold text-amber-500/80 uppercase tracking-wider">Pack</div>
                                            </th>
                                            <th className="py-8 px-6 text-center w-1/5">
                                                <div className="font-extrabold text-lg md:text-xl text-primary mb-1">Plus</div>
                                                <div className="text-[10px] md:text-xs font-bold text-primary/80 uppercase tracking-wider">Pack</div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {comparisonFeatures.map((feature, i) => (
                                            <tr key={i} className="group hover:bg-primary/5 transition-colors duration-300">
                                                <td className="py-6 px-8 font-semibold text-foreground/80 group-hover:text-foreground transition-colors text-sm md:text-base">
                                                    {feature.name}
                                                </td>
                                                <td className="py-6 px-6 text-center">
                                                    {typeof feature.free === 'string' ? (
                                                        <span className="font-bold text-foreground text-sm">{feature.free}</span>
                                                    ) : feature.free ? (
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                        </div>
                                                    ) : (
                                                        <Minus className="w-5 h-5 text-muted-foreground/20 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-6 px-6 text-center">
                                                    {typeof feature.starter === 'string' ? (
                                                        <span className="font-bold text-foreground text-sm">{feature.starter}</span>
                                                    ) : feature.starter ? (
                                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                                                            <Check className="w-4 h-4 text-amber-500" />
                                                        </div>
                                                    ) : (
                                                        <Minus className="w-5 h-5 text-muted-foreground/20 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-6 px-6 text-center">
                                                    {typeof feature.plus === 'string' ? (
                                                        <span className="font-bold text-foreground text-sm">{feature.plus}</span>
                                                    ) : feature.plus ? (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                                            <Check className="w-4 h-4 text-primary" />
                                                        </div>
                                                    ) : (
                                                        <Minus className="w-5 h-5 text-muted-foreground/20 mx-auto" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-4xl mx-auto mb-32 animate-fade-in-up delay-300">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-4xl font-extrabold">Have Questions? <br /><span className="text-muted-foreground">We've Got Answers.</span></h2>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <div
                                    key={i}
                                    className="rounded-[2rem] bg-card/50 dark:bg-zinc-900/40 border border-border overflow-hidden transition-all duration-300"
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full p-6 text-left flex items-center justify-between group"
                                    >
                                        <span className="font-bold text-lg group-hover:text-primary transition-colors">{faq.q}</span>
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                                    </button>
                                    <div
                                        className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Final CTA */}
                    <div className="max-w-4xl mx-auto p-12 rounded-[3.5rem] bg-gradient-to-br from-primary/10 via-blue-600/5 to-primary/10 border border-primary/20 text-center space-y-8 animate-fade-in-up">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-primary outline outline-8 outline-primary/5">
                            <Rocket className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">Ready to amplify your content?</h2>
                            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                                Choose a suitable credits pack and start generating studio-quality voiceovers instantly.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {!user && (
                                <button
                                    onClick={() => setIsSignUpOpen(true)}
                                    className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 min-w-[200px]"
                                >
                                    Get Started Free
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <SignInModal
                isOpen={isSignInOpen}
                onClose={() => setIsSignInOpen(false)}
                onSwitchToSignUp={() => {
                    setIsSignInOpen(false);
                    setIsSignUpOpen(true);
                }}
            />

            <SignUpModal
                isOpen={isSignUpOpen}
                onClose={() => setIsSignUpOpen(false)}
                onSwitchToSignIn={() => {
                    setIsSignUpOpen(false);
                    setIsSignInOpen(true);
                }}
            />
        </div>
    );
}

export default function PricingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        }>
            <PricingContent />
        </Suspense>
    );
}
