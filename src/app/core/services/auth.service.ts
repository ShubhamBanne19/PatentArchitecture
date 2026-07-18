import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseCoreService } from '../firebase/firebase-core.service';
import { AppUser } from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private firebase = inject(FirebaseCoreService);
  private readySubject = new BehaviorSubject(false);
  private userSubject = new BehaviorSubject<AppUser | null>(null);
  private unsubscribeProfile?: () => void;
  /** In-flight register(): the auth listener waits for it so profile creation
   *  (with the chosen display name) isn't raced by ensureUserProfile. */
  private pendingRegistration?: Promise<void>;

  readonly ready$: Observable<boolean> = this.readySubject.asObservable();
  readonly user$: Observable<AppUser | null> = this.userSubject.asObservable();

  readonly firebaseUser = signal<User | null>(null);
  readonly profile = signal<AppUser | null>(null);
  readonly loading = signal(true);
  readonly isAuthenticated = computed(() => !!this.firebaseUser());
  readonly isSubscribed = computed(() => {
    // Must mirror hasActiveSubscription()/canReadPremium() in firestore.rules
    // exactly: the rules only recognise the literal tiers 'basic'|'premium',
    // so accepting anything else here would show a subscribed UI whose
    // Firestore reads are then denied.
    const subscription = this.profile()?.subscription;
    return subscription?.status === 'active'
      && (subscription.tier === 'basic' || subscription.tier === 'premium');
  });

  constructor() {
    if (!this.firebase.isBrowser) {
      // Prerender/SSR renders the signed-out state; auth resolves on the client.
      this.loading.set(false);
      this.readySubject.next(true);
      return;
    }

    onAuthStateChanged(this.firebase.auth, async user => {
      this.loading.set(true);
      this.readySubject.next(false);
      this.unsubscribeProfile?.();
      this.firebaseUser.set(user);
      this.profile.set(null);
      this.userSubject.next(null);

      if (!user) {
        this.loading.set(false);
        this.readySubject.next(true);
        return;
      }

      await this.pendingRegistration?.catch(() => undefined);
      await this.ensureUserProfile(user);
      this.watchUserProfile(user.uid);
    });
  }

  async register(name: string, email: string, password: string): Promise<void> {
    // Tracked so the onAuthStateChanged callback (which fires as soon as the
    // account exists, before the display name and profile doc are written)
    // waits instead of creating a second, name-less profile in parallel.
    this.pendingRegistration = (async () => {
      const credential = await createUserWithEmailAndPassword(this.firebase.auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await this.createUserProfile(credential.user, name);
    })();

    try {
      await this.pendingRegistration;
    } finally {
      this.pendingRegistration = undefined;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    // Profile upkeep happens in the onAuthStateChanged listener.
    await signInWithEmailAndPassword(this.firebase.auth, email, password);
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(this.firebase.auth, provider);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.firebase.auth, email);
  }

  async logout(): Promise<void> {
    await signOut(this.firebase.auth);
  }

  async updateDisplayName(name: string): Promise<void> {
    const user = this.firebase.auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to update your profile.');
    }

    await updateProfile(user, { displayName: name });
    await updateDoc(doc(this.firebase.firestore, 'users', user.uid), {
      name,
      email: user.email ?? '',
      lastLoginAt: serverTimestamp(),
    });
  }

  async getIdToken(forceRefresh = false): Promise<string> {
    const user = this.firebase.auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to continue.');
    }
    return user.getIdToken(forceRefresh);
  }

  private async ensureUserProfile(user: User): Promise<void> {
    const ref = doc(this.firebase.firestore, 'users', user.uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      await this.createUserProfile(user);
      return;
    }

    await updateDoc(ref, {
      email: user.email ?? '',
      name: user.displayName ?? user.email?.split('@')[0] ?? 'Reader',
      lastLoginAt: serverTimestamp(),
    });
  }

  private async createUserProfile(user: User, displayName?: string): Promise<void> {
    const ref = doc(this.firebase.firestore, 'users', user.uid);
    const profile: Omit<AppUser, 'createdAt' | 'lastLoginAt'> = {
      uid: user.uid,
      email: user.email ?? '',
      name: displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'Reader',
      role: 'user',
      subscription: {
        tier: 'free',
        status: 'free',
        currentPeriodEnd: null,
      },
    };

    await setDoc(ref, {
      ...profile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }

  private watchUserProfile(uid: string): void {
    this.unsubscribeProfile = onSnapshot(
      doc(this.firebase.firestore, 'users', uid),
      snapshot => {
        const profile = snapshot.exists() ? snapshot.data() as AppUser : null;
        this.profile.set(profile);
        this.userSubject.next(profile);
        this.loading.set(false);
        this.readySubject.next(true);
      },
      () => {
        this.loading.set(false);
        this.readySubject.next(true);
      }
    );
  }
}
