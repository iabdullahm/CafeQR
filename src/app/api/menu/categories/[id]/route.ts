import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function loadAndAuthorize(
  catId: string,
  caller: { roles?: string[]; cafeId?: string }
) {
  const cat = await prisma.menuCategory.findUnique({ where: { id: BigInt(catId) } });
  if (!cat) return { error: "Not found", status: 404 };
  const isSuper = caller.roles?.includes("SUPER_ADMIN");
  if (!isSuper && String(caller.cafeId ?? "") !== String(cat.cafeId)) {
    return { error: "Forbidden", status: 403 };
  }
  return { cat };
}

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
      const editable = ["name", "nameAr", "description", "descriptionAr", "image", "sortOrder"];
      const data: Record<string, unknown> = {};
      for (const k of editable) if (k in body) data[k] = body[k];
      const updated = await prisma.menuCategory.update({
        where: { id: BigInt(id) },
        data,
      });
      return NextResponse.json({
        success: true,
        data: { id: String(updated.id), name: updated.name },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/menu/categories/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Update failed" },
        { status: 500 }
      );
    }
  });
}

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
      await prisma.menuCategory.update({
        where: { id: BigInt(id) },
        data: { status: "deleted" },
      });
      return NextResponse.json({ success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[DELETE /api/menu/categories/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Delete failed" },
        { status: 500 }
      );
    }
  });
}
