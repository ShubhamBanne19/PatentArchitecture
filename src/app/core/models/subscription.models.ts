import { Timestamp } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'basic' | 'premium';
export type SubscriptionStatus = 'free' | 'pending' | 'active' | 'halted' | 'cancelled' | 'expired';
export type UserRole = 'user';
export type PremiumContentType = 'chapter-extra' | 'prompt-pack' | 'download' | 'update' | 'checklist';
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'upi' | 'bank';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  subscription: UserSubscription;
  createdAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
}

export interface PremiumContent {
  id: string;
  chapterId: string;
  title: string;
  type: PremiumContentType;
  accessLevel: Exclude<SubscriptionTier, 'free'>;
  bodyMarkdown: string;
  published: boolean;
  updatedAt?: Timestamp | null;
}

/** One-time "Full Access" product shown on the pricing / get-access pages. */
export interface AccessProduct {
  name: string;
  priceInr: number;
  oneTime: boolean;
  description: string;
  features: string[];
}

export interface PaymentDetails {
  upiId: string;
  upiQrAssetPath: string | null;
  bank: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
  };
}

/**
 * A buyer's manual payment claim, stored at accessRequests/{uid}.
 * The admin verifies the reference against their UPI/bank statement and then
 * grants access by editing users/{uid}.subscription in the Firebase console.
 * A `pending` request never grants access on its own.
 */
export interface AccessRequest {
  uid: string;
  email: string;
  name: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  note?: string | null;
  status: AccessRequestStatus;
  createdAt?: Timestamp | null;
  reviewedAt?: Timestamp | null;
}
