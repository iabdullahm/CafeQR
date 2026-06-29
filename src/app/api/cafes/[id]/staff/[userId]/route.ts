import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * PATCH /api/cafes/[id]/staff/[userId]
 *
 * Updates a CafeUser link's role and/or status. Replaces the
 * Phase 4d "Not implemented yet" toast in change-role-modal.
 *
 * Body:
 *   { roleName?: "OWNER"|"MANAGER"|"CASHIER"|"KITCHEN", status?: "active"|"suspended" }
 *
 * Auth:
 *   - SUPER_ADMIN can promote anyone to anything (including SUPER_ADMIN).
 *   - OWNER/MANAGER can assign OWNER/MANAGER/CASHIER/KITCHEN within their
 *     own cafe (cannot self-promote to SUPER_ADMIN — same allowlist as the
 *     POST staff endpoint).
 *
 * Notes:
 *   - The CafeUser schema stores a single roleId, not an array. The UI may
 *     show multi-select role checkboxes for legacy reasons; the highest
 *     role in the chosen set wins.
 */

const ASSIGNABLE_ROLES = new Set(["OWNER", "MANAGER", "CASHIER", "KITCHEN"]);
const SUPER_ASSIGNABLE = new Set([...ASSIGNABLE_ROLES, "SUPER_ADMIN"]);

function safeBigInt(raw: string): bigint | null {
  try { return BigInt(raw); } catch { return null; }
}

export async function PATCH(
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

      // Tenant gate: non-super-admin can only touch staff in their own cafe.
      const isSuper = caller.roles?.includes("SUPER_ADMIN");
      const callerCafeId = (caller as { cafeId?: string }).cafeId;
      if (!isSuper && String(callerCafeId ?? "") !== String(cafeIdBig)) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }

      const link = await prisma.cafeUser.findFirst({
        where: { cafeId: cafeIdBig, userId: userIdBig },
      });
      if (!link) {
        return NextResponse.json({ success: false, message: "Staff member not found in this cafe" }, { status: 404 });
      }

      const body = (await req.json().catch(() => ({}))) as { roleName?: string; status?: string };

      const data: Record<string, unknown> = {};

      if (body.roleName) {
        const wanted = body.roleName.toUpperCase();
        const allowed = isSuper ? SUPER_ASSIGNABLE : ASSIGNABLE_ROLES;
        if (!allowed.has(wanted)) {
          return NextResponse.json(
            { success: false, message: `Role ${body.roleName} cannot be assigned by you.` },
            { status: 403 }
          );
        }
        const role = await prisma.role.findUnique({ where: { name: wanted } });
        if (!role) {
          return NextResponse.json(
            { success: false, message: `Role ${wanted} is not seeded in the Role table.` },
            { status: 400 }
          );
        }
        data.roleId = role.id;
      }

      if (body.status) {
        const wanted = body.status.toLowerCase();
        if (wanted !== "active" && wanted !== "suspended") {
          return NextResponse.json(
            { success: false, message: "status must be active or suspended" },
            { status: 400 }
          );
        }
        data.status = wanted;
      }

      if (Object.keys(data).length === 0) {
        return NextResponse.json(
          { success: false, message: "Nothing to update — provide roleName and/or status." },
          { status: 400 }
        );
      }

      const updated = await prisma.cafeUser.update({
        where: { id: link.id },
        data,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      });
      const role = await prisma.role.findUnique({ where: { id: updated.roleId }, select: { name: true } });

      return NextResponse.json({
        success: true,
        data: {
          id: String(updated.id),
          userId: String(updated.userId),
          cafeId: String(updated.cafeId),
          roleName: role?.name ?? null,
          status: updated.status,
          fullName: updated.user.fullName,
          email: updated.user.email,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/cafes/[id]/staff/[userId]] error:", msg);
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    const { id, userId } = await params;
    if (!/^\d+$/.test(id) || !/^\d+$/.test(userId)) {
      return NextResponse.json({ success: false, message: "Invalid ids" }, { status: 400 });
    }
    const cafeIdBig = BigInt(id);
    const userIdBig = BigInt(userId);
    const isSuper = caller.roles?.includes("SUPER_ADMIN");
    if (!isSuper && String((caller as { cafeId?: string }).cafeId ?? "") !== String(cafeIdBig)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    const link = await prisma.cafeUser.findFirst({ where: { cafeId: cafeIdBig, userId: userIdBig } });
    if (!link) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    await prisma.cafeUser.delete({ where: { id: link.id } });
    return NextResponse.json({ success: true });
  });
}
