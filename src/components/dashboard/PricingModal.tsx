"use client";

import { Check, Zap, Rocket, Crown, Loader2, Star, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

interface PricingPlan {
    name: string;
    price: string;
    originalPrice?: string | null;
    discountPercent?: number | null;
    description: string;
    features: string[];
    variantId: string;
    popular?: boolean;
    icon: any;
    color: string;
    productName?: string;
    discountCode?: string | null;
}

const planConfigs: Record<string, any> = {
    "free_plan": {
        icon: User,
        color: "zinc",
        features: [
            "1,000 Initial Credits",
            "Standard Voices",
            "Community shared voices",
        ],
    },
    "starter_pack": {
        icon: Zap,
        color: "amber",
        features: [
            "10,000 Credits",
            "No expiration",
            "Standard Voices",
            "Private generations",
        ],
    },
    "turbo_pack": {
        icon: Rocket,
        color: "indigo",
        popular: true,
        features: [
            "50,000 Credits",
            "No expiration",
            "Premium Voices",
            "Commercial rights",
            "Priority generations",
        ],
    },
};

export default function PricingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState<string | null>(null);
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [fetching, setFetching] = useState(true);

    const urlDiscount = searchParams.get('discount');

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
                            color: "indigo",
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
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubscribe = async (variantId: string, apiDiscountCode?: string | null) => {
        if (!user) {
            alert("Please sign in to subscribe");
            return;
        }

        // Priority logic: URL discount code overrides API-detected code
        const discountToUse = urlDiscount || apiDiscountCode;

        setLoading(variantId);
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variantId,
                    userId: user.$id,
                    userEmail: user.email,
                    userName: user.name,
                    discountCode: discountToUse
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to create checkout");
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(null);
        }
    };

    const colorStyles: Record<string, string> = {
        zinc: "bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
        amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
        indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-5xl bg-zinc-50 dark:bg-zinc-950 rounded-[3rem] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="p-8 md:p-12">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">Choose Your Plan</h2>
                        {urlDiscount && plans.some(p => p.discountCode === urlDiscount) && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-500/20">
                                <Zap className="w-3 h-3" />
                                Special Offer Applied: {urlDiscount}
                            </div>
                        )}
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                            Unlock the full potential of SonicFlow. Higher limits, premium voices, and priority synthesis.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8">
                        {fetching ? (
                            <div className="w-full flex justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="w-full text-center py-20">
                                <p className="text-zinc-500">No plans available at the moment.</p>
                            </div>
                        ) : (
                            plans.map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative group p-8 w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] max-w-sm rounded-[2.5rem] bg-white dark:bg-zinc-900 border transition-all duration-500 hover:scale-[1.02] ${plan.popular
                                        ? "border-indigo-500 dark:border-indigo-500/50 shadow-2xl shadow-indigo-500/10"
                                        : "border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-full tracking-wider uppercase">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 mx-auto ${colorStyles[plan.color] || colorStyles.indigo}`}>
                                        <plan.icon className="w-6 h-6" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 text-center">{plan.name}</h3>

                                    <div className="flex flex-col items-center mb-4 text-center">
                                        {plan.discountPercent && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                                    {plan.discountPercent}% OFF
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-zinc-900 dark:text-white">{plan.price}</span>
                                            {plan.variantId !== "free" && <span className="text-zinc-500 text-sm">/ mo</span>}
                                            {plan.originalPrice && (
                                                <span className="text-zinc-500 text-lg font-medium line-through ml-2">
                                                    {plan.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                        {plan.variantId !== "free" && (
                                            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">30-day billing cycle</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed text-center">
                                        {plan.description}
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => plan.variantId !== "free" && handleSubscribe(plan.variantId, plan.discountCode)}
                                        disabled={loading !== null || plan.variantId === "free"}
                                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${plan.variantId === "free"
                                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
                                            : plan.popular
                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                                                : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white"
                                            }`}
                                    >
                                        {loading === plan.variantId ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            plan.variantId === "free" ? "Default Pack" : "Get Started"
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
