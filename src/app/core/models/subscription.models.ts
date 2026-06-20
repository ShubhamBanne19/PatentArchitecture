import { Timestamp } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'basic' | 'premium';
export type SubscriptionStatus = 'free' | 'pending' | 'active' | 'halted' | 'cancelled' | 'expired';
export type UserRole = 'user';
export type PremiumContentType = 'chapter-extra' | 'prompt-pack' | 'download' | 'update' | 'checklist';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  razorpaySubscriptionId?: string | null;
  currentPeriodEnd?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  subscription: UserSubscription;
  razorpayCustomerId?: string | null;
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

export interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month';
  description: string;
  features: string[];
}

export interface RazorpaySubscriptionResponse {
  keyId: string;
  subscriptionId: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  name: string;
  description: string;
  amount: number;
  currency: 'INR';
  user: {
    name: string;
    email: string;
  };
}

export interface WorkerSubscriptionStatusResponse {
  subscription: UserSubscription;
}
