import { NextResponse } from "next/server";
import { listVariants, listProducts, getStore, createCheckout, listDiscounts } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { paymentConfig, isLemonSqueezy, isPaddle } from "@/config/payment";

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

// Cache for Paddle products
let cachedPaddleProducts: any[] | null = null;
let lastPaddleProductsFetch = 0;
const PADDLE_PRODUCTS_CACHE_DURATION = 300 * 1000; // 5 minutes

/**
 * Fetch Paddle products with prices from Paddle API
 * Uses environment variables for Paddle API access
 */
async function fetchPaddleProducts(): Promise<any[]> {
    // Return cached data if available
    if (cachedPaddleProducts && (Date.now() - lastPaddleProductsFetch < PADDLE_PRODUCTS_CACHE_DURATION)) {
        console.log("[Paddle Products] Returning cached products");
        return cachedPaddleProducts;
    }

    try {
        const paddleApiKey = process.env.PADDLE_API_KEY;
        const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';

        if (!paddleApiKey) {
            console.error("[Paddle Products] PADDLE_API_KEY not configured - please add it to .env.local");
            return [];
        }

        const baseUrl = paddleEnvironment === 'production'
            ? 'https://api.paddle.com'
            : 'https://sandbox-api.paddle.com';

        console.log(`[Paddle Products] Fetching from ${baseUrl} (env: ${paddleEnvironment})`);

        // Fetch products with prices included
        const productsResponse = await fetch(`${baseUrl}/products?include=prices&status=active`, {
            headers: {
                'Authorization': `Bearer ${paddleApiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!productsResponse.ok) {
            const errorText = await productsResponse.text();
            console.error("[Paddle Products] Failed to fetch products:", productsResponse.status, errorText);
            return [];
        }

        const productsData = await productsResponse.json();
        const products = productsData.data || [];

        console.log(`[Paddle Products] Raw API response: ${products.length} products`);

        // Format products with their prices
        const formattedProducts = products.map((product: any) => {
            console.log(`[Paddle Products] Product: ${product.name}, prices: ${product.prices?.length || 0}`);
            return {
                id: product.id,
                name: product.name,
                description: product.description,
                status: product.status,
                taxCategory: product.tax_category,
                prices: product.prices || [],
            };
        });

        cachedPaddleProducts = formattedProducts;
        lastPaddleProductsFetch = Date.now();

        console.log(`[Paddle Products] Fetched and cached ${formattedProducts.length} products`);
        return formattedProducts;
    } catch (error) {
        console.error("[Paddle Products] Error fetching products:", error);
        return [];
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const targetCurrency = (searchParams.get('currency') || 'USD').toUpperCase();
    const overrideCode = searchParams.get('discountCode');
    const cacheKey = `${paymentConfig.activeProvider}_${targetCurrency}_${overrideCode || 'none'}`;

    try {
        // Cache key should include provider, currency and overrideCode
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
            console.log(`[Pricing API] Fetching fresh data for ${paymentConfig.activeProvider} (${targetCurrency})...`);

            if (isLemonSqueezy()) {
                configureLemonSqueezy();

                const storeId = paymentConfig.lemonsqueezy.storeId;
                if (!storeId) throw new Error("Lemon Squeezy Store ID not configured");

                // Fetch basic data in parallel
                const [storeResponse, productsResponse, variantsResponse, discountsResponse, rates] = await Promise.all([
                    getStore(storeId),
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
                    if (!attr) return null;
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

                    const codesToTry = overrideCode ? [overrideCode, ...activeDiscounts.map((d: any) => d.attributes?.code)] : activeDiscounts.map((d: any) => d.attributes?.code);

                    for (const code of codesToTry) {
                        if (!code) continue;
                        try {
                            const checkoutPreview = await createCheckout(storeId, variant.id, {
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

                    if (!priceDisplay) {
                        try {
                            const basePreview = await createCheckout(storeId, variant.id, {
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
                        discountCode: appliedDiscountCode,
                        recurring: attr.is_subscription || attr.isSubscription || false
                    };
                }));

                const validPlans = formattedPlans.filter(p => p !== null);
                if (validPlans.length > 0) {
                    plansCache[cacheKey] = { timestamp: Date.now(), data: validPlans };
                }
                return validPlans;
            }

            if (isPaddle()) {
                // Fetch Paddle products with prices
                console.log("[Pricing API] Fetching Paddle products...");

                try {
                    // Make internal API call to get Paddle products/prices
                    // We'll use the existing payment config to fetch from Paddle
                    const paddleProducts = await fetchPaddleProducts();
                    const rates = await getExchangeRates();

                    if (!paddleProducts || paddleProducts.length === 0) {
                        console.warn("[Pricing API] No Paddle products found");
                        return [];
                    }

                    // Fetch Paddle discounts to apply
                    let paddleDiscounts: any[] = [];
                    let appliedDiscount: any = null;

                    try {
                        const paddleApiKey = process.env.PADDLE_API_KEY;
                        const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';
                        const baseUrl = paddleEnvironment === 'production'
                            ? 'https://api.paddle.com'
                            : 'https://sandbox-api.paddle.com';

                        const discountsResponse = await fetch(`${baseUrl}/discounts?status=active`, {
                            headers: {
                                'Authorization': `Bearer ${paddleApiKey}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        if (discountsResponse.ok) {
                            const discountsData = await discountsResponse.json();
                            paddleDiscounts = discountsData.data || [];
                            console.log(`[Pricing API] Found ${paddleDiscounts.length} Paddle discounts`);

                            // Check if a specific discount code was requested
                            if (overrideCode) {
                                appliedDiscount = paddleDiscounts.find((d: any) =>
                                    d.code?.toLowerCase() === overrideCode.toLowerCase() && d.enabled_for_checkout
                                );
                                if (appliedDiscount) {
                                    console.log(`[Pricing API] Applying requested discount: ${appliedDiscount.code} (${appliedDiscount.amount}%)`);
                                }
                            }

                            // If no specific code, try to find any enabled discount
                            if (!appliedDiscount) {
                                appliedDiscount = paddleDiscounts.find((d: any) => d.enabled_for_checkout && d.code);
                                if (appliedDiscount) {
                                    console.log(`[Pricing API] Applying default discount: ${appliedDiscount.code} (${appliedDiscount.amount}${appliedDiscount.type === 'percentage' ? '%' : ''})`);
                                }
                            }
                        }
                    } catch (discountError) {
                        console.error("[Pricing API] Error fetching Paddle discounts:", discountError);
                    }

                    const targetProductNames = ['starter', 'turbo'];

                    console.log(`[Pricing API] Filtering ${paddleProducts.length} Paddle products for: ${targetProductNames.join(', ')}`);

                    // Filter and format products
                    const formattedPlans = paddleProducts
                        .filter((product: any) => {
                            const name = product.name?.toLowerCase() || '';
                            const matches = targetProductNames.some(target => name.includes(target));
                            console.log(`[Pricing API] Product "${product.name}" matches: ${matches}`);
                            return matches;
                        })
                        .sort((a: any, b: any) => {
                            const nameA = a.name?.toLowerCase() || '';
                            const nameB = b.name?.toLowerCase() || '';
                            const indexA = targetProductNames.findIndex(t => nameA.includes(t));
                            const indexB = targetProductNames.findIndex(t => nameB.includes(t));
                            return indexA - indexB;
                        })
                        .flatMap((product: any) => {
                            const prices = product.prices || [];
                            if (prices.length === 0) {
                                console.warn(`[Pricing API] No prices found for Paddle product: ${product.name}`);
                                return [];
                            }

                            // Filter to keep only the most relevant price (the one with a name and/or latest)
                            // This ensures we pick the new prices with credit counts if they exist
                            const sortedPrices = [...prices].sort((a: any, b: any) => {
                                // Prioritize prices with names
                                if (a.name && !b.name) return -1;
                                if (!a.name && b.name) return 1;

                                // Then prioritize by creation date (newest first)
                                const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
                                const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
                                return dateB - dateA;
                            });

                            // Only use the top (best) price for each product
                            const bestPrice = sortedPrices[0];
                            if (!bestPrice) return [];

                            // Process the selected best price
                            const processPrice = (price: any) => {
                                // Handle both snake_case (API) and camelCase (processed) property names
                                const unitPrice = price.unitPrice || price.unit_price || {};
                                const baseAmount = parseInt(unitPrice.amount || unitPrice.Amount || '0', 10);
                                const baseCurrency = unitPrice.currencyCode || unitPrice.currency_code || 'USD';

                                console.log(`[Pricing API] Price ${price.id}: amount=${baseAmount}, currency=${baseCurrency}`);

                                // Convert price if needed
                                let displayPrice = baseAmount / 100;
                                let displayCurrency = baseCurrency;

                                if (targetCurrency !== baseCurrency && rates && rates[targetCurrency]) {
                                    // Convert from base currency to target
                                    if (baseCurrency !== 'USD' && rates[baseCurrency]) {
                                        // First convert to USD, then to target
                                        displayPrice = (displayPrice / rates[baseCurrency]) * rates[targetCurrency];
                                    } else {
                                        displayPrice = displayPrice * rates[targetCurrency];
                                    }
                                    displayCurrency = targetCurrency;
                                }

                                // Calculate discounted price if discount applies
                                let finalPrice = displayPrice;
                                let originalPriceDisplay: string | null = null;
                                let discountPercent: number | null = null;
                                let discountCode: string | null = null;

                                if (appliedDiscount) {
                                    // Check if discount applies to this product/price
                                    const restrictTo = appliedDiscount.restrict_to || appliedDiscount.restrictTo;
                                    const appliesToThis = !restrictTo ||
                                        restrictTo.length === 0 ||
                                        restrictTo.includes(price.id) ||
                                        restrictTo.includes(product.id);

                                    if (appliesToThis) {
                                        if (appliedDiscount.type === 'percentage') {
                                            const discountAmount = parseFloat(appliedDiscount.amount);
                                            finalPrice = displayPrice * (1 - discountAmount / 100);
                                            discountPercent = discountAmount;
                                        } else if (appliedDiscount.type === 'flat') {
                                            const flatAmount = parseFloat(appliedDiscount.amount) / 100;
                                            finalPrice = Math.max(0, displayPrice - flatAmount);
                                            discountPercent = Math.round(((displayPrice - finalPrice) / displayPrice) * 100);
                                        }

                                        if (finalPrice < displayPrice) {
                                            originalPriceDisplay = displayPrice.toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: displayCurrency,
                                                minimumFractionDigits: displayPrice < 10 ? 2 : 0,
                                                maximumFractionDigits: 2,
                                            });
                                            discountCode = appliedDiscount.code;
                                            console.log(`[Pricing API] Applied ${discountPercent}% discount: $${displayPrice} -> $${finalPrice}`);
                                        }
                                    }
                                }

                                const priceDisplay = finalPrice.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: displayCurrency,
                                    minimumFractionDigits: finalPrice < 10 ? 2 : 0,
                                    maximumFractionDigits: 2,
                                });

                                // Determine product name for mapping to features
                                const productName = product.name?.toLowerCase().includes('starter')
                                    ? 'starter_pack'
                                    : product.name?.toLowerCase().includes('turbo')
                                        ? 'turbo_pack'
                                        : product.name;

                                return {
                                    id: price.id,
                                    name: product.name || "Plan",
                                    productName: productName,
                                    price: priceDisplay,
                                    originalPrice: originalPriceDisplay,
                                    discountPercent: discountPercent,
                                    description: product.description || price.description || "",
                                    variantId: price.id, // For compatibility with existing code
                                    priceId: price.id, // Paddle uses priceId
                                    discountCode: discountCode,
                                    provider: 'paddle',
                                    recurring: !!(price.billingCycle || price.billing_cycle)
                                };
                            };

                            return [processPrice(bestPrice)];

                        });

                    if (formattedPlans.length > 0) {
                        plansCache[cacheKey] = { timestamp: Date.now(), data: formattedPlans };
                    }
                    return formattedPlans;
                } catch (paddleError) {
                    console.error("[Pricing API] Error fetching Paddle products:", paddleError);
                    return [];
                }
            }

            return [];
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
