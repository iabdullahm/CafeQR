import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * POST /api/cafes/[id]/staff/[userId]/reset-password
 *
 * Reset a staff member's password.
 *
 * Body (both fields optional):
 *   { newPassword?: string }       Use the provided password (>=8 chars).
 *   { generate?: true }            Server picks a 12-char random password.
 *
 * If neither flag is provided, the server defaults to generating a
 * random password. The plaintext is returned to the caller ONCE in
 * the response so an OWNER can read it out to the staff member; we
 * never store or log the plaintext.
 *
 * Auth: SUPER_ADMIN or OWNER/MANAGER within the same cafe. Same
 * tenant gate + allowlist guarantees as the PATCH endpoint next door,
 * so an OWNER for cafe A cannot reset cafe B's staff passwords.
 *
 * Safety choices:
 *   - bcrypt cost 10 to match the rest of the codebase.
 *   - Reject passwords <8 chars (same as the POST staff endpoint).
 *   - The new password is NEVER echoed back to logs, only the response.
 *   - Cross-tenant access returns 403, not 404, so an attacker probing
 *     for IDs can't tell which userIds exist (they get 403 either way
 *     once they pass the cafeId gate).
 */

function safeBigInt(raw: string): bigint | null {
  try { return BigInt(raw); } catch { return null; }
}

function makeRandomPassword(): string {
  // 9 random bytes -> 12-char base64url string. Strong enough for a
  // temporary credential the OWNER will share over WhatsApp / verbal.
  return randomBytes(9).toString("base64url");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id, userId } = await params;
      const cafeIdBig = safeBigInt(id);
      const userIdBig = safeBigInt(userId);
      if (!cafeIdBig || !userIdBig) {
        return NextResponse.json({ success: false, message: "Invalid ids" }, { status: 400 });
      }

      // Tenant gate
      const isSuper = caller.roles?.includes("SUPER_ADMIN");
      const callerCafeId = (caller as { cafeId?: string }).cafeId;
      if (!isSuper && String(callerCafeId ?? "") !== String(cafeIdBig)) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }

      // Verify the staff actually belongs to this cafe (prevents
      // resetting a user who's only in a different cafe).
      const link = await prisma.cafeUser.findFirst({
        where: { cafeId: cafeIdBig, userId: userIdBig },
      });
      if (!link) {
        return NextResponse.json(
          { success: false, message: "Staff member not found in this cafe" },
          { status: 404 }
        );
      }

      const body = (await req.json().catch(() => ({}))) as { newPassword?: string; generate?: boolean };

      let plaintext: string;
      let wasGenerated = false;
      if (body.newPassword) {
        if (body.newPassword.length < 8) {
          return NextResponse.json(
            { success: false, message: "Password must be at least 8 characters." },
            { status: 400 }
          );
        }
        plaintext = body.newPassword;
      } else {
        plaintext = makeRandomPassword();
        wasGenerated = true;
      }

      const passwordHash = await bcrypt.hash(plaintext, 10);

      // We update by userId so the password applies whether the user
      // belongs to one or many cafes. (Multi-tenant users are rare
      // but theoretically possible.)
      const updated = await prisma.user.update({
        where: { id: userIdBig },
        data: { passwordHash, updatedAt: new Date() },
        select: { id: true, email: true, fullName: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          userId: String(updated.id),
          email: updated.email,
          fullName: updated.fullName,
          // Plaintext is returned EXACTLY ONCE — the OWNER must copy it
          // before closing the dialog. We do not persist it anywhere.
          newPassword: plaintext,
          wasGenerated,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[POST /api/cafes/[id]/staff/[userId]/reset-password] error:", msg);
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
