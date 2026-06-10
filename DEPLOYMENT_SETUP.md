# Firebase Free-First Deployment Guide - The Patent Architect

This guide covers deploying the Patent Architect Angular SPA with Firebase Hosting (Spark), Auth, Firestore, and Cloudflare Workers for Razorpay subscriptions.

## Architecture Overview

- **Frontend**: Angular 17 SPA on Firebase Hosting (Spark/Free)
- **Auth**: Firebase Authentication (email/password + Google)
- **Database**: Firestore for users, subscriptions, premium content
- **Backend**: Cloudflare Worker (Free) for Razorpay API calls and webhooks
- **Payment Gateway**: Razorpay India subscriptions (₹199/₹499/month)
- **Permanent Routes**: /companion/chapter-NN are never changed or removed

## Prerequisites

1. **Firebase Project**: Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Spark plan (no credit card required for free tier)
   - Enable Firebase Hosting, Authentication, and Firestore

2. **Razorpay Account**: Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
   - Generate API Key and Secret
   - Create two subscription plans: Basic (₹199/month) and Premium (₹499/month)

3. **Cloudflare Account**: Create free account at [dash.cloudflare.com](https://dash.cloudflare.com)
   - No domain required for free Workers deployment

4. **GitHub Setup**:
   - Push repository to GitHub with main branch
   - Create GitHub secrets (see below)

## Step 1: Firebase Configuration

### 1.1 Create Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file locally (keep it secure)

### 1.2 Enable Firebase Services

1. **Authentication**:
   - Go to Firebase Console → Build → Authentication
   - Enable Email/Password provider
   - Enable Google provider (add your domain)

2. **Firestore Database**:
   - Go to Firebase Console → Build → Firestore Database
   - Create database in production mode (US multi-region recommended)
   - Click "Done" without editing rules yet

3. **Hosting**:
   - Go to Firebase Console → Build → Hosting
   - Note your Firebase Hosting domain (e.g., `patent-architect-abc123.web.app`)

### 1.3 Get Firebase Web SDK Config

1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" and click your web app
3. Copy the Firebase config object
4. Update [src/environments/environment.ts](src/environments/environment.ts):

   ```typescript
   const firebaseConfig: FirebaseOptions = {
     apiKey: "YOUR_FIREBASE_API_KEY",
     authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
     projectId: "YOUR_FIREBASE_PROJECT_ID",
     storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
     messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
     appId: "YOUR_FIREBASE_APP_ID",
   };
   ```

5. Update [src/environments/environment.prod.ts](src/environments/environment.prod.ts) with the same credentials

### 1.4 Deploy Firestore Rules

1. Copy [firestore.rules](firestore.rules) content
2. Go to Firebase Console → Build → Firestore → Rules
3. Paste the rules and click "Publish"

## Step 2: Cloudflare Worker Setup

### 2.1 Create Wrangler Configuration

1. Copy [worker/wrangler.toml.example](worker/wrangler.toml.example) to `worker/wrangler.toml`:

   ```bash
   cp worker/wrangler.toml.example worker/wrangler.toml
   ```

2. Update `worker/wrangler.toml`:

   ```toml
   name = "patent-arch-worker"
   type = "javascript"
   account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"
   workers_dev = true
   route = ""
   zone_id = ""

   [build]
   command = "npm install -g typescript && tsc worker/razorpay-worker.ts --lib es2022,dom --module esnext --target es2022 --outDir ."
   watch_paths = ["worker/**/*.ts"]
   ```

3. Find your Cloudflare Account ID:
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Right sidebar shows "Account ID"

### 2.2 Add Worker Secrets

```bash
cd worker

# Razorpay credentials
wrangler secret put RAZORPAY_KEY_ID
# Paste your Razorpay Key ID

wrangler secret put RAZORPAY_KEY_SECRET
# Paste your Razorpay Key Secret

wrangler secret put RAZORPAY_WEBHOOK_SECRET
# Paste your Razorpay Webhook Secret

# Firebase credentials
wrangler secret put FIREBASE_PROJECT_ID
# Paste your Firebase Project ID

wrangler secret put FIREBASE_WEB_API_KEY
# Paste your Firebase API Key

wrangler secret put FIREBASE_CLIENT_EMAIL
# Paste from service account JSON: client_email

wrangler secret put FIREBASE_PRIVATE_KEY
# Paste from service account JSON: private_key (include quotes and newlines)

# Razorpay Plan IDs
wrangler secret put BASIC_PLAN_ID
# Paste your Basic plan ID from Razorpay

wrangler secret put PREMIUM_PLAN_ID
# Paste your Premium plan ID from Razorpay

# CORS origin
wrangler secret put ALLOWED_ORIGIN
# For production: paste your Firebase Hosting URL (e.g., https://patent-architect-abc123.web.app)
# For local dev: http://localhost:4200
```

### 2.3 Test Worker Locally

```bash
cd worker
npx wrangler dev worker/razorpay-worker.ts
```

Worker runs on http://localhost:8787

### 2.4 Deploy Worker

```bash
cd worker
npx wrangler deploy worker/razorpay-worker.ts
```

Note the deployment URL (e.g., `https://patent-arch-worker.YOUR_ACCOUNT.workers.dev`)

## Step 3: Update Environment for Worker URL

Update both environment files with your Worker URL:

**[src/environments/environment.ts](src/environments/environment.ts)**:

```typescript
workerApiBaseUrl: 'http://localhost:8787',
```

**[src/environments/environment.prod.ts](src/environments/environment.prod.ts)**:

```typescript
workerApiBaseUrl: 'https://patent-arch-worker.YOUR_ACCOUNT.workers.dev',
```

## Step 4: Configure Razorpay Webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks
2. Add webhook:
   - **URL**: `https://patent-arch-worker.YOUR_ACCOUNT.workers.dev/razorpay/webhook`
   - **Events**: Select all subscription events:
     - `subscription.authenticated`
     - `subscription.pending`
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.halted`
     - `subscription.paused`
     - `subscription.cancelled`
     - `subscription.completed`
     - `subscription.resumed`

3. Copy the Webhook Secret and add to Worker secrets (step 2.2)

## Step 5: GitHub CI/CD Setup

### 5.1 Create GitHub Secrets

1. Go to GitHub Repo → Settings → Secrets and Variables → Actions
2. Add these secrets:

| Secret Name                | Value                                   |
| -------------------------- | --------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` | Entire service account JSON (as string) |
| `FIREBASE_CI_TOKEN`        | From `firebase login:ci --no-localhost` |

### 5.2 Deploy Workflow

Push to main branch to trigger automated deployment:

```bash
git add .
git commit -m "Deploy Firebase + Razorpay subscription system"
git push origin main
```

## Step 6: Test the System

### 6.1 Local Testing

```bash
# Terminal 1: Start Angular dev server
npm start
# Visit http://localhost:4200

# Terminal 2: Start Worker locally
cd worker && npx wrangler dev worker/razorpay-worker.ts
# Worker on http://localhost:8787

# Terminal 3: Start Firestore emulator
firebase emulators:start
```

### 6.2 Test Flows

1. **Register and Login**:
   - Visit http://localhost:4200/register
   - Create account with email/password
   - Test Google sign-in
   - Verify profile created in Firestore under `users/{uid}`

2. **Subscribe to Basic Plan**:
   - Go to http://localhost:4200/pricing
   - Click "Start Basic"
   - Uses Razorpay test credentials
   - After successful payment, check Firestore:
     - `users/{uid}/subscription.status` should be "active"
     - `users/{uid}/subscription.tier` should be "basic"

3. **View Premium Content**:
   - Go to http://localhost:4200/premium
   - Should see locked paywall if not subscribed
   - Should see content list if subscribed

4. **Test Webhook** (local):
   ```bash
   curl -X POST http://localhost:8787/razorpay/webhook \
     -H "Content-Type: application/json" \
     -H "X-Razorpay-Signature: test_signature" \
     -H "X-Razorpay-Event-Id: test_event_123" \
     -d '{...}'
   ```

### 6.3 Production Testing

1. Deploy to Firebase:

   ```bash
   firebase deploy
   ```

2. Visit your Firebase Hosting URL (e.g., `https://patent-architect-abc123.web.app`)

3. Test same flows as local (steps 1-3 above)

## Step 7: Monitor Quotas

Free-tier quotas to monitor:

| Service                | Limit                               | Monitor                        |
| ---------------------- | ----------------------------------- | ------------------------------ |
| **Firebase Hosting**   | 1GB storage, 10GB/month transfer    | Firebase Console → Hosting     |
| **Firestore**          | 50,000 reads/day, 20,000 writes/day | Firebase Console → Firestore   |
| **Firebase Auth**      | 10,000 sign-ups/month free          | Firebase Console → Auth        |
| **Cloudflare Workers** | 100,000 requests/day free           | Cloudflare → Workers Analytics |

If you exceed quotas, upgrade to Firebase Blaze (pay-as-you-go) or move to Cloudflare Pages for static hosting.

## Troubleshooting

### Issue: "Invalid Razorpay webhook signature"

- Verify webhook secret matches `RAZORPAY_WEBHOOK_SECRET` in Worker secrets
- Ensure webhook URL matches exactly in Razorpay dashboard

### Issue: "Firebase session invalid"

- Check `FIREBASE_WEB_API_KEY` in Worker secrets
- Verify Firebase Web SDK key in environment files

### Issue: Companion QR routes return 404

- Verify `src/app/app.routes.ts` still has `/companion/chapter-NN` routes
- Check `firebase.json` has SPA rewrite rule
- Hard refresh browser (Ctrl+Shift+R)

### Issue: Premium content not loading

- Check Firestore rules are deployed correctly
- Verify `premiumContent` collection exists in Firestore
- Ensure documents have `published: true`

### Issue: Worker deployment fails

- Verify Cloudflare account ID in `wrangler.toml`
- Check all secrets are set: `wrangler secret list`
- Try: `npm install -g wrangler@latest`

## Maintenance & Monitoring

1. **Monitor Firestore**: Check collection sizes and growth patterns
2. **Monitor Worker**: Cloudflare dashboard shows request counts and errors
3. **Backup Firestore**: Regular exports via Firebase Console
4. **Update Razorpay Plans**: Adjust prices in Razorpay dashboard (requires customer update)
5. **Auth Emails**: Configure email templates in Firebase Console → Authentication → Templates

## Next Steps

- **Email Templates**: Customize Firebase Auth email templates (password reset, signup confirmation)
- **Premium Content**: Add documents to `premiumContent` collection in Firestore
- **Analytics**: Add Google Analytics to Firebase (optional)
- **Custom Domain**: Configure custom domain in Firebase Hosting settings

## References

- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Razorpay Subscriptions API](https://razorpay.com/docs/api/payments/subscriptions/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Angular Deployment Docs](https://angular.io/guide/deployment)
