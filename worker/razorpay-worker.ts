export interface Env {
  ALLOWED_ORIGIN: string;
  BASIC_PLAN_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_WEB_API_KEY: string;
  PREMIUM_PLAN_ID: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
}

type PaidTier = 'basic' | 'premium';
type SubscriptionStatus = 'free' | 'pending' | 'active' | 'halted' | 'cancelled' | 'expired';

interface FirebaseUser {
  uid: string;
  email: string;
  name: string;
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { stringValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface TimestampMarker {
  __timestamp: string;
}

interface RazorpaySubscription {
  id: string;
  plan_id: string;
  customer_id?: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  notes?: Record<string, string> | Array<unknown>;
}

let cachedGoogleToken: { token: string; expiresAt: number } | null = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/health') {
        return json(request, env, { ok: true });
      }

      if (url.pathname === '/create-subscription' && request.method === 'POST') {
        return createSubscription(request, env);
      }

      if (url.pathname === '/cancel-subscription' && request.method === 'POST') {
        return cancelSubscription(request, env);
      }

      if (url.pathname === '/subscription-status' && request.method === 'GET') {
        return subscriptionStatus(request, env);
      }

      if (url.pathname === '/razorpay/webhook' && request.method === 'POST') {
        return handleWebhook(request, env);
      }

      throw new HttpError(404, 'Endpoint not found.');
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Unexpected server error.';
      return json(request, env, { message }, { status });
    }
  },
};

async function createSubscription(request: Request, env: Env): Promise<Response> {
  const user = await requireFirebaseUser(request, env);
  const body = await request.json().catch(() => null) as { tier?: PaidTier } | null;
  const tier = body?.tier;

  if (tier !== 'basic' && tier !== 'premium') {
    throw new HttpError(400, 'Choose a valid subscription tier.');
  }

  await ensureUserDocument(env, user);

  const planId = tier === 'basic' ? env.BASIC_PLAN_ID : env.PREMIUM_PLAN_ID;
  const amount = tier === 'basic' ? 19900 : 49900;
  const subscription = await razorpayRequest<RazorpaySubscription>(env, '/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        uid: user.uid,
        tier,
        email: user.email,
      },
    }),
  });

  await patchDocument(env, `users/${user.uid}`, {
    subscription: {
      tier,
      status: 'pending',
      razorpaySubscriptionId: subscription.id,
      currentPeriodEnd: null,
      updatedAt: timestamp(),
    },
    razorpayCustomerId: subscription.customer_id ?? null,
  }, ['subscription', 'razorpayCustomerId']);

  await patchDocument(env, `subscriptions/${subscription.id}`, {
    uid: user.uid,
    tier,
    status: 'pending',
    provider: 'razorpay',
    planId,
    razorpayCustomerId: subscription.customer_id ?? null,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  });

  return json(request, env, {
    keyId: env.RAZORPAY_KEY_ID,
    subscriptionId: subscription.id,
    tier,
    name: 'The Patent Architect',
    description: `${capitalize(tier)} premium companion subscription`,
    amount,
    currency: 'INR',
    user: {
      name: user.name,
      email: user.email,
    },
  });
}

async function cancelSubscription(request: Request, env: Env): Promise<Response> {
  const user = await requireFirebaseUser(request, env);
  const userDoc = await getDocument(env, `users/${user.uid}`);
  const profile = userDoc ? fromFirestoreDocument(userDoc) as Record<string, unknown> : null;
  const subscription = profile?.['subscription'] as Record<string, unknown> | undefined;
  const subscriptionId = subscription?.['razorpaySubscriptionId'];

  if (typeof subscriptionId !== 'string' || !subscriptionId) {
    throw new HttpError(400, 'No Razorpay subscription is linked to this account.');
  }

  await razorpayRequest(env, `/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancel_at_cycle_end: 0 }),
  });

  await patchDocument(env, `subscriptions/${subscriptionId}`, {
    cancelRequestedAt: timestamp(),
    updatedAt: timestamp(),
  }, ['cancelRequestedAt', 'updatedAt']);

  return json(request, env, { ok: true });
}

async function subscriptionStatus(request: Request, env: Env): Promise<Response> {
  const user = await requireFirebaseUser(request, env);
  const userDoc = await getDocument(env, `users/${user.uid}`);
  const profile = userDoc ? fromFirestoreDocument(userDoc) as Record<string, unknown> : null;

  return json(request, env, {
    subscription: profile?.['subscription'] ?? {
      tier: 'free',
      status: 'free',
      razorpaySubscriptionId: null,
      currentPeriodEnd: null,
    },
  });
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('X-Razorpay-Signature');
  const eventId = request.headers.get('x-razorpay-event-id') ?? request.headers.get('X-Razorpay-Event-Id');
  const rawBody = await request.text();

  if (!signature || !await verifyRazorpaySignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
    throw new HttpError(401, 'Invalid Razorpay webhook signature.');
  }

  if (!eventId) {
    throw new HttpError(400, 'Missing Razorpay event id.');
  }

  const existingEvent = await getDocument(env, `razorpayEvents/${eventId}`);
  if (existingEvent) {
    return json(request, env, { ok: true, duplicate: true });
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      subscription?: { entity?: RazorpaySubscription };
    };
  };
  const subscription = event.payload?.subscription?.entity;

  if (!event.event || !subscription?.id) {
    throw new HttpError(400, 'Unsupported Razorpay webhook payload.');
  }

  const existingSubscription = await getDocument(env, `subscriptions/${subscription.id}`);
  const existing = existingSubscription
    ? fromFirestoreDocument(existingSubscription) as Record<string, unknown>
    : {};
  const notes = normalizeNotes(subscription.notes);
  const uid = notes['uid'] ?? existing['uid'];

  if (typeof uid !== 'string' || !uid) {
    throw new HttpError(400, 'Webhook subscription is missing a user mapping.');
  }

  const mapped = mapWebhookToSubscription(event.event, subscription, env, existing, notes);
  if (mapped) {
    await patchDocument(env, `users/${uid}`, {
      subscription: {
        tier: mapped.tierForUser,
        status: mapped.status,
        razorpaySubscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_end ? timestampFromSeconds(subscription.current_end) : null,
        updatedAt: timestamp(),
      },
      razorpayCustomerId: subscription.customer_id ?? null,
    }, ['subscription', 'razorpayCustomerId']);

    await patchDocument(env, `subscriptions/${subscription.id}`, {
      uid,
      tier: mapped.paidTier,
      status: mapped.status,
      provider: 'razorpay',
      planId: subscription.plan_id,
      razorpayCustomerId: subscription.customer_id ?? null,
      razorpayStatus: subscription.status,
      currentStart: subscription.current_start ? timestampFromSeconds(subscription.current_start) : null,
      currentEnd: subscription.current_end ? timestampFromSeconds(subscription.current_end) : null,
      updatedAt: timestamp(),
    }, [
      'uid',
      'tier',
      'status',
      'provider',
      'planId',
      'razorpayCustomerId',
      'razorpayStatus',
      'currentStart',
      'currentEnd',
      'updatedAt',
    ]);
  }

  await patchDocument(env, `razorpayEvents/${eventId}`, {
    event: event.event,
    subscriptionId: subscription.id,
    uid,
    processed: !!mapped,
    processedAt: timestamp(),
  });

  return json(request, env, { ok: true });
}

function mapWebhookToSubscription(
  event: string,
  subscription: RazorpaySubscription,
  env: Env,
  existing: Record<string, unknown>,
  notes: Record<string, string>
): { status: SubscriptionStatus; paidTier: PaidTier; tierForUser: 'free' | PaidTier } | null {
  const paidTier = resolveTier(subscription, env, existing, notes);

  switch (event) {
    case 'subscription.authenticated':
    case 'subscription.pending':
      return { status: 'pending', paidTier, tierForUser: paidTier };
    case 'subscription.activated':
    case 'subscription.charged':
    case 'subscription.resumed':
      return { status: 'active', paidTier, tierForUser: paidTier };
    case 'subscription.halted':
    case 'subscription.paused':
      return { status: 'halted', paidTier, tierForUser: paidTier };
    case 'subscription.cancelled':
      return { status: 'cancelled', paidTier, tierForUser: 'free' };
    case 'subscription.completed':
      return { status: 'expired', paidTier, tierForUser: 'free' };
    default:
      return null;
  }
}

function resolveTier(
  subscription: RazorpaySubscription,
  env: Env,
  existing: Record<string, unknown>,
  notes: Record<string, string>
): PaidTier {
  if (notes['tier'] === 'basic' || notes['tier'] === 'premium') {
    return notes['tier'] as PaidTier;
  }
  if (subscription.plan_id === env.BASIC_PLAN_ID) {
    return 'basic';
  }
  if (subscription.plan_id === env.PREMIUM_PLAN_ID) {
    return 'premium';
  }
  return existing['tier'] === 'premium' ? 'premium' : 'basic';
}

async function requireFirebaseUser(request: Request, env: Env): Promise<FirebaseUser> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    throw new HttpError(401, 'Sign in is required.');
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });

  if (!response.ok) {
    throw new HttpError(401, 'Invalid or expired Firebase session.');
  }

  const payload = await response.json() as {
    users?: Array<{
      localId: string;
      email?: string;
      displayName?: string;
    }>;
  };
  const user = payload.users?.[0];

  if (!user?.localId) {
    throw new HttpError(401, 'Invalid Firebase session.');
  }

  return {
    uid: user.localId,
    email: user.email ?? '',
    name: user.displayName ?? user.email?.split('@')[0] ?? 'Reader',
  };
}

async function ensureUserDocument(env: Env, user: FirebaseUser): Promise<void> {
  const existing = await getDocument(env, `users/${user.uid}`);
  if (existing) {
    return;
  }

  await patchDocument(env, `users/${user.uid}`, {
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: 'user',
    subscription: {
      tier: 'free',
      status: 'free',
      razorpaySubscriptionId: null,
      currentPeriodEnd: null,
    },
    razorpayCustomerId: null,
    createdAt: timestamp(),
    lastLoginAt: timestamp(),
  });
}

async function razorpayRequest<T = unknown>(env: Env, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { description?: string } };
    throw new HttpError(response.status, error.error?.description ?? 'Razorpay request failed.');
  }

  return response.json() as Promise<T>;
}

async function getDocument(env: Env, path: string): Promise<FirestoreDocument | null> {
  const response = await firestoreFetch(env, path, { method: 'GET' });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new HttpError(response.status, 'Firestore read failed.');
  }
  return response.json() as Promise<FirestoreDocument>;
}

async function patchDocument(
  env: Env,
  path: string,
  data: Record<string, unknown>,
  updateMask?: string[]
): Promise<FirestoreDocument> {
  const mask = updateMask?.map(field => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join('&');
  const response = await firestoreFetch(env, mask ? `${path}?${mask}` : path, {
    method: 'PATCH',
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });

  if (!response.ok) {
    throw new HttpError(response.status, 'Firestore write failed.');
  }

  return response.json() as Promise<FirestoreDocument>;
}

async function firestoreFetch(env: Env, pathWithQuery: string, init: RequestInit): Promise<Response> {
  const accessToken = await googleAccessToken(env);
  const [path, query] = pathWithQuery.split('?');
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${encodedPath}${query ? `?${query}` : ''}`;

  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });
}

async function googleAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedGoogleToken && cachedGoogleToken.expiresAt - 60 > now) {
    return cachedGoogleToken.token;
  }

  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claim = base64UrlJson({
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const unsignedJwt = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.FIREBASE_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(unsignedJwt)
  );
  const assertion = `${unsignedJwt}.${base64UrlBytes(new Uint8Array(signature))}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new HttpError(500, 'Could not authenticate Firebase service account.');
  }

  const payload = await response.json() as { access_token: string; expires_in: number };
  cachedGoogleToken = {
    token: payload.access_token,
    expiresAt: now + payload.expires_in,
  };
  return payload.access_token;
}

async function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  return timingSafeEqual(hex(new Uint8Array(digest)), signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function toFirestoreFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]));
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (isTimestampMarker(value)) {
    return { timestampValue: value.__timestamp };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }

  return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
}

function fromFirestoreDocument(document: FirestoreDocument): Record<string, unknown> {
  return fromFirestoreFields(document.fields ?? {});
}

function fromFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) {
    return null;
  }
  if ('booleanValue' in value) {
    return value.booleanValue;
  }
  if ('integerValue' in value) {
    return Number(value.integerValue);
  }
  if ('doubleValue' in value) {
    return value.doubleValue;
  }
  if ('timestampValue' in value) {
    return value.timestampValue;
  }
  if ('stringValue' in value) {
    return value.stringValue;
  }
  if ('arrayValue' in value) {
    return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  }
  return fromFirestoreFields(value.mapValue.fields ?? {});
}

function timestamp(): TimestampMarker {
  return { __timestamp: new Date().toISOString() };
}

function timestampFromSeconds(seconds: number): TimestampMarker {
  return { __timestamp: new Date(seconds * 1000).toISOString() };
}

function isTimestampMarker(value: unknown): value is TimestampMarker {
  return typeof value === 'object'
    && value !== null
    && '__timestamp' in value
    && typeof (value as TimestampMarker).__timestamp === 'string';
}

function normalizeNotes(notes: RazorpaySubscription['notes']): Record<string, string> {
  if (!notes || Array.isArray(notes)) {
    return {};
  }
  return Object.fromEntries(Object.entries(notes).filter(([, value]) => typeof value === 'string'));
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGIN.split(',').map(item => item.trim()).filter(Boolean);
  const allowOrigin = allowed.includes('*')
    ? '*'
    : allowed.includes(origin)
      ? origin
      : allowed[0] ?? origin;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Vary': 'Origin',
  };
}

function json(request: Request, env: Env, body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request, env),
      ...(init.headers ?? {}),
    },
  });
}

function base64UrlJson(value: unknown): string {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, '\n');
  const base64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/u, '')
    .replace(/-----END PRIVATE KEY-----/u, '')
    .replace(/\s/gu, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}
