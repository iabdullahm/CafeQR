import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";
import { findOne } from "@/modules/cafes/cafes.controller";

/**
 * GET /api/cafes/[id] — read (admin)
 *   Returns full cafe row. Open to SUPER_ADMIN and any cafe-scoped role
 *   for their own cafe (handled by the controller).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(req, ["SUPER_ADMIN", "admin", "OWNER", "MANAGER"], async () => {
    return findOne(id);
  });
}

/**
 * PATCH /api/cafes/[id] — owner/manager updates their cafe profile.
 *
 * Updatable fields (subset of Cafe model that admins are allowed to
 * change): name, nameAr, description, descriptionAr, logo, coverImage,
 * phone, email, country, city, address, currency, timezone, taxRate,
 * settings.
 *
 * SUPER_ADMIN can update any cafe. OWNER/MANAGER can only update the
 * cafe attached to their JWT (caller.cafeId).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id } = await params;
      let cafe = null;
      if (/^\d+$/.test(id)) {
        try {
          cafe = await prisma.cafe.findUnique({ where: { id: BigInt(id) } });
        } catch { /* fall through */ }
      }
      if (!cafe) cafe = await prisma.cafe.findFirst({ where: { cafeCode: id } });
      if (!cafe) cafe = await prisma.cafe.findFirst({ where: { slug: id } });
      if (!cafe) {
        return NextResponse.json(
          { success: false, message: "Cafe not found" },
          { status: 404 }
        );
      }

      const isSuper = caller.roles?.includes("SUPER_ADMIN");
      const callerCafeId = (caller as { cafeId?: string }).cafeId;
      if (!isSuper && (!callerCafeId || String(callerCafeId) !== String(cafe.id))) {
        return NextResponse.json(
          { success: false, message: "Forbidden — not your cafe" },
          { status: 403 }
        );
      }

      const body = (await req.json()) as Record<string, unknown>;
      const editable = [
        "name", "nameAr", "description", "descriptionAr",
        "logo", "coverImage", "phone", "email",
        "country", "city", "address",
        "currency", "timezone",
      ];
      const data: Record<string, unknown> = {};
      for (const k of editable) {
        if (k in body) data[k] = body[k];
      }
      if ("taxRate" in body && body.taxRate !== null && body.taxRate !== undefined) {
        const n = Number(body.taxRate);
        if (!Number.isNaN(n)) data.taxRate = n;
      }
      if ("settings" in body) data.settings = body.settings as object | null;

      const updated = await prisma.cafe.update({
        where: { id: cafe.id },
        data,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: String(updated.id),
          name: updated.name,
          nameAr: updated.nameAr,
          slug: updated.slug,
          cafeCode: updated.cafeCode,
          logo: updated.logo,
          coverImage: updated.coverImage,
          currency: updated.currency,
          taxRate: Number(updated.taxRate ?? 0),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/cafes/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to update cafe" },
        { status: 500 }
      );
    }
  });
}
