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
import { PremiumContent } from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class PremiumContentService {
  private firebase = inject(FirebaseCoreService);

  readonly items = signal<PremiumContent[]>([]);
  readonly loading = signal(false);

  async loadPublishedContent(): Promise<PremiumContent[]> {
    this.loading.set(true);
    try {
      const premiumQuery = query(
        collection(this.firebase.firestore, 'premiumContent'),
        where('published', '==', true),
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
