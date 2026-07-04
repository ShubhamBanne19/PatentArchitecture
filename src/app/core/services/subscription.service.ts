import { Injectable, effect, inject, signal } from '@angular/core';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { FirebaseCoreService } from '../firebase/firebase-core.service';
import { AccessRequest, PaymentMethod } from '../models/subscription.models';
import { accessProduct, paymentDetails } from '../config/purchase.config';

/**
 * Manual, one-time "Full Access" purchase flow.
 *
 * There is no automated payment gateway: the buyer pays out-of-band using the
 * static UPI / bank details, submits their payment reference here (stored at
 * accessRequests/{uid}), and an admin grants access in the Firebase console.
 * Access itself is gated by users/{uid}.subscription via AuthService.isSubscribed().
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private auth = inject(AuthService);
  private firebase = inject(FirebaseCoreService);

  /** Public product + payment info shown on the pricing / get-access pages. */
  readonly product = accessProduct;
  readonly payment = paymentDetails;

  /** The signed-in user's current access request (live), or null. */
  readonly myRequest = signal<AccessRequest | null>(null);

  private unsubscribe?: () => void;

  constructor() {
    // Follow the signed-in user and stream their access request live.
    effect(
      () => {
        const user = this.auth.firebaseUser();
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        this.myRequest.set(null);

        if (!user) {
          return;
        }

        this.unsubscribe = onSnapshot(
          doc(this.firebase.firestore, 'accessRequests', user.uid),
          snapshot => this.myRequest.set(snapshot.exists() ? (snapshot.data() as AccessRequest) : null),
          () => this.myRequest.set(null)
        );
      },
      { allowSignalWrites: true }
    );
  }

  /** Record a manual payment claim for the current user (status: pending). */
  async submitAccessRequest(input: { method: PaymentMethod; reference: string; note?: string }): Promise<void> {
    const user = this.auth.firebaseUser();
    if (!user) {
      throw new Error('You must be signed in to submit a payment.');
    }

    const reference = input.reference.trim();
    if (!reference) {
      throw new Error('Enter the payment reference / transaction id.');
    }

    const request: AccessRequest = {
      uid: user.uid,
      email: user.email ?? '',
      name: user.displayName ?? user.email?.split('@')[0] ?? 'Reader',
      amount: this.product.priceInr,
      method: input.method,
      reference,
      note: input.note?.trim() || null,
      status: 'pending',
    };

    await setDoc(doc(this.firebase.firestore, 'accessRequests', user.uid), {
      ...request,
      createdAt: serverTimestamp(),
      reviewedAt: null,
    });
  }
}
