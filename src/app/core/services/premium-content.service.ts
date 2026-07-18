import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { FirebaseCoreService } from '../firebase/firebase-core.service';
import { PremiumContent, SubscriptionTier } from '../models/subscription.models';

/** Access levels a subscriber of the given tier may read. Mirrors canReadPremium() in firestore.rules. */
function readableLevels(tier: SubscriptionTier | undefined): Array<'basic' | 'premium'> {
  switch (tier) {
    case 'premium': return ['basic', 'premium'];
    case 'basic': return ['basic'];
    default: return [];
  }
}

@Injectable({ providedIn: 'root' })
export class PremiumContentService {
  private firebase = inject(FirebaseCoreService);

  readonly items = signal<PremiumContent[]>([]);
  readonly loading = signal(false);

  async loadPublishedContent(tier: SubscriptionTier | undefined): Promise<PremiumContent[]> {
    const levels = readableLevels(tier);
    if (levels.length === 0) {
      this.items.set([]);
      return [];
    }

    this.loading.set(true);
    try {
      // The accessLevel constraint is required for the rules to accept this list
      // query: firestore.rules gates reads on resource.data.accessLevel, and
      // Firestore only allows a query when the rules are provable from the
      // query's own filters. Without it the whole query is permission-denied.
      const premiumQuery = query(
        collection(this.firebase.firestore, 'premiumContent'),
        where('published', '==', true),
        where('accessLevel', 'in', levels),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(premiumQuery);
      const items = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as PremiumContent));
      this.items.set(items);
      return items;
    } finally {
      this.loading.set(false);
    }
  }

  async getContent(id: string): Promise<PremiumContent | null> {
    const snapshot = await getDoc(doc(this.firebase.firestore, 'premiumContent', id));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as PremiumContent : null;
  }
}
