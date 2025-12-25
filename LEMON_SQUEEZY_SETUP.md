# Lemon Squeezy Integration Setup (One-Time Payments)

This application has been converted to use **one-time credit top-ups** instead of subscriptions.

## 1. Lemon Squeezy Setup
1. Create a [Lemon Squeezy](https://app.lemonsqueezy.com/) account.
2. Go to **Settings > API** and create a new **API Key**.
3. Go to **Store Settings** and find your **Store ID**.
4. Create **Products** (not Subscriptions) for your credit packs.
5. Create a **Variant** for each pack and copy the **Variant IDs**.
6. Go to **Settings > Webhooks** and add a new webhook:
   - **URL**: `https://your-domain.com/api/webhooks/lemonsqueezy`
   - **Secret**: Create a random string.
   - **Events**: Select `order_created` only.

## 2. Environment Variables
Update your `.env.local` with the following values:

```env
# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id_here
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Appwrite Server (Needed for webhooks)
APPWRITE_API_KEY=your_appwrite_api_key_here
```

## 3. Update Credit Packs
Open `src/components/dashboard/PricingModal.tsx` and replace the placeholder `variantId`s with your actual Lemon Squeezy Product Variant IDs.

## 4. How it works
- **Checkout**: When a user selects a pack, it generates a checkout for a one-time purchase.
- **Webhook**: Upon completion, Lemon Squeezy sends an `order_created` event.
- **Sync**: The logic in `src/app/api/webhooks/lemonsqueezy/route.ts` identifies the credit pack by name (e.g., "Starter", "Pro", "Elite") and **increments** the user's `creditsTotal` in Appwrite.
- **Persistence**: Unlike subscriptions, these credits never expire and are added to the user's existing balance.
