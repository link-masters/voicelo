# Creem Payment Gateway Setup

This document guides you through setting up Creem as your payment provider for VoiceLo.

## Prerequisites

1. A Creem account
2. Products created in Creem Dashboard

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# =====================================
# CREEM CONFIGURATION
# =====================================

# Active payment provider: 'lemonsqueezy', 'paddle', or 'creem'
NEXT_PUBLIC_PAYMENT_PROVIDER=creem

# Creem API Key (from Dashboard -> Developers -> Keys)
CREEM_API_KEY=creem_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Creem Webhook Secret (from Dashboard -> Developers -> Webhooks)
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Environment (defaults to 'production')
# Set to 'test' to separate test data or use test endpoints
NEXT_PUBLIC_CREEM_ENVIRONMENT=production
```

## Creem Dashboard Setup

### 1. Create Products

In Creem Dashboard > Products:

1. **Starter Pack**
   - Name: `Starter Pack`
   - Price: $9.00 USD (one-time)
   - Note the Product ID

2. **Turbo Pack**
   - Name: `Turbo Pack`
   - Price: $29.00 USD (one-time)
   - Note the Product ID

The application detects products by name (matching "Starter" or "Turbo").

### 2. Configure Webhook

1. Go to **Developers > Webhooks**
2. Click **Create Endpoint**
3. Configure:
   - URL: `https://yourdomain.com/api/webhooks/creem`
   - Events: `checkout.completed` (and any subscription events if applicable)
4. Copy the **Signing Secret** and add it to `CREEM_WEBHOOK_SECRET`

## Testing

1. Set `NEXT_PUBLIC_PAYMENT_PROVIDER=creem`
2. Ensure API Key is set.
3. Visit the Pricing page. You should see plans fetched from Creem.
4. Click "Get Started" to generate a checkout link and redirect to Creem's hosted checkout.

### Local Development with Webhooks

Use a tunneling service like ngrok:

```bash
ngrok http 3000
```
Update your webhook URL in Creem dashboard to the ngrok URL (e.g., `https://xxxx.ngrok.io/api/webhooks/creem`).

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/products` | Fetches products from Creem API |
| `POST /api/checkout` | Creates a Creem checkout session and returns the URL |
| `POST /api/webhooks/creem` | Handles payment completion events |

## Credit Allocation logic
(See `src/lib/creem.ts` or `src/app/api/webhooks/creem/route.ts`)

- **Starter Pack**: 10,000 credits
- **Turbo Pack**: 50,000 credits
- **Elite/Enterprise**: 200,000 credits
