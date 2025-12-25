const { lemonSqueezySetup, listVariants, listProducts } = require("@lemonsqueezy/lemonsqueezy.js");
require('dotenv').config({ path: '.env.local' });

async function test() {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    console.log("API Key:", apiKey ? "Set" : "Not set");
    console.log("Store ID:", storeId);

    lemonSqueezySetup({
        apiKey,
    });

    try {
        const productsResponse = await listProducts({
            filter: { storeId },
        });
        console.log("Products:", JSON.stringify(productsResponse.data?.data.map(p => ({ id: p.id, name: p.attributes.name })), null, 2));

        const variantsResponse = await listVariants({
            filter: { storeId },
        });
        console.log("Variants:", JSON.stringify(variantsResponse.data?.data.map(v => ({
            id: v.id,
            name: v.attributes.name,
            price: v.attributes.price,
            status: v.attributes.status,
            productId: v.attributes.product_id
        })), null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
