/**
 * POST /api/super-admin/impersonate/[cafeId]
 *
 * Allows a SUPER_ADMIN to obtain a scoped JWT that impersonates a cafe
 * owner — used by the super-admin dashboard to jump into a tenant's
 * cafe-admin view without needing the owner's credentials.
 *
 * Auth flow (post firebase-admin removal):
 *   1. Verify the caller's Firebase ID token via JWKS (Google's public
 *      keys) using the jose library — NO firebase-admin SDK required.
 *   2. Look up the caller's roles in Postgres by email. SUPER_ADMIN
 *      access is granted if either:
 *        a) the user has the SUPER_ADMIN role row in user_roles, OR
 *        b) the email is listed in env SUPER_ADMIN_EMAILS (comma-
 *           separated). Option (b) is the bootstrap path.
 *   3. Look up the target cafe in Postgres (numeric id, cafeCode, slug).
 *   4. Return a SHORT-LIVED legacy JWT scoped to that cafe, with
 *      impersonatedBy: <super-admin uid> for audit.
 *
 * Why JWKS instead of firebase-admin: the org policy
 * iam.disableServiceAccountKeyCreation blocks generating a Firebase
 * service account JSON; the previous broken FIREBASE_SERVICE_ACCOUNT_KEY
 * env var was causing customer-facing FIREBASE_SERVICE_ACCOUNT_KEY is
 * not valid JSON errors. Verifying via JWKS gives the same RS256
 * signature guarantee against Google's published certs with zero
 * secret material on our side.
 */

import { NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import prisma from "@/config/prisma";
import { signToken } from "@/utils/jwt";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "cafeqr-new";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
}

async function verifyFirebaseIdToken(
  bearerHeader: string | null
): Promise<VerifiedFirebaseUser | null> {
  if (!bearerHeader?.startsWith("Bearer ")) return null;
  const token = bearerHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    return {
      uid: String(payload.sub ?? ""),
      email: typeof payload.email === "string" ? payload.email : null,
    };
  } catch (err) {
    console.warn(
      "Firebase ID token verification failed (JWKS):",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function callerHasSuperAdmin(email: string | null): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  // Bootstrap path: env var listing super-admin emails.
  const envList = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (envList.includes(normalized)) return true;

  // Postgres path: user_roles join with role.name = SUPER_ADMIN.
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return false;
  const rows = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });
  return rows.some((r) => r.role.name === "SUPER_ADMIN");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cafeId: string }> }
) {
  try {
    // ---- Auth ----
    const caller = await verifyFirebaseIdToken(req.headers.get("authorization"));
    if (!caller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!(await callerHasSuperAdmin(caller.email))) {
      return NextResponse.json(
        { success: false, message: "Forbidden \u2014 SUPER_ADMIN required" },
        { status: 403 }
      );
    }

    // ---- Resolve target cafe ----
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

    // ---- Build impersonation JWT ----
    const tokenPayload = (() => {
      if (cafe) {
        return {
          sub: cafe.ownerUserId
            ? String(cafe.ownerUserId)
            : "CAFE_DEFAULT_OWNER",
          email: "impersonated@cafeqr.com",
          roles: ["OWNER"],
          cafeId: String(cafe.id),
          impersonatedBy: caller.uid,
        };
      }
      // Cafe not in Postgres — still issue a JWT carrying the raw id.
      if (typeof cafeId === "string" && cafeId.length > 0) {
        return {
          sub: "CAFE_DEFAULT_OWNER",
          email: "impersonated@cafeqr.com",
          roles: ["OWNER"],
          cafeId,
          impersonatedBy: caller.uid,
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
}
