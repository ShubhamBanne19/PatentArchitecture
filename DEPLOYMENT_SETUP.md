# Firebase Free-First Deployment Guide - The Patent Architect

This guide covers deploying the Patent Architect Angular app with Firebase Hosting (Spark), Auth, and Firestore. Payments are **manual one-time purchases** — see [MANUAL_ACCESS.md](MANUAL_ACCESS.md) for the operator runbook.

## Architecture Overview

- **Frontend**: Angular 17 on Firebase Hosting (Spark/Free) — public routes are
  prerendered to static HTML at build time; auth-gated routes fall back to
  client-side rendering via `index.csr.html`
- **Auth**: Firebase Authentication (email/password + Google)
- **Database**: Firestore for users, access requests, premium content
- **Payments**: Manual UPI/bank transfer + admin grant ([MANUAL_ACCESS.md](MANUAL_ACCESS.md))
- **Permanent Routes**: /companion/chapter-NN are never changed or removed

## Prerequisites

1. **Firebase Project**: Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Spark plan (no credit card required for free tier)
   - Enable Firebase Hosting, Authentication, and Firestore

2. **GitHub Setup**:
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
3. Copy the Firebase config object into
   [src/environments/firebase.config.ts](src/environments/firebase.config.ts):

   ```typescript
   export const firebaseConfig: FirebaseOptions = {
     apiKey: "YOUR_FIREBASE_API_KEY",
     authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
     projectId: "YOUR_FIREBASE_PROJECT_ID",
     storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
     messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
     appId: "YOUR_FIREBASE_APP_ID",
   };
   ```

   `environment.ts` imports from this single file, so you only fill it in once.
   The file **is committed** — the web config is public
   by design (it ships in the deployed JS bundle) and grants no access on its own;
   all access control lives in `firestore.rules`. Committing it is also what lets
   CI build the app without extra setup. Just make sure you complete section 1.3.1
   below to restrict where the key can be used from.

### 1.3.1 Lock down the Web API key (do this — the key is public in the browser)

The web `apiKey` ships in the browser bundle and is not a secret. Restrict it so it
can only be used from your domains:

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your
   Firebase project → **APIs & Services → Credentials**
2. Click the auto-created **"Browser key (auto created by Firebase)"**
3. **Application restrictions → HTTP referrers**, add:
   - `http://localhost:4200/*`
   - `https://YOUR_PROJECT.web.app/*` and `https://YOUR_PROJECT.firebaseapp.com/*`
   - your custom domain if any
4. **API restrictions → Restrict key** → allow only: *Identity Toolkit API*,
   *Token Service API*, *Cloud Firestore API* (+ any others your app uses)
5. In Firebase Console → **Authentication → Settings → Authorized domains**, ensure
   `localhost` and your production domain are listed.

### 1.4 Deploy Firestore Rules

1. Copy [firestore.rules](firestore.rules) content
2. Go to Firebase Console → Build → Firestore → Rules
3. Paste the rules and click "Publish"


## Step 2: GitHub CI/CD Setup

### 2.1 Create GitHub Secrets

1. Go to GitHub Repo → Settings → Secrets and Variables → Actions
2. Add this secret:

| Secret Name                | Value                                   |
| -------------------------- | --------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` | Entire service account JSON (as string) |

### 2.2 Deploy Workflow

Push to main branch to trigger automated deployment (`.github/workflows/deploy.yml`).

## Step 3: Test the System

### 3.1 Local Testing

```bash
npm start
# Visit http://localhost:4200
```

### 3.2 Test Flows

1. **Register and Login**:
   - Visit http://localhost:4200/register
   - Create account with email/password
   - Test Google sign-in
   - Verify profile created in Firestore under `users/{uid}`

2. **Request Full Access** (manual payment flow):
   - Go to http://localhost:4200/get-access
   - Submit a payment reference — creates `accessRequests/{uid}` with `status: "pending"`
   - Grant access: `node tools/grant-access.mjs grant <your-test-email>`
   - The app should unlock premium live, without a re-login

3. **View Premium Content**:
   - Go to http://localhost:4200/premium
   - Should see locked paywall if not subscribed
   - Should see content list if subscribed

### 3.3 Production Testing

1. Deploy to Firebase:

   ```bash
   firebase deploy
   ```

2. Visit your Firebase Hosting URL (e.g., `https://patent-architect-abc123.web.app`)

3. Test same flows as local (steps 1-3 above)

## Step 4: Monitor Quotas

Free-tier quotas to monitor:

| Service              | Limit                               | Monitor                      |
| -------------------- | ----------------------------------- | ---------------------------- |
| **Firebase Hosting** | 1GB storage, 10GB/month transfer    | Firebase Console → Hosting   |
| **Firestore**        | 50,000 reads/day, 20,000 writes/day | Firebase Console → Firestore |
| **Firebase Auth**    | 10,000 sign-ups/month free          | Firebase Console → Auth      |

If you exceed quotas, upgrade to Firebase Blaze (pay-as-you-go).

## Troubleshooting

### Issue: "Firebase session invalid"

- Verify Firebase Web SDK key in `src/environments/firebase.config.ts`
- Check the key restrictions from section 1.3.1 allow your domain

### Issue: Companion QR routes return 404

- Verify `src/app/app.routes.ts` still has `/companion/chapter-NN` routes
- Check `firebase.json` has SPA rewrite rule
- Hard refresh browser (Ctrl+Shift+R)

### Issue: Premium content not loading

- Check Firestore rules are deployed correctly
- Verify `premiumContent` collection exists in Firestore
- Ensure documents have `published: true`

## Maintenance & Monitoring

1. **Monitor Firestore**: Check collection sizes and growth patterns
2. **Backup Firestore**: Regular exports via Firebase Console
3. **Auth Emails**: Configure email templates in Firebase Console → Authentication → Templates

## Next Steps

- **Email Templates**: Customize Firebase Auth email templates (password reset, signup confirmation)
- **Premium Content**: Add documents to `premiumContent` collection in Firestore
- **Analytics**: Add Google Analytics to Firebase (optional)
- **Custom Domain**: Configure custom domain in Firebase Hosting settings

## References

- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Angular Deployment Docs](https://angular.io/guide/deployment)
