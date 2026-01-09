import { Webhook } from "@creem_io/nextjs";
import { getCreditsFromCreemProduct } from "@/lib/creem";
import { createAdminClient } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { paymentConfig } from "@/config/payment";

export const POST = Webhook({
    webhookSecret: paymentConfig.creem.webhookSecret,
    onCheckoutCompleted: async (payload: any) => {
        try {
            // In the version used, the payload itself appears to be the checkout entity
            // but might be wrapped or contain the properties at top level.
            // Based on the error "Property 'checkout' does not exist on type...",
            // it seems we should access properties directly from the argument.
            const checkout = payload;
            const checkoutId = checkout.id;
            const customer = checkout.customer;
            const product = checkout.product;
            const metadata = checkout.metadata;
            const userId = metadata?.userId as string;

            console.log(`[Creem Adapter Webhook] Processing checkout: ${checkoutId} for user: ${userId}`);

            if (!userId) {
                console.warn("⚠️ No userId in metadata. This may be a test webhook or manual purchase.");
                return;
            }

            const { users } = createAdminClient();

            // Calculate credits
            const productName = product?.name || "";
            let totalCredits = getCreditsFromCreemProduct(productName);
            let packageDisplayName = "";

            // Fallback logic by amount if product mapping returns 0
            if (totalCredits === 0) {
                const amount = checkout.amount || 0; // cents
                if (amount >= 1000) { // $10+
                    totalCredits = 50000;
                    packageDisplayName = 'turbo_pack';
                } else if (amount >= 500) { // $5+
                    totalCredits = 10000;
                    packageDisplayName = 'starter_pack';
                }
            }

            if (!packageDisplayName) {
                if (totalCredits === 10000) packageDisplayName = "starter_pack";
                else if (totalCredits === 50000) packageDisplayName = "turbo_pack";
                else if (totalCredits === 200000) packageDisplayName = "elite_pack";
                else packageDisplayName = productName || "unknown_pack";
            }

            console.log(`[Creem Adapter Webhook] Identified package: ${packageDisplayName} (${totalCredits} credits)`);

            // Find User
            let user;
            try {
                user = await users.get(userId);
            } catch (e) {
                console.log(`🔍 User ${userId} not found by ID, searching by email: ${customer?.email}`);
                const email = customer?.email;
                if (email) {
                    const result = await users.list([Query.equal("email", email)]);
                    if (result.users.length > 0) user = result.users[0];
                }
            }

            if (!user) {
                console.error("❌ User not found for checkout:", userId);
                // Return gracefully to prevent webhooks from retrying indefinitely if user doesn't exist
                return;
            }

            // Update User Credits
            const currentTotal = Number(user.prefs?.creditsTotal) || 0;
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const newTransaction = {
                id: checkoutId,
                purchasedAt: new Date().toISOString(),
                creditsAllotted: totalCredits,
                expiresAt: thirtyDaysFromNow.toISOString(),
                packageName: packageDisplayName,
                status: "active",
                provider: "creem"
            };

            const existingTransactions = Array.isArray(user.prefs?.transactions) ? user.prefs.transactions : [];

            // Prevent duplicate
            if (existingTransactions.some((t: any) => t.id === checkoutId)) {
                console.log(`⚠️ Transaction ${checkoutId} already processed. Skipping.`);
                return;
            }

            await users.updatePrefs(user.$id, {
                ...user.prefs,
                plan: "Pro User",
                creditsTotal: currentTotal + totalCredits,
                lastPurchaseId: checkoutId,
                lastPurchaseDate: new Date().toISOString(),
                transactions: [...existingTransactions, newTransaction],
                paymentProvider: "creem"
            });

            console.log(`[Creem Adapter Webhook] ✅ Successfully added ${totalCredits} credits to user ${user.$id}`);
        } catch (error: any) {
            console.error("[Creem Webhook Error]:", error?.message || error);
            // We throw the error here because the Webhook helper might want to catch it to return 500
            // but we've logged it for the developer.
            throw error;
        }
    },
});
