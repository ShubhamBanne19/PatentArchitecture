import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import {
  PricingPlan,
  RazorpaySubscriptionResponse,
  SubscriptionTier,
  WorkerSubscriptionStatusResponse,
} from '../models/subscription.models';
import { environment } from '../../../environments/environment';

interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: unknown) => void;
  prefill: {
    name: string;
    email: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayCheckout {
  open(): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private auth = inject(AuthService);

  readonly plans: PricingPlan[] = [
    {
      tier: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      description: 'Public book information, public companion routes, and launch updates.',
      features: ['Public companion hub', 'Fee schedules', 'Errata and public updates'],
    },
    {
      tier: 'basic',
      name: 'Basic',
      price: 199,
      interval: 'month',
      description: 'Premium companion material for serious readers and students.',
      features: ['Premium chapter extras', 'Practice checklists', 'Subscriber-only updates'],
    },
    {
      tier: 'premium',
      name: 'Premium',
      price: 499,
      interval: 'month',
      description: 'Advanced practitioner resources and deeper AI/IP strategy material.',
      features: ['Everything in Basic', 'Advanced prompt packs', 'Premium downloads and templates'],
    },
  ];

  async startCheckout(tier: Exclude<SubscriptionTier, 'free'>): Promise<void> {
    const checkout = await this.createSubscription(tier);
    await this.loadRazorpayCheckout();

    if (!window.Razorpay) {
      throw new Error('Razorpay Checkout failed to load.');
    }

    const razorpay = new window.Razorpay({
      key: checkout.keyId,
      subscription_id: checkout.subscriptionId,
      name: checkout.name,
      description: checkout.description,
      handler: () => {
        void this.refreshSubscriptionStatus();
      },
      prefill: checkout.user,
      notes: {
        tier: checkout.tier,
      },
      theme: {
        color: '#C9A961',
      },
    });

    razorpay.open();
  }

  async cancelSubscription(): Promise<void> {
    await this.request('/cancel-subscription', { method: 'POST' });
    await this.refreshSubscriptionStatus();
  }

  async refreshSubscriptionStatus(): Promise<WorkerSubscriptionStatusResponse> {
    return this.request<WorkerSubscriptionStatusResponse>('/subscription-status', { method: 'GET' });
  }

  private async createSubscription(tier: Exclude<SubscriptionTier, 'free'>): Promise<RazorpaySubscriptionResponse> {
    return this.request<RazorpaySubscriptionResponse>('/create-subscription', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  }

  private async request<T = unknown>(path: string, init: RequestInit): Promise<T> {
    const token = await this.auth.getIdToken();
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${environment.workerApiBaseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Subscription request failed.' }));
      throw new Error(error.message ?? 'Subscription request failed.');
    }

    return response.json() as Promise<T>;
  }

  private loadRazorpayCheckout(): Promise<void> {
    if (window.Razorpay) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${environment.razorpayCheckoutUrl}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Razorpay Checkout failed to load.')));
        return;
      }

      const script = document.createElement('script');
      script.src = environment.razorpayCheckoutUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay Checkout failed to load.'));
      document.head.appendChild(script);
    });
  }
}
