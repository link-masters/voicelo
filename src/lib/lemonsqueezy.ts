import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

/**
 * Configure Lemon Squeezy SDK
 */
export const configureLemonSqueezy = () => {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) {
        throw new Error("LEMON_SQUEEZY_API_KEY is not set");
    }

    lemonSqueezySetup({
        apiKey,
        onError: (error) => {
            console.error("Lemon Squeezy API Error:", error);
        },
    });
};
