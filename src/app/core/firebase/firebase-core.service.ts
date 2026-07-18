import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseCoreService {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly firestore: Firestore;
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);

    // browserLocalPersistence rejects during prerendering (no IndexedDB) and
    // an unhandled rejection kills the prerender worker.
    if (this.isBrowser) {
      void setPersistence(this.auth, browserLocalPersistence);
    }
  }
}
