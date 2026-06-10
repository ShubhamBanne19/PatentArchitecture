# Patent Architect - Razorpay Worker

Cloudflare Worker backend for The Patent Architect subscription system. Keeps Razorpay API secrets and Firebase credentials out of the Angular frontend.

## Overview

This worker provides three main responsibilities:

1. **Subscription Management**: Create/cancel subscriptions via Razorpay API
2. **Webhook Handler**: Receive and validate Razorpay webhook events
3. **Firestore Integration**: Update user subscription state after payment events

The worker is free-tier deployable on Cloudflare Workers and talks directly to Razorpay API and Firebase Firestore via service account credentials.

## Architecture

```
Angular Frontend (http://localhost:4200)
          │
          │ POST /create-subscription
          │ { tier: 'basic' }
          │ Authorization: Bearer {idToken}
          ▼
Cloudflare Worker (http://localhost:8787)
    • Validates Firebase ID token
    • Creates Razorpay subscription
    • Stores subscription in Firestore
          │
          ├─► Razorpay API
          │   (create/cancel subscriptions)
          │
          └─► Firebase Firestore
              (update users/{uid} and subscriptions/{id})

Razorpay Webhook
          │
          │ POST /razorpay/webhook
          │ event: subscription.activated
          │ X-Razorpay-Signature: {hmac}
          ▼
Cloudflare Worker
    • Validates webhook signature
    • Checks for duplicate events
    • Updates Firestore user tier/status
          │
          └─► Firebase Firestore
              (update users/{uid}/subscription)
```

## Endpoints

### POST /create-subscription

Create a Razorpay subscription for an authenticated user.

**Request:**

```bash
curl -X POST http://localhost:8787/create-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {firebaseIdToken}" \
  -d '{"tier":"basic"}'
```

**Parameters:**

- `tier`: `'basic'` or `'premium'` (required)

**Response:**

```json
{
  "keyId": "rzp_test_...",
  "subscriptionId": "sub_...",
  "tier": "basic",
  "name": "The Patent Architect",
  "description": "Basic premium companion subscription",
  "amount": 19900,
  "currency": "INR",
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Errors:**

- `401`: Invalid or missing Firebase session
- `400`: Invalid tier chosen

### POST /cancel-subscription

Cancel the user's active Razorpay subscription.

**Request:**

```bash
curl -X POST http://localhost:8787/cancel-subscription \
  -H "Authorization: Bearer {firebaseIdToken}"
```

**Response:**

```json
{ "ok": true }
```

**Errors:**

- `401`: Invalid or missing Firebase session
- `400`: No active Razorpay subscription

### GET /subscription-status

Fetch the current subscription status from user's profile.

**Request:**

```bash
curl -X GET http://localhost:8787/subscription-status \
  -H "Authorization: Bearer {firebaseIdToken}"
```

**Response:**

```json
{
  "subscription": {
    "tier": "basic",
    "status": "active",
    "razorpaySubscriptionId": "sub_...",
    "currentPeriodEnd": "2025-07-10T10:30:00.000Z"
  }
}
```

### POST /razorpay/webhook

Receive Razorpay webhook events. **Not called directly; Razorpay calls this endpoint.**

**Event Types Supported:**

- `subscription.authenticated` → tier + status updated
- `subscription.pending` → status = pending
- `subscription.activated` → status = active
- `subscription.charged` → status = active
- `subscription.halted` → status = halted
- `subscription.paused` → status = halted
- `subscription.resumed` → status = active
- `subscription.cancelled` → status = cancelled, tier = free
- `subscription.completed` → status = expired, tier = free

**Security:**

- Request signature validated with `X-Razorpay-Signature` header
- Event deduplication via `razorpayEvents` collection
- Idempotent: same event processed once even if called multiple times

### GET /health

Health check endpoint for monitoring.

**Response:**

```json
{ "ok": true }
```

## Local Development

### 1. Setup Wrangler Configuration

```bash
# Copy example config
cp wrangler.toml.example wrangler.toml

# Edit wrangler.toml and add your Cloudflare Account ID
# Find it at: https://dash.cloudflare.com under "Account ID"
```

### 2. Add Secrets

Add secrets locally (Wrangler stores them in `.wrangler/state/index.json` for local dev):

```bash
npx wrangler secret put RAZORPAY_KEY_ID
# Paste your Razorpay API Key ID

npx wrangler secret put RAZORPAY_KEY_SECRET
# Paste your Razorpay API Secret

npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
# Paste your Razorpay Webhook Secret

npx wrangler secret put FIREBASE_PROJECT_ID
# e.g., patent-architect

npx wrangler secret put FIREBASE_WEB_API_KEY
# From Firebase Console → Project Settings → General

npx wrangler secret put FIREBASE_CLIENT_EMAIL
# From Firebase service account JSON file

npx wrangler secret put FIREBASE_PRIVATE_KEY
# From Firebase service account JSON file (include quotes and newlines)

npx wrangler secret put BASIC_PLAN_ID
# From Razorpay Dashboard → Plans

npx wrangler secret put PREMIUM_PLAN_ID
# From Razorpay Dashboard → Plans

npx wrangler secret put ALLOWED_ORIGIN
# For local: http://localhost:4200
# For prod: https://your-firebase-hosting-url.web.app
```

### 3. Run Locally

```bash
npx wrangler dev worker/razorpay-worker.ts
```

Worker runs on `http://localhost:8787`

### 4. Test Endpoints

**Test Health Check:**

```bash
curl http://localhost:8787/health
```

**Test Create Subscription** (with valid Firebase token):

```bash
# 1. Sign in to Angular app on http://localhost:4200/login
# 2. In browser console, get token:
firebase.auth().currentUser.getIdToken()

# 3. Use token in request:
curl -X POST http://localhost:8787/create-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_FROM_STEP_2}" \
  -d '{"tier":"basic"}'
```

## Production Deployment

### 1. Build TypeScript

```bash
npm run build
```

Compiles `razorpay-worker.ts` → `dist/index.js`

### 2. Deploy to Cloudflare

```bash
npx wrangler deploy worker/razorpay-worker.ts
```

Note the deployment URL: `https://patent-arch-worker.YOUR_ACCOUNT.workers.dev`

### 3. Configure Razorpay Webhook

In Razorpay Dashboard → Settings → Webhooks:

- **URL**: `https://patent-arch-worker.YOUR_ACCOUNT.workers.dev/razorpay/webhook`
- **Events**: All subscription events (see endpoint docs above)
- **Secret**: Copy and add to `RAZORPAY_WEBHOOK_SECRET` secret

### 4. Update Angular Environment

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  workerApiBaseUrl: "https://patent-arch-worker.YOUR_ACCOUNT.workers.dev",
  // ...
};
```

## Troubleshooting

### Issue: "Invalid Firebase Session"

- **Check**: Firebase ID token is valid and not expired
- **Check**: `FIREBASE_WEB_API_KEY` is set correctly in Worker secrets
- **Fix**: Browser must be signed in; token refreshes automatically

### Issue: "Razorpay request failed"

- **Check**: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- **Check**: You're using correct plan IDs for subscription creation
- **Check**: Plan exists in Razorpay dashboard
- **Fix**: Test credentials in Razorpay test mode first

### Issue: "Invalid Razorpay webhook signature"

- **Check**: `RAZORPAY_WEBHOOK_SECRET` matches exactly in Razorpay dashboard
- **Check**: Webhook event hasn't been tampered with
- **Fix**: Re-copy webhook secret from Razorpay dashboard

### Issue: "Firestore write failed"

- **Check**: `FIREBASE_PROJECT_ID` matches your project
- **Check**: `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are valid
- **Check**: Firestore security rules allow service account writes
- **Fix**: Regenerate service account JSON from Firebase Console

### Issue: "CORS error in browser"

- **Check**: `ALLOWED_ORIGIN` matches browser origin exactly
- **Check**: Request has proper Authorization header
- **Fix**: Browser Origins must be exact domain (http://localhost:4200 not localhost:4200)

### Issue: "Duplicate event error"

- **Expected**: Same event processed multiple times returns `{ok: true, duplicate: true}`
- **Check**: `razorpayEvents` collection in Firestore for event records
- **This is OK**: Idempotency prevents double-charging

## Monitoring

### Cloudflare Dashboard

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers → patent-arch-worker
3. Monitor: Request count, error rate, latency

### Firebase Console

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Firestore → Collections → `subscriptions` and `razorpayEvents`
3. Monitor: Document count growth, activity

### Razorpay Dashboard

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Subscriptions → View all subscriptions
3. Monitor: Active subscriptions, failed payments, refunds

## Rate Limits & Quotas

- **Cloudflare Workers Free**: 100,000 requests/day
- **Razorpay API**: 100 requests/second (not a concern for this traffic)
- **Firebase Firestore Free**: 50,000 reads/day, 20,000 writes/day

If exceeded, upgrade Firebase Firestore to Blaze plan (pay-as-you-go).

## Security Considerations

1. **Secrets Management**:
   - Never commit secrets to git
   - Use `wrangler secret put` for all credentials
   - Rotate Razorpay keys annually

2. **Input Validation**:
   - `tier` must be 'basic' or 'premium'
   - Firebase ID token always validated
   - Event signatures always verified

3. **Output**:
   - Sensitive fields (keys, tokens) never returned to client
   - Error messages generic (don't leak internals)
   - CORS restricted to allowed origin only

4. **Logs**:
   - Errors logged for debugging
   - No sensitive data in logs
   - View logs: Cloudflare dashboard → Workers → Logs

## File Structure

```
worker/
├── razorpay-worker.ts         # Main worker code
├── wrangler.toml              # Production config
├── wrangler.toml.example      # Config template
└── README.md                  # This file
```

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Razorpay Subscriptions API](https://razorpay.com/docs/api/payments/subscriptions/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Firestore REST API](https://firebase.google.com/docs/firestore/use-rest-api)
