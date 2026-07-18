#!/usr/bin/env node
/**
 * Grant (or revoke) Full Access for a buyer — the safe replacement for
 * hand-editing users/{uid}.subscription in the Firebase console.
 *
 * Why a script: the app AND firestore.rules both only recognise the literal
 * values tier='basic'|'premium', status='active'. A single typo in a console
 * edit silently locks a paying customer out. This script only writes valid
 * values, and also marks the buyer's accessRequests/{uid} claim as reviewed.
 *
 * One-time setup:
 *   1. npm install --no-save firebase-admin
 *   2. Download a service-account key: Firebase Console -> Project Settings
 *      -> Service accounts -> Generate new private key
 *   3. set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccount.json
 *
 * Usage:
 *   node tools/grant-access.mjs grant  <email-or-uid> [basic|premium]  (default: premium)
 *   node tools/grant-access.mjs revoke <email-or-uid>
 *   node tools/grant-access.mjs status <email-or-uid>
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const [, , command, who, tierArg] = process.argv;
const VALID_TIERS = ['basic', 'premium'];

if (!['grant', 'revoke', 'status'].includes(command ?? '') || !who) {
  console.error('Usage: node tools/grant-access.mjs <grant|revoke|status> <email-or-uid> [basic|premium]');
  process.exit(1);
}

const tier = tierArg ?? 'premium';
if (command === 'grant' && !VALID_TIERS.includes(tier)) {
  console.error(`Invalid tier "${tier}". Valid tiers: ${VALID_TIERS.join(', ')}`);
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId: 'patent-architect' });
const auth = getAuth();
const db = getFirestore();

async function resolveUid(emailOrUid) {
  if (!emailOrUid.includes('@')) return emailOrUid;
  const user = await auth.getUserByEmail(emailOrUid);
  return user.uid;
}

const uid = await resolveUid(who);
const userRef = db.doc(`users/${uid}`);
const requestRef = db.doc(`accessRequests/${uid}`);

const snapshot = await userRef.get();
if (!snapshot.exists) {
  console.error(`No profile at users/${uid} — has this user ever signed in?`);
  process.exit(1);
}

if (command === 'status') {
  const data = snapshot.data();
  console.log(`users/${uid}`);
  console.log(`  email:        ${data.email}`);
  console.log(`  name:         ${data.name}`);
  console.log(`  subscription: ${JSON.stringify(data.subscription)}`);
  const request = await requestRef.get();
  console.log(request.exists
    ? `  accessRequest: ${JSON.stringify(request.data())}`
    : '  accessRequest: none');
  process.exit(0);
}

const granting = command === 'grant';
await userRef.update({
  'subscription.tier': granting ? tier : 'free',
  'subscription.status': granting ? 'active' : 'free',
  'subscription.updatedAt': FieldValue.serverTimestamp(),
});

const request = await requestRef.get();
if (request.exists) {
  await requestRef.update({
    status: granting ? 'approved' : 'rejected',
    reviewedAt: FieldValue.serverTimestamp(),
  });
}

console.log(granting
  ? `✔ Granted ${tier} access to ${who} (users/${uid}). Their premium library unlocks live.`
  : `✔ Revoked access for ${who} (users/${uid}).`);
