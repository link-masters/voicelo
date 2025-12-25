const { lemonSqueezySetup, createCheckout } = require("@lemonsqueezy/lemonsqueezy.js");
require('dotenv').config({ path: '.env.local' });

async function testVariantDiscount() {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = "1161696"; // Starter Pack
    const code = "AZNDQ2MQ";

    lemonSqueezySetup({ apiKey });

    try {
        console.log(`Testing code ${code} for variant ${variantId}...`);
        const checkout = await createCheckout(storeId, variantId, {
            preview: true,
            checkoutData: {
                discountCode: code,
                billingAddress: { country: 'US' }
            }
        });

        const preview = checkout.data?.data.attributes.preview;
        console.log("Subtotal:", preview.subtotal);
        console.log("Total:", preview.total);
        console.log("Discount Total:", preview.discount_total);
        console.log("Formatted Total:", preview.total_formatted);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testVariantDiscount();
