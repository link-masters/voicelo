const { lemonSqueezySetup, createCheckout } = require("@lemonsqueezy/lemonsqueezy.js");
require('dotenv').config({ path: '.env.local' });

async function testPreview() {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = "1161696"; // Starter Pack in user's store

    lemonSqueezySetup({ apiKey });

    const countries = ['PK', 'US', 'GB', 'IN'];

    for (const country of countries) {
        try {
            console.log(`\nTesting Country: ${country}`);
            const checkout = await createCheckout(storeId, variantId, {
                preview: true,
                checkoutData: {
                    billingAddress: {
                        country: country
                    }
                }
            });

            const preview = checkout.data?.data.attributes.preview;
            console.log("Currency:", preview.currency);
            console.log("Total Formatted:", preview.total_formatted);
            // console.log("Full Preview:", JSON.stringify(preview, null, 2));
        } catch (e) {
            console.error(`Error for ${country}:`, e.message);
        }
    }
}

testPreview();
