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

const planConfigs: Record<string, any> = {
    "free_plan": {
        icon: User,
        color: "zinc",
        features: [
            "1,000 Initial Credits",
            "Standard Neural Voices",
            "Community shared voices",
            "Basic support",
        ],
    },
    "starter_pack": {
        icon: Zap,
        color: "amber",
        features: [
            "10,000 Credits",
            "No expiration on credits",
            "Standard Neural Voices",
            "Private generations",
            "Basic support",
        ],
    },
    "turbo_pack": {
        icon: Rocket,
        color: "primary",
        popular: true,
        features: [
            "50,000 Credits",
            "No expiration on credits",
            "All Premium Voices",
            "Full Commercial rights",
            "Priority generation queue",
            "Advanced settings access",
        ],
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

    const faqs = [
        {
            q: "How are credits calculated?",
            a: "1 credit equals approximately 1 word of generated speech. Our system calculates based on character count to ensure maximum transparency and value for every generation."
        },
        {
            q: "Do my credits expire?",
            a: "Credits in the Free Pack expire after 30 days. However, all paid packs (Starter & Turbo) come with No Expiration—your credits stay in your account until you use them."
        },
        {
            q: "Do you offer refunds?",
            a: "We offer refunds for unused credits if requested within 14 days of purchase. However, once credits are partially used for speech generation, the transaction becomes non-refundable."
        },
        {
            q: "Can I monetize my content?",
            a: "Yes! The Turbo Pack includes full commercial rights. This allows you to use your generated audio in monetized YouTube videos, podcasts, radio ads, and corporate projects."
        },
        {
            q: "Is the checkout process secure?",
            a: "Absolutely. We partner with Paddle and Lemon Squeezy, world leaders in SaaS payments, to ensure your transaction is encrypted and your data remains private."
        }
    ];

    const comparisonFeatures = [
        { name: "Monthly Credits", free: "1,000", starter: "10,000", turbo: "50,000" },
        { name: "Neural Voices", free: "Standard", starter: "Standard", turbo: "All Premium" },
        { name: "Credit Expiration", free: "30 Days", starter: "Never", turbo: "Never" },
        { name: "Private generations", free: false, starter: true, turbo: true },
        { name: "Commercial Rights", free: false, starter: false, turbo: true },
        { name: "Priority Queue", free: false, starter: false, turbo: true },
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

                        return {
                            ...plan,
                            ...config,
                        };
                    });

                    // Add Free Pack at the beginning
                    const freePlan: PricingPlan = {
                        name: "Free Pack",
                        price: "$0",
                        description: "",
                        ...planConfigs.free_plan,
                        variantId: "free",
                        recurring: false,
                    };

                    setPlans([freePlan, ...mappedPlans]);
                }
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            } finally {
                setFetching(false);
            }
        };

        fetchPlans();
    }, []);

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
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] dark:opacity-20" />
            </div>

            <Header />

            <main className="relative z-10 pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header Section */}
                    <div className="text-center mb-20 space-y-4 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-primary text-xs font-bold tracking-wider uppercase">
                            <Star className="w-3 h-3 fill-current" />
                            Pricing Plans
                        </div>
                        {urlDiscount && plans.some(p => p.discountCode === urlDiscount) && (
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold animate-pulse">
                                    <Zap className="w-4 h-4 fill-current" />
                                    Special Influencer Offer: {urlDiscount} Applied
                                </div>
                            </div>
                        )}
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
                            Simple, Transparent <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-primary">Credit Packages</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Choose the perfect credit package for your monthly creative needs. Professional tools with transparent, predictable pricing.
                        </p>
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
                                    className={`group relative p-8 w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] max-w-sm rounded-[2.5rem] bg-card/50 dark:bg-zinc-900/40 backdrop-blur-xl border transition-all duration-500 hover:translate-y-[-8px] animate-fade-in-up ${plan.popular
                                        ? "border-primary/30 dark:border-primary/50 shadow-2xl shadow-primary/10"
                                        : "border-border hover:border-border/80"
                                        }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full tracking-wider uppercase shadow-xl shadow-primary/40">
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
                                            {plan.originalPrice && (
                                                <span className="text-zinc-500 text-xl font-medium line-through decoration-zinc-600/50 ml-2">
                                                    {plan.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                        {plan.variantId !== "free" && (
                                            <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full bg-secondary/50 border border-border">One-time Payment. No Auto Renewal</span>
                                        )}
                                    </div>

                                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed text-center">
                                        {plan.description}
                                    </p>

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
                                                {plan.variantId === "free" ? (user ? "Current Plan" : "Get Started") : "Get Started"}
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
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Complete Feature Comparison</h2>
                            <p className="text-muted-foreground">Compare our packages and find the perfect fit for your workflow.</p>
                        </div>

                        <div className="overflow-x-auto pb-4">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-6 px-4 text-left font-semibold text-muted-foreground uppercase tracking-widest text-xs">Features</th>
                                        <th className="py-6 px-4 text-center font-bold text-lg">Free</th>
                                        <th className="py-6 px-4 text-center font-bold text-lg text-amber-500">Starter</th>
                                        <th className="py-6 px-4 text-center font-bold text-lg text-primary">Turbo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonFeatures.map((feature, i) => (
                                        <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                            <td className="py-5 px-4 font-medium text-foreground">{feature.name}</td>
                                            <td className="py-5 px-4 text-center">
                                                {typeof feature.free === 'string' ? (
                                                    <span className="text-sm font-semibold">{feature.free}</span>
                                                ) : feature.free ? (
                                                    <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                                                ) : (
                                                    <Minus className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                {typeof feature.starter === 'string' ? (
                                                    <span className="text-sm font-semibold">{feature.starter}</span>
                                                ) : feature.starter ? (
                                                    <Check className="w-5 h-5 text-amber-500 mx-auto" />
                                                ) : (
                                                    <Minus className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                {typeof feature.turbo === 'string' ? (
                                                    <span className="text-sm font-semibold">{feature.turbo}</span>
                                                ) : feature.turbo ? (
                                                    <Check className="w-5 h-5 text-primary mx-auto" />
                                                ) : (
                                                    <Minus className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                Choose a pack and start generating studio-quality voiceovers in less than 60 seconds.
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
        </div >
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
