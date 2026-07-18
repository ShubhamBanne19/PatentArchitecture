# Manual Access — Operator Runbook

The Patent Architect uses a **manual, one-time-payment** model (no Razorpay/subscription).
A buyer pays you out-of-band, submits a payment reference in the app, and **you grant
access by hand** in the Firebase console. This is the runbook for granting/rejecting access.

## How it works

```
User logs in (free)
   → /get-access shows your UPI + bank details (from src/app/core/config/purchase.config.ts)
   → user pays you, then submits their payment reference
   → creates accessRequests/{uid} with status: "pending"
        │
        ▼
YOU verify the payment and grant access in the Firebase console
   → users/{uid}.subscription.status = "active", tier = "premium"
   → accessRequests/{uid}.status = "approved"
        │
        ▼
The user's app unlocks premium live (no logout needed)
```

Access is **lifetime** — there is no expiry. Granting `tier: "premium"` unlocks **all**
premium content (premium readers can read both `basic` and `premium` content).

## One-time setup

1. **Fill in your payment details.** Edit [src/app/core/config/purchase.config.ts](src/app/core/config/purchase.config.ts):
   `accessProduct.priceInr`, `paymentDetails.upiId`, the `bank` block, and `supportEmail`.
   (Optional) drop a UPI QR image at `src/assets/upi-qr.png` and set `upiQrAssetPath: 'assets/upi-qr.png'`.
2. **Deploy the Firestore rules** (adds the `accessRequests` collection permissions):
   ```bash
   firebase deploy --only firestore:rules
   ```

## Granting access (per request)

**Use the grant script** — the app and firestore.rules only recognise the literal
values `tier: "basic" | "premium"` and `status: "active"`; one typo in a console
edit silently locks a paying customer out. The script can only write valid values
and updates both documents in one go.

One-time script setup (see the header of [tools/grant-access.mjs](tools/grant-access.mjs)):

```bash
npm install --no-save firebase-admin
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccount.json
```

Per request:

1. Firebase Console → **Firestore Database** → collection **`accessRequests`**.
   Open a document with `status: "pending"`. Note its **`reference`**, **`amount`**,
   and **`email`**. (Or run `node tools/grant-access.mjs status <email>`.)
2. **Verify the payment** — match `reference` against your UPI/bank statement for `amount`.
3. If valid:
   ```bash
   node tools/grant-access.mjs grant buyer@example.com
   ```
   This sets `users/{uid}.subscription` to `{ tier: "premium", status: "active" }` and
   marks `accessRequests/{uid}` as `approved` with a `reviewedAt` timestamp.

The buyer's app updates automatically (it live-watches their profile).

<details>
<summary>Manual console fallback (only if you can't run the script)</summary>

The accessRequests doc id **is the user's uid**. Open **`users/{uid}`** and set
`subscription.status` → `active`, `subscription.tier` → `premium` (exact lowercase
spelling — anything else is treated as not subscribed). Leave `currentPeriodEnd`
null (lifetime). Then in **`accessRequests/{uid}`** set `status` → `approved` and
`reviewedAt` → now.

</details>

## Rejecting a request

In **`accessRequests/{uid}`** set `status` → `rejected` (and `reviewedAt`). Do **not** touch
the user doc. The user sees a "couldn't verify" notice on `/get-access` and can resubmit.

## Revoking access (refund / chargeback)

```bash
node tools/grant-access.mjs revoke buyer@example.com
```

(Console fallback: in **`users/{uid}`** set `subscription.status` → `free` and
`subscription.tier` → `free`.) Premium locks again immediately.

## Notes & guardrails

- Users **cannot** grant themselves access. Firestore rules ([firestore.rules](firestore.rules))
  block clients from writing `users/{uid}.subscription`, and only allow them to write their own
  `accessRequests/{uid}` with `status: "pending"`. All grants happen via the console (which
  bypasses rules with admin privileges).
- The grant script (plus the Firestore console as fallback) is the only "admin" surface for
  now. A self-serve admin approval page is a planned Phase-2 enhancement.
- The old Razorpay Worker has been removed from the repo. If a `worker/wrangler.toml` file
  still exists locally it may contain old Razorpay keys — rotate/delete it.
