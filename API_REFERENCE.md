# API Reference - Patent Architect Subscription System

Quick reference for frontend/backend API contracts, Firestore models, and authentication flows.

## Authentication API

### Firebase Authentication

**Register (Client-side)**

```typescript
await authService.register(name: string, email: string, password: string)
// Side effects:
// - Creates Firebase Auth user
// - Creates Firestore user/{uid} document with tier=free, status=free
// - Sets Firebase Auth displayName
```

**Sign In (Client-side)**

```typescript
await authService.signInWithEmail(email: string, password: string)
// Returns: void
// Side effects: Updates Firestore lastLoginAt
```

**Sign In with Google (Client-side)**

```typescript
await authService.signInWithGoogle();
// Side effects: Creates Firestore user if not exists
```

**Reset Password (Client-side)**

```typescript
await authService.resetPassword(email: string)
// Returns: void
// Side effects: Sends password reset email via Firebase
```

**Logout (Client-side)**

```typescript
await authService.logout();
// Returns: void
// Side effects: Clears Firebase auth session
```

## Subscription API

### Worker Endpoints

All endpoints require `Authorization: Bearer {firebaseIdToken}` header.

#### POST /create-subscription

Create a Razorpay subscription.

**Request Body**:

```json
{
  "tier": "basic" | "premium"
}
```

**Response** (200):

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

**Errors**:

- `401`: Invalid Firebase token
- `400`: Invalid tier

#### POST /cancel-subscription

Cancel active subscription.

**Request Body**: Empty

**Response** (200):

```json
{ "ok": true }
```

**Errors**:

- `401`: Invalid Firebase token
- `400`: No active subscription

#### GET /subscription-status

Get current subscription status.

**Response** (200):

```json
{
  "subscription": {
    "tier": "basic" | "premium" | "free",
    "status": "free" | "pending" | "active" | "halted" | "cancelled" | "expired",
    "razorpaySubscriptionId": "sub_..." | null,
    "currentPeriodEnd": "2025-07-10T10:30:00.000Z" | null
  }
}
```

#### POST /razorpay/webhook

Receive Razorpay events (called by Razorpay, not by client).

**Headers Required**:

- `X-Razorpay-Signature`: HMAC signature
- `X-Razorpay-Event-Id`: Event ID for deduplication

**Request Body** (Razorpay webhook payload):

```json
{
  "event": "subscription.activated",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_...",
        "plan_id": "plan_...",
        "customer_id": "cust_...",
        "status": "active",
        "current_start": 1687698600,
        "current_end": 1690376600,
        "notes": {
          "uid": "firebase_uid",
          "tier": "basic",
          "email": "user@example.com"
        }
      }
    }
  }
}
```

**Response** (200):

```json
{ "ok": true }
```

**Webhook Event Types**:

- `subscription.authenticated` → status: pending
- `subscription.pending` → status: pending
- `subscription.activated` → status: active
- `subscription.charged` → status: active
- `subscription.halted` → status: halted
- `subscription.paused` → status: halted
- `subscription.resumed` → status: active
- `subscription.cancelled` → status: cancelled, tier: free
- `subscription.completed` → status: expired, tier: free

## Firestore Data Models

### users/{uid}

User profile document.

```typescript
interface AppUser {
  uid: string; // Firebase Auth UID
  email: string; // Email address
  name: string; // Display name
  role: "user"; // Always 'user' for normal users
  subscription: UserSubscription; // Current subscription state
  razorpayCustomerId?: string | null; // Razorpay customer ID (server-only)
  createdAt?: Timestamp | null; // When account was created
  lastLoginAt?: Timestamp | null; // Last login timestamp
}

interface UserSubscription {
  tier: "free" | "basic" | "premium"; // Current tier
  status: "free" | "pending" | "active" | "halted" | "cancelled" | "expired"; // Status
  razorpaySubscriptionId?: string | null; // Razorpay subscription ID
  currentPeriodEnd?: Timestamp | null; // When current period ends
  updatedAt?: Timestamp | null; // Last update
}
```

**Firestore Rules**:

- Create: Only during registration, enforces initial tier=free, status=free
- Read: Users can only read their own documents
- Update: Users can only update name (not subscription or razorpayCustomerId)
- Delete: Prohibited

### premiumContent/{id}

Premium content document.

```typescript
interface PremiumContent {
  id: string; // Document ID
  chapterId: string; // e.g., "chapter-01"
  title: string; // Content title
  type: "chapter-extra" | "prompt-pack" | "download" | "update" | "checklist";
  accessLevel: "basic" | "premium"; // Minimum tier to read
  bodyMarkdown: string; // Content as Markdown
  published: boolean; // Is this content live?
  updatedAt?: Timestamp | null; // Last updated
}
```

**Firestore Rules**:

- Read: Only published content, only if user has matching subscription tier
- Write: Prohibited (admin/server only)

### subscriptions/{subscriptionId}

Subscription tracking document (created/updated by Worker).

```typescript
interface SubscriptionRecord {
  uid: string; // User ID
  tier: "basic" | "premium"; // Plan tier
  status: "pending" | "active" | "halted" | "cancelled" | "expired";
  provider: "razorpay"; // Payment provider
  planId: string; // Razorpay plan ID
  razorpayCustomerId?: string | null;
  razorpayStatus: string; // Razorpay subscription status
  currentStart?: Timestamp | null;
  currentEnd?: Timestamp | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  cancelRequestedAt?: Timestamp | null;
}
```

**Firestore Rules**:

- Read: Only subscription owner can read
- Write: Prohibited (Worker/service account only)

### razorpayEvents/{eventId}

Webhook event audit trail (created by Worker).

```typescript
interface WebhookEvent {
  event: string; // Event type (e.g., subscription.activated)
  subscriptionId: string; // Razorpay subscription ID
  uid: string; // User ID
  processed: boolean; // Was this event processed?
  processedAt: Timestamp;
}
```

**Firestore Rules**:

- Read/Write: Prohibited (audit-only)

## Authentication Flow Diagrams

### Registration Flow

```
User visits /register
    ↓
User enters name, email, password
    ↓
Click "Create Account"
    ↓
authService.register()
    ├─ createUserWithEmailAndPassword() → Firebase Auth
    ├─ updateProfile() → Firebase Auth displayName
    └─ setDoc() → Firestore users/{uid}
        {
          uid, email, name, role: 'user',
          subscription: { tier: 'free', status: 'free' },
          razorpayCustomerId: null,
          createdAt, lastLoginAt
        }
    ↓
Redirect to /dashboard (or returnUrl from query param)
```

### Login Flow

```
User visits /login
    ↓
User enters email, password
    ↓
Click "Sign In"
    ↓
authService.signInWithEmail()
    ├─ signInWithEmailAndPassword() → Firebase Auth
    ├─ onAuthStateChanged() detects new user
    └─ ensureUserProfile() updates lastLoginAt
    ↓
Firebase SDK sets local session (browserLocalPersistence)
    ↓
authGuard sees isAuthenticated() = true
    ↓
Redirect to /dashboard (or returnUrl from query param)
```

### Subscription Flow

```
User on /pricing or /subscription clicks "Start Basic"
    ↓
subscriptionService.startCheckout('basic')
    ├─ await subscriptionService.createSubscription('basic')
    │   └─ Worker POST /create-subscription
    │       ├─ Validates Firebase token
    │       ├─ Creates Razorpay subscription
    │       ├─ Updates Firestore users/{uid}
    │       │   { subscription: { tier: 'basic', status: 'pending' } }
    │       └─ Returns Razorpay checkout data
    │
    ├─ Load Razorpay checkout script
    │
    └─ new Razorpay({
         key: response.keyId,
         subscription_id: response.subscriptionId,
         handler: (razorpayResponse) => {
           subscriptionService.refreshSubscriptionStatus()
         }
       }).open()
    ↓
User in Razorpay modal enters test card (4111 1111 1111 1111)
    ↓
Razorpay processes payment
    ↓
Razorpay sends webhook: POST Worker /razorpay/webhook
    event: 'subscription.activated'
    ↓
Worker:
    ├─ Validates signature with RAZORPAY_WEBHOOK_SECRET
    ├─ Checks for duplicate via razorpayEvents collection
    ├─ Updates Firestore users/{uid}
    │   { subscription: { tier: 'basic', status: 'active', currentPeriodEnd } }
    └─ Records event in razorpayEvents/{eventId}
    ↓
Frontend detects subscription.status changed to 'active'
    ↓
Dashboard shows "Basic" tier with "active" status
    ↓
authService.isSubscribed() returns true
    ↓
User can now access /premium routes
```

### Cancellation Flow

```
User clicks "Cancel Subscription" on /subscription or /dashboard
    ↓
subscriptionService.cancelSubscription()
    ├─ Worker POST /cancel-subscription
    │   ├─ Validates Firebase token
    │   ├─ Calls Razorpay API to cancel subscription
    │   └─ Records cancellation in Firestore subscriptions/{id}
    │       { cancelRequestedAt, updatedAt }
    │
    └─ subscriptionService.refreshSubscriptionStatus()
        └─ Worker GET /subscription-status
           └─ Returns current subscription state
    ↓
Razorpay sends webhook: POST Worker /razorpay/webhook
    event: 'subscription.cancelled'
    ↓
Worker updates Firestore users/{uid}
    { subscription: { tier: 'free', status: 'cancelled' } }
    ↓
Dashboard shows tier = "free", status = "cancelled"
    ↓
authService.isSubscribed() returns false
    ↓
/premium routes redirect to paywall
```

## Error Handling

### Frontend Error Codes

| Error               | Cause                | Resolution                        |
| ------------------- | -------------------- | --------------------------------- |
| `PERMISSION_DENIED` | Firestore rules      | Check user subscription tier      |
| `UNAUTHENTICATED`   | No valid ID token    | User needs to sign in             |
| `INVALID_ARGUMENT`  | Bad tier selection   | Only 'basic' or 'premium' allowed |
| `401 Unauthorized`  | Worker auth failed   | Check Firebase token              |
| `400 Bad Request`   | Invalid subscription | No active Razorpay subscription   |

### Worker Error Codes

| Code  | Endpoint             | Cause                  | Response                                               |
| ----- | -------------------- | ---------------------- | ------------------------------------------------------ |
| `401` | Any                  | Invalid Firebase token | `{ message: "Sign in is required." }`                  |
| `400` | /create-subscription | Invalid tier           | `{ message: "Choose a valid subscription tier." }`     |
| `400` | /cancel-subscription | No subscription        | `{ message: "No Razorpay subscription is linked..." }` |
| `401` | /razorpay/webhook    | Invalid signature      | `{ message: "Invalid Razorpay webhook signature." }`   |
| `400` | /razorpay/webhook    | Missing event ID       | `{ message: "Missing Razorpay event id." }`            |
| `200` | /razorpay/webhook    | Duplicate event        | `{ ok: true, duplicate: true }`                        |

## Rate Limits

| Service            | Limit                    | Impact                             |
| ------------------ | ------------------------ | ---------------------------------- |
| Cloudflare Workers | 100,000 req/day (free)   | Subscription operations            |
| Firestore          | 50K reads/day (free)     | Premium content queries            |
| Firestore          | 20K writes/day (free)    | Webhook updates                    |
| Firebase Auth      | 10K signups/month (free) | User registration                  |
| Razorpay           | 100 req/sec              | Subscription creation/cancellation |

## Testing with Razorpay Test Credentials

### Test Card Numbers

| Card                  | Expected Outcome              |
| --------------------- | ----------------------------- |
| `4111 1111 1111 1111` | ✅ Success                    |
| `4222 2222 2222 2200` | ❌ Fails (insufficient funds) |
| `4000 0000 0000 0002` | ❌ Fails (card declined)      |

All test cards use any future expiry date and any 3-digit CVV.

### Test Mode vs Live Mode

**Test Mode**:

- Razorpay API: Use `rzp_test_*` keys
- No real charges
- Instant webhook callbacks
- Test plans: Use `plan_test_*` IDs

**Live Mode**:

- Razorpay API: Use `rzp_live_*` keys
- Real charges to customer cards
- Webhooks may take 1-2 seconds
- Live plans: Use `plan_live_*` IDs
