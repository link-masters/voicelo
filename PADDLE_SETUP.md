# Paddle Payment Gateway Setup

This document guides you through setting up Paddle as your payment provider for VoiceLo.

## Prerequisites

1. A Paddle account (sandbox for testing, production for live)
2. Products and prices created in Paddle Dashboard

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# =====================================
# PADDLE CONFIGURATION
# =====================================

# Active payment provider: 'paddle' or 'lemonsqueezy'
NEXT_PUBLIC_PAYMENT_PROVIDER=paddle

# Paddle Environment: 'sandbox' or 'production'
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# Client-side token (starts with 'test_' for sandbox, 'live_' for production)
# Get this from: Paddle Dashboard > Developer Tools > Authentication
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server-side API Key (for webhooks and API calls)
# Get this from: Paddle Dashboard > Developer Tools > Authentication
PADDLE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook secret for signature verification
# Get this when creating a webhook endpoint in Paddle Dashboard
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Vendor ID (for reference)
PADDLE_VENDOR_ID=your_vendor_id
```

## Paddle Dashboard Setup

### 1. Create Products

In Paddle Dashboard > Catalog > Products:

1. **Starter Pack**
   - Name: `Starter Pack`
   - Tax Category: `SaaS`
   - Create a price: $9.00 USD (one-time)

2. **Turbo Pack**
   - Name: `Turbo Pack`
   - Tax Category: `SaaS`
   - Create a price: $29.00 USD (one-time)

### 2. Create Client-Side Token

1. Go to **Developer Tools > Authentication**
2. Click **Generate client-side token**
3. Name: `VoiceLo Web Dashboard`
4. Copy the token and add it to `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

### 3. Create API Key

1. Go to **Developer Tools > Authentication**
2. Click **Generate API key**
3. Name: `VoiceLo Server`
4. Copy the key and add it to `PADDLE_API_KEY`

### 4. Configure Webhook

1. Go to **Developer Tools > Notifications**
2. Click **New destination**
3. Configure:
   - Type: `URL`
   - URL: `https://yourdomain.com/api/webhooks/paddle`
   - Description: `VoiceLo Production Webhooks`
   - Events to subscribe:
     - `transaction.completed`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
4. Copy the **Endpoint secret key** and add it to `PADDLE_WEBHOOK_SECRET`

### 5. Approved Checkout URLs

In **Checkout > Checkout settings**:

1. Add your domain to **Approved checkout URLs**:
   - `https://yourdomain.com`
   - `http://localhost:3000` (for local testing)

## Testing

### Sandbox Testing

1. Set `NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox`
2. Use sandbox client token (starts with `test_`)
3. Use Paddle's [test cards](https://developer.paddle.com/concepts/testing/test-card-numbers):
   - Success: `4242 4242 4242 4242`
   - 3D Secure: `4000 0000 0000 3220`
   - Decline: `4000 0000 0000 0002`

### Local Development with Webhooks

For local webhook testing, use a tunneling service:

```bash
# Using ngrok
ngrok http 3000

# Update webhook URL in Paddle Dashboard to:
# https://your-ngrok-url.ngrok.io/api/webhooks/paddle
```

## Switching Between Providers

To switch between Lemon Squeezy and Paddle:

```env
# For Lemon Squeezy
NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy

# For Paddle
NEXT_PUBLIC_PAYMENT_PROVIDER=paddle
```

## Troubleshooting

### "Payment system is loading"
- Ensure `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` is set correctly
- Check browser console for Paddle initialization errors

### Webhook not receiving events
- Verify webhook URL is correct and publicly accessible
- Check `PADDLE_WEBHOOK_SECRET` matches the endpoint secret
- Ensure the webhook is set to receive the correct events

### Products not showing
- Verify `PADDLE_API_KEY` is set correctly
- Check that products are `active` in Paddle Dashboard
- Confirm product names contain "Starter" or "Turbo"

### Checkout not opening
- Check browser console for errors
- Verify domain is in Paddle's approved checkout URLs
- Ensure Paddle.js is loading correctly

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/products` | Fetches products and prices from Paddle |
| `POST /api/checkout` | Returns Paddle checkout configuration |
| `POST /api/webhooks/paddle` | Receives Paddle webhook events |

## Credit Allocation

Credits are allocated based on product names:
- **Starter Pack**: 10,000 credits
- **Turbo Pack**: 50,000 credits

## Production Checklist

Before going live:

- [ ] Switch to production environment
- [ ] Use live API key and client token
- [ ] Update webhook URL to production domain
- [ ] Verify webhook signature is working
- [ ] Test a real transaction
- [ ] Enable production taxes in Paddle Dashboard
