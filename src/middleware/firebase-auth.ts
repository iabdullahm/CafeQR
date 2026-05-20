import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

/**
 * Firebase Auth–based route guard.
 *
 * Verifies a Firebase ID token from `Authorization: Bearer <token>`, looks up
 * the caller's role/cafeId from /users/{uid}, and gates by allowed roles.
 *
 * Use this for routes called from cafe-admin / super-admin / kds pages, which
 * sign in with Firebase Auth (useUser) rather than the legacy JWT.
 */

export interface FirebaseAuthedUser {
  uid: string;
  email: string | undefined;
  role: string | undefined;
  cafeId: string | undefined;
}

export async function getFirebaseUser(req: Request): Promise<FirebaseAuthedUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const profileSnap = await getAdminDb().collection('users').doc(decoded.uid).get();
    const profile = profileSnap.exists ? (profileSnap.data() as Record<string, unknown>) : {};
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: profile.role as string | undefined,
      cafeId: profile.cafeId as string | undefined,
    };
  } catch (err) {
    console.warn('Firebase ID token verification failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function withFirebaseAuth(
  req: Request,
  allowedRoles: string[] | null,
  handler: (user: FirebaseAuthedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getFirebaseUser(req);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
  }

  return handler(user);
}
