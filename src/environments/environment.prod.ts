import { FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID',
};

export const environment = {
  production: true,
  firebase: firebaseConfig,
  workerApiBaseUrl: 'https://REPLACE_WITH_WORKER_SUBDOMAIN.workers.dev',
  razorpayCheckoutUrl: 'https://checkout.razorpay.com/v1/checkout.js',
};
