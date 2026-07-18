/**
 * Canonical public origin of the deployed site.
 *
 * Single source of truth for every absolute URL the app emits at runtime
 * (canonical tags, Open Graph, JSON-LD). CI deploys to Firebase Hosting, so
 * this is the Firebase Hosting URL. If a custom domain is connected later,
 * change it HERE and also update the three static files that must hard-code
 * the origin: src/index.html (og:image/twitter:image), src/sitemap.xml, and
 * src/robots.txt. `grep -rn "web.app" src/` finds every spot.
 *
 * IMPORTANT: lock this down BEFORE the book goes to print. The QR codes in the
 * printed book resolve against this origin forever.
 */
export const SITE_BASE_URL = 'https://patent-architect.web.app';
