import { firebaseConfig } from './firebase.config';

export const environment = {
  production: false,
  firebase: firebaseConfig,
  workerApiBaseUrl: 'http://localhost:8787',
  razorpayCheckoutUrl: 'https://checkout.razorpay.com/v1/checkout.js',
};
