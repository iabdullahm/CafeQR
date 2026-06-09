/**
 * PATCH  /api/menu/option-values/[valueId]  — edit a choice (rename, retag price, reorder).
 * DELETE /api/menu/option-values/[valueId]  — remove a choice.
 * Cafe-scoped via the parent MenuItemOption -> MenuItem.
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function gateValue(valueId: string, caller: { roles?: string[]; cafeId?: string }) {
  let row;
  try {
    row = await prisma.menuItemOptionValue.findUnique({
      where: { id: BigInt(valueId) },
      include: { option: { include: { menuItem: { select: { cafeId: true } } } } },
    });
  } catch {
    return { error: "Invalid value id", status: 400 as const };
  }
  if (!row) return { error: "Choice not found", status: 404 as const };
  const isSuper = caller.roles?.includes("SUPER_ADMIN");
  if (!isSuper && String(caller.cafeId ?? "") !== String(row.option.menuItem.cafeId)) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { row };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ valueId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { valueId } = await params;
      const gate = await gateValue(valueId, caller as { roles?: string[]; cafeId?: string });
      if ("error" in gate) {
        return NextResponse.json({ success: false, message: gate.error }, { status: gate.status });
      }
      const body = (await req.json()) as {
        valueName?: string;
        extraPrice?: number | string;
        sortOrder?: number;
        status?: string;
      };
      const data: Record<string, unknown> = {};
      if (typeof body.valueName === "string") data.valueName = body.valueName;
      if (body.extraPrice !== undefined && body.extraPrice !== null) {
        const n = Number(body.extraPrice);
        if (!Number.isNaN(n)) data.extraPrice = n;
      }
      if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
      if (body.status === "active" || body.status === "inactive") data.status = body.status;

      const updated = await prisma.menuItemOptionValue.update({
        where: { id: gate.row.id },
        data,
      });
      return NextResponse.json({
        success: true,
        data: { id: String(updated.id), valueName: updated.valueName },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/menu/option-values/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to update choice" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ valueId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { valueId } = await params;
      const gate = await gateValue(valueId, caller as { roles?: string[]; cafeId?: string });
      if ("error" in gate) {
        return NextResponse.json({ success: false, message: gate.error }, { status: gate.status });
      }
      await prisma.menuItemOptionValue.delete({ where: { id: gate.row.id } });
      return NextResponse.json({ success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[DELETE /api/menu/option-values/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to delete choice" },
        { status: 500 }
      );
    }
  });
}
