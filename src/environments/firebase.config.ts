import { FirebaseOptions } from 'firebase/app';

/**
 * Firebase Web SDK config.
 *
 * These values are public by design: they ship inside the JS bundle of every
 * deployed build and identify the project, they don't grant access. All access
 * control lives in firestore.rules and Firebase Auth. This file is committed so
 * that CI and fresh clones build without any extra setup.
 *
 * Values come from: Firebase Console -> Project Settings -> General -> Web app.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyDgBkCsyEix58TqijFQ9RFx-CQLcta3Lus',
  authDomain: 'patent-architect.firebaseapp.com',
  projectId: 'patent-architect',
  storageBucket: 'patent-architect.firebasestorage.app',
  messagingSenderId: '318772125486',
  appId: '1:318772125486:web:8d06a6077c1a095d1724bf',
  measurementId: 'G-FCJMW4P1PH',
};

/**
 * App Check reCAPTCHA v3 site key (public — ships in the bundle, same trust
 * model as apiKey above). Leave as the placeholder to keep App Check off; the
 * app only calls initializeAppCheck() when this is a real key.
 *
 * To turn App Check on:
 *   1. Firebase Console -> Build -> App Check -> Apps -> register this web
 *      app with the "reCAPTCHA v3" provider. Copy the site key here.
 *   2. Deploy, then browse the live site and confirm no console errors and
 *      that login/Firestore reads still work (App Check starts in
 *      *unenforced* mode — nothing is blocked yet).
 *   3. Only after confirming real traffic is passing (Console -> App Check
 *      shows verified requests), flip Firestore/Auth to "Enforce" in
 *      App Check -> APIs. Enforcing before verifying will lock out real users.
 */
export const appCheckSiteKey = 'REPLACE_WITH_RECAPTCHA_V3_SITE_KEY';
