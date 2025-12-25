import { NextResponse } from "next/server";
import { listVariants, listProducts, getStore, createCheckout, listDiscounts } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

// Cache for exchange rates
let cachedRates: any = null;
let lastRatesFetch = 0;
const RATES_CACHE_DURATION = 3600 * 1000; // 1 hour

// Global cache for pricing plans
interface CachedPlans {
    timestamp: number;
    data: any[];
}
const plansCache: Record<string, CachedPlans> = {};
const PLANS_CACHE_DURATION = 600 * 1000; // 10 minutes

// Prevent "Cache Stampede" by tracking pending requests
const pendingRequests: Record<string, Promise<any> | null> = {};

async function getExchangeRates() {
    if (cachedRates && (Date.now() - lastRatesFetch < RATES_CACHE_DURATION)) {
        return cachedRates;
    }
    try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await response.json();
        if (data && data.rates) {
            cachedRates = data.rates;
            lastRatesFetch = Date.now();
            return cachedRates;
        }
    } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
    }
    return null;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const targetCurrency = (searchParams.get('currency') || 'USD').toUpperCase();
    const overrideCode = searchParams.get('discountCode');
    const cacheKey = `${targetCurrency}_${overrideCode || 'none'}`;

    try {
        // Cache key should include overrideCode to avoid serving wrong prices
        const cached = plansCache[cacheKey];
        if (cached && (Date.now() - cached.timestamp < PLANS_CACHE_DURATION)) {
            return NextResponse.json(cached.data);
        }

        // If a request for this key is already in progress, wait for it
        if (pendingRequests[cacheKey]) {
            console.log(`[Pricing API] Waiting for existing fetch for ${cacheKey}...`);
            const data = await pendingRequests[cacheKey];
            return NextResponse.json(data);
        }

        // Fetch logic
        const fetchPromise = (async () => {
            console.log(`[Pricing API] Fetching fresh data for ${targetCurrency}...`);
            configureLemonSqueezy();

            const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
            if (!storeId) throw new Error("Store ID not configured");

            // Fetch basic data in parallel
            const [storeResponse, productsResponse, variantsResponse, discountsResponse, rates] = await Promise.all([
                getStore(storeId!),
                listProducts(),
                listVariants(),
                listDiscounts(),
                getExchangeRates()
            ]);

            // Robust error checking for Lemon Squeezy responses
            if (storeResponse.error) console.warn("Lemon Squeezy Store Fetch Warning:", storeResponse.error.message);
            if (productsResponse.error) console.warn("Lemon Squeezy Products Fetch Warning:", productsResponse.error.message);
            if (variantsResponse.error) console.warn("Lemon Squeezy Variants Fetch Warning:", variantsResponse.error.message);

            const storeCurrency = storeResponse.data?.data?.attributes?.currency || "USD";
            const products = productsResponse.data?.data || [];
            const allVariants = variantsResponse.data?.data || [];
            // Even if discounts fails, we can still show prices
            const allDiscounts = discountsResponse.data?.data || [];

            const targetProducts = ['starter_pack', 'turbo_pack'];

            const activeDiscounts = allDiscounts.filter((d: any) => {
                const attr = d?.attributes;
                if (!attr) return false;
                const sId = (attr.store_id || attr.storeId)?.toString();
                return sId === storeId && attr.status === 'published' && (!attr.expires_at || new Date(attr.expires_at) > new Date());
            });

            const relevantVariants = allVariants.filter((v: any) => {
                const attr = v?.attributes;
                if (!attr) return false;
                const productId = attr.product_id || attr.productId;
                const product = products.find(p => p.id === productId?.toString());
                return product && targetProducts.includes(product.attributes?.name?.toLowerCase());
            });

            relevantVariants.sort((a: any, b: any) => {
                const aProductId = (a.attributes?.product_id || a.attributes?.productId)?.toString();
                const bProductId = (b.attributes?.product_id || b.attributes?.productId)?.toString();
                const productA = products.find(p => p.id === aProductId);
                const productB = products.find(p => p.id === bProductId);
                const nameA = productA?.attributes?.name?.toLowerCase() || "";
                const nameB = productB?.attributes?.name?.toLowerCase() || "";
                return targetProducts.indexOf(nameA) - targetProducts.indexOf(nameB);
            });

            const formattedPlans = await Promise.all(relevantVariants.map(async (variant: any) => {
                const attr = variant?.attributes;
                if (!attr) {
                    console.error("[Pricing API Error] Found variant without attributes:", variant?.id);
                    return null;
                }
                const productId = attr.product_id || attr.productId;
                const product = products.find(p => p.id === productId?.toString());

                let priceDisplay = "";
                let originalPriceDisplay = null;
                let discountPercent = null;
                let appliedDiscountCode = null;

                const isStoreCurrency = targetCurrency === storeCurrency.toUpperCase();

                const formatPrice = (amountUsd: number, formattedStr: string) => {
                    if (isStoreCurrency) return formattedStr;
                    if (targetCurrency === 'USD') return amountUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                    if (rates && rates[targetCurrency]) {
                        const converted = amountUsd * rates[targetCurrency];
                        return converted.toLocaleString('en-US', {
                            style: 'currency',
                            currency: targetCurrency,
                            minimumFractionDigits: converted < 10 ? 2 : 0,
                            maximumFractionDigits: 2
                        });
                    }
                    return formattedStr;
                };

                // Try override code first if provided
                const codesToTry = overrideCode ? [overrideCode, ...activeDiscounts.map((d: any) => d.attributes?.code)] : activeDiscounts.map((d: any) => d.attributes?.code);

                for (const code of codesToTry) {
                    if (!code) continue;
                    try {
                        const checkoutPreview = await createCheckout(storeId!, variant.id, {
                            preview: true,
                            checkoutData: {
                                billingAddress: { country: 'US' },
                                discountCode: code
                            }
                        });

                        const previewData = checkoutPreview.data?.data?.attributes?.preview;
                        if (previewData) {
                            const subtotalUsd = previewData.subtotal_usd / 100;
                            const totalUsd = previewData.total_usd / 100;

                            if (totalUsd < subtotalUsd) {
                                priceDisplay = formatPrice(totalUsd, previewData.total_formatted);
                                originalPriceDisplay = formatPrice(subtotalUsd, previewData.subtotal_formatted);
                                discountPercent = Math.round(((subtotalUsd - totalUsd) / subtotalUsd) * 100);
                                appliedDiscountCode = code;
                                break;
                            }
                        }
                    } catch (err) { }
                }

                // Fallback for normal price
                if (!priceDisplay) {
                    try {
                        const basePreview = await createCheckout(storeId!, variant.id, {
                            preview: true,
                            checkoutData: { billingAddress: { country: 'US' } }
                        });
                        const baseData = basePreview.data?.data?.attributes?.preview;
                        if (baseData) {
                            priceDisplay = formatPrice(baseData.total_usd / 100, baseData.total_formatted);
                        }
                    } catch (err) { }
                }

                if (!priceDisplay) {
                    priceDisplay = ((attr.price || 0) / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: attr.currency || storeCurrency,
                    });
                }

                const name = attr.name === "Default" || attr.name === "starter_pack" || attr.name === "turbo_pack"
                    ? product?.attributes?.name
                    : attr.name;

                return {
                    id: variant.id,
                    name: name === "starter_pack" ? "Starter Pack" : name === "turbo_pack" ? "Turbo Pack" : (name || "Plan"),
                    productName: product?.attributes?.name,
                    price: priceDisplay,
                    originalPrice: originalPriceDisplay,
                    discountPercent: discountPercent,
                    description: product?.attributes?.description || "",
                    variantId: variant.id,
                    discountCode: appliedDiscountCode
                };
            }));

            // Filter out any potential nulls from failed attribute checks
            const validPlans = formattedPlans.filter(p => p !== null);

            // Store in cache only if we actually got plans
            if (validPlans.length > 0) {
                plansCache[cacheKey] = {
                    timestamp: Date.now(),
                    data: validPlans
                };
            }

            return validPlans;
        })();

        pendingRequests[cacheKey] = fetchPromise;
        const result = await fetchPromise;
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[Pricing API Error]:", error);
        return NextResponse.json({ error: "Failed to fetch pricing. Please try again later." }, { status: 500 });
    } finally {
        pendingRequests[cacheKey] = null;
    }
}
