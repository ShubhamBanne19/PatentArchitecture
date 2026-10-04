// Firestore security rules tests, run against the Firestore emulator.
//
// Requires @firebase/rules-unit-testing (devDependency — run
// `npm install --save-dev @firebase/rules-unit-testing` once if node_modules
// doesn't have it yet).
//
// Run with:
//   npm run test:rules
// which wraps this in `firebase emulators:exec --only firestore`, so the
// emulator is started/stopped automatically and FIRESTORE_EMULATOR_HOST is
// set for us.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

const PROJECT_ID = 'patent-architect-rules-test';

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

test.after(async () => {
  await testEnv?.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

const freeProfile = (uid, overrides = {}) => ({
  uid,
  email: `${uid}@example.com`,
  name: 'Reader',
  role: 'user',
  subscription: { tier: 'free', status: 'free', currentPeriodEnd: null },
  createdAt: serverTimestamp(),
  lastLoginAt: serverTimestamp(),
  ...overrides,
});

// ─── Catch-all deny-by-default ─────────────────────────────────────────────

test('catch-all: undeclared collections are denied even to signed-in users', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(alice, 'secrets/anything')));
  await assertFails(setDoc(doc(alice, 'secrets/anything'), { x: 1 }));
});

// ─── users/{uid} ────────────────────────────────────────────────────────────

test('users: owner can create their own profile with the enforced free/user defaults', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(alice, 'users/alice'), freeProfile('alice')));
});

test('users: cannot create a profile for someone else', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'users/bob'), freeProfile('bob')));
});

test('users: cannot self-assign role=admin on create (privilege escalation)', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'users/alice'), freeProfile('alice', { role: 'admin' })));
});

test('users: cannot self-assign a paid subscription tier on create', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'users/alice'), freeProfile('alice', {
    subscription: { tier: 'premium', status: 'active', currentPeriodEnd: null },
  })));
});

test('users: cannot create with an unexpected extra field', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'users/alice'), freeProfile('alice', { isAdmin: true })));
});

test('users: another signed-in user cannot read your profile', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice'));
  });
  const bob = testEnv.authenticatedContext('bob').firestore();
  await assertFails(getDoc(doc(bob, 'users/alice')));
});

test('users: owner can update their own name/email', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice'));
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(updateDoc(doc(alice, 'users/alice'), {
    name: 'New Name',
    email: 'alice@example.com',
    lastLoginAt: serverTimestamp(),
  }));
});

test('users: cannot escalate role via update', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice'));
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(updateDoc(doc(alice, 'users/alice'), { role: 'admin' }));
});

test('users: cannot grant own subscription via update', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice'));
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(updateDoc(doc(alice, 'users/alice'), {
    'subscription.tier': 'premium',
    'subscription.status': 'active',
  }));
});

test('users: cannot add a new arbitrary field via update (field pollution)', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice'));
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(updateDoc(doc(alice, 'users/alice'), { isAdmin: true }));
});

test('users: delete is always denied, even for the owner', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice'));
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(deleteDoc(doc(alice, 'users/alice')));
});

// ─── accessRequests/{uid} ───────────────────────────────────────────────────

const pendingRequest = (uid, overrides = {}) => ({
  uid,
  email: `${uid}@example.com`,
  name: 'Reader',
  amount: 499,
  method: 'upi',
  reference: 'TXN123',
  note: null,
  status: 'pending',
  createdAt: serverTimestamp(),
  reviewedAt: null,
  ...overrides,
});

test('accessRequests: owner can submit a pending claim', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(alice, 'accessRequests/alice'), pendingRequest('alice')));
});

test('accessRequests: cannot self-approve', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'accessRequests/alice'), pendingRequest('alice', { status: 'approved' })));
});

test('accessRequests: cannot set reviewedAt yourself on create', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'accessRequests/alice'), pendingRequest('alice', { reviewedAt: serverTimestamp() })));
});

test('accessRequests: cannot clobber an admin-reviewed request by resubmitting', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'accessRequests/alice'), pendingRequest('alice'));
    await updateDoc(doc(ctx.firestore(), 'accessRequests/alice'), {
      status: 'approved',
      reviewedAt: serverTimestamp(),
    });
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  // App always sends reviewedAt: null on resubmission — must be rejected now
  // that the admin has reviewed it, since reviewedAt no longer matches.
  await assertFails(setDoc(doc(alice, 'accessRequests/alice'), pendingRequest('alice')));
});

test('accessRequests: rejects an out-of-range amount', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'accessRequests/alice'), pendingRequest('alice', { amount: -5 })));
  await assertFails(setDoc(doc(alice, 'accessRequests/alice'), pendingRequest('alice', { amount: 50000000 })));
});

test('accessRequests: rejects an invalid payment method', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'accessRequests/alice'), pendingRequest('alice', { method: 'crypto' })));
});

test('accessRequests: rejects an unexpected extra field', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'accessRequests/alice'), { ...pendingRequest('alice'), promoCode: 'FREE' }));
});

// ─── premiumContent ─────────────────────────────────────────────────────────

test('premiumContent: client writes are always denied', async () => {
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice, 'premiumContent/chapter-1'), {
    published: true, accessLevel: 'basic',
  }));
});

test('premiumContent: active subscriber at the right tier can read published content', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice', {
      subscription: { tier: 'basic', status: 'active', currentPeriodEnd: null },
    }));
    await setDoc(doc(ctx.firestore(), 'premiumContent/chapter-1'), {
      published: true, accessLevel: 'basic', title: 'Extra',
    });
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(alice, 'premiumContent/chapter-1')));
});

test('premiumContent: free-tier user cannot read published premium content', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice'));
    await setDoc(doc(ctx.firestore(), 'premiumContent/chapter-1'), {
      published: true, accessLevel: 'basic', title: 'Extra',
    });
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(alice, 'premiumContent/chapter-1')));
});

test('premiumContent: basic subscriber cannot read premium-tier content', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice', {
      subscription: { tier: 'basic', status: 'active', currentPeriodEnd: null },
    }));
    await setDoc(doc(ctx.firestore(), 'premiumContent/chapter-1'), {
      published: true, accessLevel: 'premium', title: 'Extra',
    });
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(alice, 'premiumContent/chapter-1')));
});

test('premiumContent: unpublished content is unreadable even to a matching-tier subscriber', async () => {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/alice'), freeProfile('alice', {
      subscription: { tier: 'premium', status: 'active', currentPeriodEnd: null },
    }));
    await setDoc(doc(ctx.firestore(), 'premiumContent/chapter-1'), {
      published: false, accessLevel: 'premium', title: 'Draft',
    });
  });
  const alice = testEnv.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(alice, 'premiumContent/chapter-1')));
});

test('sanity: assert helpers behave as expected', () => {
  assert.equal(typeof assertSucceeds, 'function');
  assert.equal(typeof assertFails, 'function');
});
