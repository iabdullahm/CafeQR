/**
 * POST /api/super-admin/impersonate/[cafeId]
 *
 * Allows a SUPER_ADMIN (authenticated via Firebase Auth) to obtain a
 * scoped JWT that "impersonates" a cafe owner — used by the super-admin
 * dashboard to jump into a tenant's cafe-admin view without needing
 * the owner's credentials.
 *
 * Auth flow:
 *   1. Verify the caller's Firebase ID token (super-admin role from
 *      Firestore /users/{uid}).
 *   2. Look up the target cafe in Postgres (by numeric id or cafeCode).
 *   3. Return a SHORT-LIVED legacy JWT scoped to that cafe — the
 *      cafe-admin code still uses this token for its own API calls.
 *      Token includes `impersonatedBy: <super-admin uid>` for audit.
 *
 * Migration note: this previously used the JWT-based `withAuth`, which
 * left the endpoint failing with 401 in production because the
 * super-admin pages were authenticating with Firebase. The route is now
 * Firebase-first; the legacy JWT it ISSUES is only the impersonation
 * artefact, not how the caller proves identity.
 */

import { NextResponse } from 'next/server';
import { withFirebaseAuth } from '@/middleware/firebase-auth';
import prisma from '@/config/prisma';
import { signToken } from '@/utils/jwt';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cafeId: string }> }
) {
  return withFirebaseAuth(req, ['SUPER_ADMIN'], async (user) => {
    try {
      const { cafeId } = await params;
      if (!cafeId) {
        return NextResponse.json(
          { success: false, message: 'Missing cafeId' },
          { status: 400 }
        );
      }

      // Resolve the cafe row. The id we receive may be:
      //  - numeric Postgres id   (e.g. "1")
      //  - human-readable cafeCode (e.g. "DEMO001")
      //  - Firebase document id  (e.g. "CAF-1716173400")
      let cafe = null;
      if (!isNaN(Number(cafeId))) {
        cafe = await prisma.cafe.findUnique({ where: { id: BigInt(cafeId) } });
      }
      if (!cafe) {
        cafe = await prisma.cafe.findFirst({ where: { cafeCode: cafeId } });
      }

      // Build the impersonation JWT payload.
      const tokenPayload = (() => {
        if (cafe) {
          return {
            sub: cafe.ownerUserId ? String(cafe.ownerUserId) : 'CAFE_DEFAULT_OWNER',
            email: 'impersonated@cafeqr.com',
            roles: ['OWNER'],
            cafeId: String(cafe.id),
            impersonatedBy: user.uid,
          };
        }
        // Cafe not found in Postgres — fall back to a Firebase-only cafe
        // id. The legacy cafe-admin code accepts this shape.
        if (typeof cafeId === 'string' && cafeId.length > 0) {
          return {
            sub: 'CAFE_DEFAULT_OWNER',
            email: 'impersonated@cafeqr.com',
            roles: ['OWNER'],
            cafeId,
            impersonatedBy: user.uid,
          };
        }
        return null;
      })();

      if (!tokenPayload) {
        return NextResponse.json(
          { success: false, message: 'Cafe not found' },
          { status: 404 }
        );
      }

      const newToken = signToken(tokenPayload);

      return NextResponse.json({
        success: true,
        data: { token: newToken },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Impersonation Error:', error);
      return NextResponse.json(
        { success: false, message: msg },
        { status: 500 }
      );
    }
  });
}
