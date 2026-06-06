import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/** Helper: enforce cafe-scope for non-super-admins. */
async function loadAndAuthorize(
  itemId: string,
  caller: { roles?: string[]; cafeId?: string }
) {
  const item = await prisma.menuItem.findUnique({ where: { id: BigInt(itemId) } });
  if (!item) return { error: "Not found", status: 404 };
  const isSuper = caller.roles?.includes("SUPER_ADMIN");
  if (!isSuper && String(caller.cafeId ?? "") !== String(item.cafeId)) {
    return { error: "Forbidden", status: 403 };
  }
  return { item };
}

/** PATCH /api/menu/items/[id] */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id } = await params;
      const res = await loadAndAuthorize(id, caller as { roles?: string[]; cafeId?: string });
      if ("error" in res) {
        return NextResponse.json({ success: false, message: res.error }, { status: res.status });
      }

      const body = (await req.json()) as Record<string, unknown>;
      const editable = [
        "name", "nameAr", "description", "descriptionAr",
        "image", "sku", "isFeatured", "isAvailable", "sortOrder",
        "categoryId",
      ];
      const data: Record<string, unknown> = {};
      for (const k of editable) {
        if (k in body) data[k] = body[k];
      }
      if (data.categoryId !== undefined && data.categoryId !== null) {
        data.categoryId = BigInt(String(data.categoryId));
      }
      if ("price" in body && body.price !== null && body.price !== undefined) {
        const n = Number(body.price);
        if (!Number.isNaN(n)) data.price = n;
      }
      if ("options" in body) data.optionsData = body.options as object | null;

      const updated = await prisma.menuItem.update({
        where: { id: BigInt(id) },
        data,
      });

      return NextResponse.json({
        success: true,
        data: { id: String(updated.id), name: updated.name },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/menu/items/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Update failed" },
        { status: 500 }
      );
    }
  });
}

/** DELETE /api/menu/items/[id] — soft-delete via status='deleted'. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id } = await params;
      const res = await loadAndAuthorize(id, caller as { roles?: string[]; cafeId?: string });
      if ("error" in res) {
        return NextResponse.json({ success: false, message: res.error }, { status: res.status });
      }
      await prisma.menuItem.update({
        where: { id: BigInt(id) },
        data: { status: "deleted", isAvailable: false },
      });
      return NextResponse.json({ success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[DELETE /api/menu/items/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Delete failed" },
        { status: 500 }
      );
    }
  });
}
