const { lemonSqueezySetup, listDiscounts } = require("@lemonsqueezy/lemonsqueezy.js");
require('dotenv').config({ path: '.env.local' });

async function testDiscounts() {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    lemonSqueezySetup({ apiKey });

    try {
        const response = await listDiscounts({ filter: { storeId } });
        console.log("Discounts:", JSON.stringify(response.data?.data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testDiscounts();
