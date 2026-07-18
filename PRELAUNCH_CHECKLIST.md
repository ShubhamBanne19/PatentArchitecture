# Pre-Launch Checklist — The Patent Architect

Status legend: 🔴 blocks money or looks broken to visitors · 🟡 needed before "launch" ·
🟢 one-time console/housekeeping. Tick items off as you fill them in.

## 🔴 1. Payment details (revenue is blocked until these are real)

The `/get-access` and `/pricing` pages currently show literal `REPLACE_WITH_...` text.
Edit [src/app/core/config/purchase.config.ts](src/app/core/config/purchase.config.ts):

- [ ] `upiId` — your real UPI id (currently `REPLACE_WITH_YOUR_UPI_ID@bank`)
- [ ] `bank.accountName` / `accountNumber` / `ifsc` / `bankName` / `branch`
- [ ] `supportEmail` (currently `REPLACE_WITH_SUPPORT_EMAIL@example.com`)
- [ ] Confirm the price: `accessProduct.priceInr` is **₹499**
- [ ] *(Optional)* drop a UPI QR image at `src/assets/upi-qr.png` and set
      `upiQrAssetPath: 'assets/upi-qr.png'`

## 🔴 2. Missing image / download files (referenced but 404 today)

`src/assets/` contains no images at all yet. These paths are referenced in code:

- [ ] `src/assets/images/og-default.jpg` — **1200×630** social-share card
      (used by every page's Open Graph/Twitter meta; shares show a broken image until this exists)
- [ ] `src/assets/images/apple-touch-icon.png` — **180×180** home-screen icon
- [ ] `src/assets/downloads/patent-architect-sample-chapter.pdf` — the `/sample`
      page's lead magnet download

## 🔴 3. Contact / newsletter / sample forms (submissions go nowhere)

All three forms post to `https://formspree.io/f/YOUR_FORM_ID`. Create the form(s) at
formspree.io and replace the id in:

- [ ] [contact.component.ts](src/app/pages/contact/contact.component.ts) (~line 29)
- [ ] [sample.component.ts](src/app/pages/sample/sample.component.ts) (~line 69)
- [ ] [newsletter.component.ts](src/app/pages/newsletter/newsletter.component.ts) (~line 28)

## 🟡 4. Site config ([src/assets/content/site-config.json](src/assets/content/site-config.json))

- [ ] `amazonUrl` — currently points at the **amazon.in homepage**, not your product page
- [ ] `isLive` — flip to `true` the day the Amazon listing is live (switches all
      "Coming June 2026" buttons to "Buy on Amazon")
- [ ] `launchDate` / `launchDateDisplay` — currently "June 2026", which is already
      in the past; update to the real date

## 🟡 5. Content gaps

- [ ] **4 blog posts have no article file.** [index.json](src/assets/content/blog/index.json)
      declares 5 posts but only `india-innovation-paradox.md` exists. Write the markdown for
      (or temporarily remove from index.json): `ten-examiner-traps`,
      `ai-patent-tools-honest-assessment`, `section-3k-software-patents-india`,
      `building-patent-portfolio-startup`. When each lands, also add its route to
      `prerender-routes.txt` and `src/sitemap.xml`.
- [ ] **Premium content collection.** Add documents to the `premiumContent` collection in
      Firestore (fields: `chapterId`, `title`, `type`, `accessLevel: "basic"|"premium"`,
      `bodyMarkdown`, `published: true`, `updatedAt`) — the premium library is empty until then.
- [ ] **Testimonials/endorsements** ([testimonials.json](src/assets/content/testimonials.json)):
      confirm every quote is real and approved for publication with the person's name.
- [ ] Verify fee tables (`src/assets/content/fees/*.json`) and errata are current as of launch.

## 🟢 6. Firebase console (one-time)

- [ ] **Authentication → Sign-in method**: enable Email/Password **and** Google
- [ ] **Authentication → Settings → Authorized domains**: `patent-architect.web.app`
      (present by default) + your custom domain when you add one
- [ ] **Restrict the web API key** — steps in
      [DEPLOYMENT_SETUP.md §1.3.1](DEPLOYMENT_SETUP.md) (referrer + API restrictions)
- [ ] **GitHub secret `FIREBASE_SERVICE_ACCOUNT`** so CI deploys work
      ([DEPLOYMENT_SETUP.md §2.1](DEPLOYMENT_SETUP.md))
- [ ] Grant-script setup for approving buyers: `npm i --no-save firebase-admin` +
      service-account key (see [MANUAL_ACCESS.md](MANUAL_ACCESS.md))

## 🟢 7. Before the book goes to print (PERMANENT decisions)

- [ ] **Final domain.** QR codes freeze whatever you print. If you want
      `thepatentarchitect.com` instead of `patent-architect.web.app`, buy and connect it
      **before** printing, then update the origin in **all four** places and rebuild:
      `SITE_BASE_URL` in [site.config.ts](src/app/core/config/site.config.ts),
      the `og:image`/`twitter:image` URLs in `src/index.html`, `src/sitemap.xml`,
      and `src/robots.txt`. (Verify afterwards: `grep -rn "web.app" src/` should return nothing.)
- [ ] Test-scan every chapter QR code against the live site (all 19 `/companion/chapter-NN`).

## 🟢 8. Housekeeping

- [ ] `worker/wrangler.toml` still exists locally (untracked) — it may hold old Razorpay
      keys; save/rotate what you need, then delete it.
- [ ] Commit & push — CI is set up to build and deploy on `main`.
- [ ] After changing any of the above, redeploy: `npm run build && npx firebase-tools deploy --only hosting`
