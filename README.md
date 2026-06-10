# The Patent Architect - Free-First Subscription Platform

A modern Angular 17 SPA for **The Patent Architect** book companion, featuring Firebase Hosting, Firebase Authentication, Firestore subscriptions, and Razorpay billing—entirely free-tier deployable.

## 🎯 Key Features

- ✅ **Public Book Companion**: Permanent QR code routes (`/companion/chapter-NN`) that never change
- ✅ **Firebase Auth**: Email/password and Google sign-in with persistent sessions
- ✅ **Razorpay Subscriptions**: Monthly plans (₹199 Basic, ₹499 Premium) via Razorpay India
- ✅ **Premium Content**: Firestore-backed chapter extras, prompt packs, and downloads (not in public assets)
- ✅ **Free Hosting**: Firebase Hosting Spark plan + Cloudflare Workers free tier (no fixed backend fees)
- ✅ **Production-Ready**: Firestore security rules, webhook validation, duplicate event handling

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Users (browser)                                        │
└─────────────┬───────────────────────────────────────────┘
              │ (HTTPS)
    ┌─────────▼────────────────────────────────────────┐
    │  Firebase Hosting (Angular SPA)                   │
    │  - Public routes (home, book, pricing, etc.)      │
    │  - Auth routes (login, register)                  │
    │  - Protected routes (dashboard, premium)          │
    │  - Permanent /companion/chapter-NN routes         │
    └──────────┬──────────────────┬────────────────────┘
               │                  │
       ┌───────▼────┐      ┌──────▼──────────┐
       │ Firebase    │      │ Cloudflare      │
       │ - Auth      │      │ Workers         │
       │ - Firestore │      │ (Free backend)  │
       │   users/    │      │ - /create-sub   │
       │   premiumC..│      │ - /cancel-sub   │
       │   subscr... │      │ - /webhook      │
       └──────┬──────┘      └────────┬────────┘
              │                      │
              │         ┌────────────▼─────────────┐
              │         │  Razorpay API            │
              │         │  - Create subscription   │
              └────────►│  - Validate webhook      │
                        │  - Update subscription   │
                        └──────────────────────────┘
```

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone and install
git clone <repo>
npm install

# 2. Update env variables (copy Firebase config)
# Edit src/environments/environment.ts with your Firebase credentials

# 3. Start dev server
npm start
# App runs on http://localhost:4200

# 4. In another terminal: Start Firestore emulator (optional)
firebase emulators:start

# 5. In third terminal: Start Worker locally
cd worker
npx wrangler dev worker/razorpay-worker.ts
# Worker runs on http://localhost:8787
```

### Test Flows Locally

1. **Register**: http://localhost:4200/register (creates Firestore user)
2. **Login**: http://localhost:4200/login (uses email/Google)
3. **View Pricing**: http://localhost:4200/pricing
4. **Subscribe**: Click "Start Basic" → Razorpay test checkout (test card: 4111111111111111)
5. **Check Premium**: http://localhost:4200/premium (shows content if subscribed)

## 📋 Production Deployment

See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) for complete step-by-step guide.

**TL;DR** (assumes Firebase + Razorpay accounts exist):

```bash
# 1. Configure Firebase + Firestore
firebase deploy

# 2. Configure Worker
cd worker
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
# ... (set all secrets, see wrangler.toml for full list)
wrangler deploy worker/razorpay-worker.ts

# 3. Set GitHub Secrets
# - FIREBASE_SERVICE_ACCOUNT
# - FIREBASE_CI_TOKEN

# 4. Update environment.prod.ts with Worker URL

# 5. Push to main branch
git push origin main
# Automated GitHub Actions workflow deploys to Firebase Hosting
```

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── firebase/
│   │   │   └── firebase-core.service.ts     # Firebase SDK init
│   │   ├── services/
│   │   │   ├── auth.service.ts              # Auth state management
│   │   │   ├── subscription.service.ts      # Razorpay integration
│   │   │   ├── premium-content.service.ts   # Firestore queries
│   │   │   └── ...
│   │   ├── guards/
│   │   │   ├── auth.guard.ts                # Protect routes
│   │   │   └── subscription.guard.ts        # Protect premium content
│   │   └── models/
│   │       └── subscription.models.ts       # TypeScript types
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/                       # User workspace
│   │   ├── subscription/                    # Manage plan
│   │   ├── premium/                         # Premium content
│   │   ├── companion/
│   │   │   ├── hub/                         # Public companion hub
│   │   │   └── chapter/                     # Chapter pages (permanent QR routes)
│   │   ├── pricing/                         # Plan selection
│   │   └── ...                              # Other public pages
│   └── shared/
│       └── components/                      # Reusable UI components
├── assets/
│   └── content/                             # Static JSON (not secrets/premium)
├── environments/
│   ├── environment.ts                       # Dev (local Worker)
│   └── environment.prod.ts                  # Prod (deployed Worker)
└── styles/                                  # SCSS tokens & mixins

worker/
├── razorpay-worker.ts                       # Cloudflare Worker code
├── wrangler.toml                            # Worker config
└── README.md                                # Worker setup guide

firestore.rules                              # Firestore security rules
firebase.json                                # Firebase Hosting config
DEPLOYMENT_SETUP.md                          # Detailed deployment guide
```

## 🔐 Security Model

### Authentication

- **Firebase Auth**: Email/password + Google sign-in
- **Session**: Browser local persistence (Firebase SDK)
- **Protection**: `authGuard` redirects to login; `guestGuard` redirects authenticated users away from login page

### Subscription Access

- **Firestore Rules**: Only active subscribers (`status: 'active'`) can read premium content
- **Tier Matching**: Basic users cannot read premium-tier content
- **Server-Side Enforcement**: Users cannot update their own `subscription` field (Worker-only)

### Premium Content

- **Not in Git**: All premium markdown stored in Firestore, not in public assets
- **Firestore Protection**: `premiumContent` collection readable only by matching subscribers
- **Webhook Validation**: Razorpay events signed and verified before updating Firestore

### Backend (Worker)

- **Secrets**: Razorpay API key/secret, Firebase service account, never exposed to frontend
- **CORS**: Restricted to Firebase Hosting URL (prod) or localhost (dev)
- **Auth**: Validates Firebase ID token on every request

## 💰 Free-Tier Limits

| Service            | Limit                            | Monitoring                                               |
| ------------------ | -------------------------------- | -------------------------------------------------------- |
| Firebase Hosting   | 1GB storage, 10GB/month transfer | [Hosting Analytics](https://console.firebase.google.com) |
| Firestore          | 50K reads/day, 20K writes/day    | [Firestore Stats](https://console.firebase.google.com)   |
| Firebase Auth      | 10K sign-ups/month               | [Auth Dashboard](https://console.firebase.google.com)    |
| Cloudflare Workers | 100K requests/day                | [Cloudflare Analytics](https://dash.cloudflare.com)      |

**If you exceed**: Upgrade Firebase to Blaze (pay-as-you-go) or consider Cloudflare Pages for static hosting.

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Local Integration (with emulators)

```bash
# Terminal 1
npm start

# Terminal 2
firebase emulators:start

# Terminal 3
cd worker && npx wrangler dev worker/razorpay-worker.ts

# Then visit http://localhost:4200 and test flows
```

### Production E2E

1. Deploy to Firebase: `firebase deploy`
2. Deploy Worker: `cd worker && wrangler deploy worker/razorpay-worker.ts`
3. Visit your Firebase Hosting URL
4. Test complete flow: register → subscribe → view premium

## 📖 Learn More

- **[Deployment Guide](DEPLOYMENT_SETUP.md)** – Step-by-step setup for Firebase + Razorpay + Worker
- **[Worker Setup](worker/README.md)** – Cloudflare Worker configuration
- **[Firebase Docs](https://firebase.google.com/docs)** – Authentication, Firestore, Hosting
- **[Razorpay API](https://razorpay.com/docs/api/subscriptions/)** – Subscription API reference
- **[Angular Deployment](https://angular.io/guide/deployment)** – Angular production builds

## ⚠️ Important: Companion Routes

The `/companion/chapter-NN` routes are **PERMANENT** because they are printed in the physical book via QR codes.

- **Never remove or rename** these routes
- **Never add authentication** to them (must remain public)
- To add new chapters, always append new routes; never delete old ones
- Routes are listed in [src/app/app.routes.ts](src/app/app.routes.ts)

## 🤝 Contributing

When adding new features:

1. **Public pages**: No auth required, add to routing freely
2. **Premium content**: Use `premiumContent` Firestore collection, protect via `subscriptionGuard`
3. **User state**: Use `AuthService.profile()` signal for user data
4. **Styling**: Follow SCSS tokens in [src/styles/\_tokens.scss](src/styles/_tokens.scss)

## 📝 License

See LICENSE file for details.

## 🆘 Support

For issues:

1. Check [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) troubleshooting section
2. Review [worker/README.md](worker/README.md) for backend issues
3. Check Firebase Console for Firestore/Auth errors
4. Review Cloudflare Worker logs via dashboard
