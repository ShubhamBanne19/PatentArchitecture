import { FirebaseOptions } from 'firebase/app';

/**
 * TEMPLATE for the Firebase Web SDK config.
 *
 * Setup:
 *   1. Copy this file to `firebase.config.ts` (same folder).
 *   2. Replace every placeholder with your real values from:
 *      Firebase Console -> Project Settings -> General -> Your apps -> Web app.
 *
 * `firebase.config.ts` is gitignored, so your real values are never committed.
 *
 * NOTE: These web config values (including apiKey) are shipped to the browser
 * and are NOT secrets. Real security is enforced by:
 *   - Google Cloud Console API key restrictions (HTTP referrers + API list)
 *   - Firebase Auth "Authorized domains"
 *   - Firestore security rules
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
