import { getApps, initializeApp, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * Cached Firebase Admin app + handles for server-side use.
 *
 * Credentials are read from FIREBASE_SERVICE_ACCOUNT_KEY (recommended for
 * Vercel/CI) as a JSON-encoded service-account key. If that env var is
 * absent, falls back to Application Default Credentials.
 *
 * IMPORTANT:
 *   - This module must never be imported from a client component.
 *   - The Admin SDK bypasses Firestore Security Rules, so any caller is
 *     responsible for its own authorization (use withAuth/withRole, validate
 *     the request body, etc.).
 */

let _app: App | undefined;
let _db: Firestore | undefined;
let _auth: Auth | undefined;

function loadServiceAccount(): ServiceAccount | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return {
      projectId: parsed.project_id ?? parsed.projectId,
      clientEmail: parsed.client_email ?? parsed.clientEmail,
      privateKey: (parsed.private_key ?? parsed.privateKey)?.replace(/\\n/g, '\n'),
    };
  } catch (err) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', err);
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }
}

export function getAdminApp(): App {
  if (_app) return _app;

  const existing = getApps()[0];
  if (existing) {
    _app = existing;
    return _app;
  }

  const sa = loadServiceAccount();
  _app = initializeApp(
    sa
      ? { credential: cert(sa) }
      : undefined // application default credentials fallback
  );
  return _app;
}

export function getAdminDb(): Firestore {
  if (!_db) _db = getFirestore(getAdminApp());
  return _db;
}

export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getAdminApp());
  return _auth;
}

// Re-export FieldValue for callers (server-side serverTimestamp / increments).
export { FieldValue };
