import { firebaseConfig } from './firebase.config';

export const environment = {
  production: true,
  firebase: firebaseConfig,
  workerApiBaseUrl: 'https://REPLACE_WITH_WORKER_SUBDOMAIN.workers.dev',
  razorpayCheckoutUrl: 'https://checkout.razorpay.com/v1/checkout.js',
};
