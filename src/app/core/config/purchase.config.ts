import { AccessProduct, PaymentDetails } from '../models/subscription.models';

/**
 * One-time "Full Access" purchase configuration.
 *
 * This is PUBLIC "pay here" information (it is shown to buyers), not secret —
 * it is safe to commit. Fill in your real UPI id and bank details below.
 *
 * Model: buy once -> lifetime premium access. A buyer pays out-of-band using
 * the details here, submits their payment reference on /get-access, and an
 * admin grants access in the Firebase console (see MANUAL_ACCESS.md).
 */
export const accessProduct: AccessProduct = {
  name: 'Full Access',
  priceInr: 499,
  oneTime: true,
  description: 'One-time payment unlocks every premium companion resource — forever.',
  features: [
    'All premium chapter extras',
    'Prompt packs, checklists and downloads',
    'Subscriber-only updates and errata',
    'Lifetime access — buy once, no renewals',
  ],
};

export const paymentDetails: PaymentDetails = {
  upiId: 'REPLACE_WITH_YOUR_UPI_ID@bank',
  // Optional: drop a QR image at src/assets/ and point to it, e.g. 'assets/upi-qr.png'.
  // Leave as null to hide the QR image and show only the UPI id.
  upiQrAssetPath: null,
  bank: {
    accountName: 'REPLACE_WITH_ACCOUNT_HOLDER_NAME',
    accountNumber: 'REPLACE_WITH_ACCOUNT_NUMBER',
    ifsc: 'REPLACE_WITH_IFSC',
    bankName: 'REPLACE_WITH_BANK_NAME',
    branch: 'REPLACE_WITH_BRANCH',
  },
};

export const supportEmail = 'REPLACE_WITH_SUPPORT_EMAIL@example.com';
