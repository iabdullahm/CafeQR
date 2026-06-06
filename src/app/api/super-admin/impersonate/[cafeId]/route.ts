/**
 * POST /api/super-admin/impersonate/[cafeId]
 *
 * Allows a SUPER_ADMIN to obtain a scoped JWT that impersonates a cafe
 * owner — used by the super-admin dashboard to jump into a tenant's
 * cafe-admin view without needing the owner's credentials.
 *
 * Auth flow (post Firebase Auth removal):
 *   1. Verify the caller's legacy JWT via withAuth.
 *   2. Require role SUPER_ADMIN.
 *   3. Look up the target cafe in Postgres (numeric id, cafeCode, slug).
 *   4. Return a SHORT-LIVED legacy JWT scoped to that cafe, with
 *      impersonatedBy: <super-admin sub> for audit.
 *
 * History:
 *   - originally JWT-based
 *   - briefly Firebase ID token + firebase-admin SDK (broke prod)
 *   - briefly Firebase ID token + jose JWKS (worked but kept Firebase
 *     dependency on the client)
 *   - now: pure JWT, matching the rest of the API surface.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth-helpers";
import prisma from "@/config/prisma";
import { signToken } from "@/utils/jwt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cafeId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN"], async (caller) => {
    try {
      const { cafeId } = await params;
      if (!cafeId) {
        return NextResponse.json(
          { success: false, message: "Missing cafeId" },
          { status: 400 }
        );
      }

      let cafe = null;
      if (/^\d+$/.test(cafeId)) {
        try {
          cafe = await prisma.cafe.findUnique({ where: { id: BigInt(cafeId) } });
        } catch {
          /* fall through */
        }
      }
      if (!cafe) {
        cafe = await prisma.cafe.findFirst({ where: { cafeCode: cafeId } });
      }
      if (!cafe) {
        cafe = await prisma.cafe.findFirst({ where: { slug: cafeId } });
      }

      const tokenPayload = (() => {
        if (cafe) {
          return {
            sub: cafe.ownerUserId
              ? String(cafe.ownerUserId)
              : "CAFE_DEFAULT_OWNER",
            email: "impersonated@cafeqr.com",
            roles: ["OWNER"],
            cafeId: String(cafe.id),
            impersonatedBy: caller.sub,
          };
        }
        if (typeof cafeId === "string" && cafeId.length > 0) {
          return {
            sub: "CAFE_DEFAULT_OWNER",
            email: "impersonated@cafeqr.com",
            roles: ["OWNER"],
            cafeId,
            impersonatedBy: caller.sub,
          };
        }
        return null;
      })();

      if (!tokenPayload) {
        return NextResponse.json(
          { success: false, message: "Cafe not found" },
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
      console.error("Impersonation Error:", error);
      return NextResponse.json(
        { success: false, message: msg },
        { status: 500 }
      );
    }
  });
}
