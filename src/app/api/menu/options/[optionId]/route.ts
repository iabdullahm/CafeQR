/**
 * PATCH /api/menu/options/[optionId]  — update an option group's metadata.
 * DELETE /api/menu/options/[optionId] — delete an option group and its values.
 *
 * Cafe-scoped via the parent MenuItem.
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function gateOption(optionId: string, caller: { roles?: string[]; cafeId?: string }) {
  let row;
  try {
    row = await prisma.menuItemOption.findUnique({
      where: { id: BigInt(optionId) },
      include: { menuItem: { select: { cafeId: true } } },
    });
  } catch {
    return { error: "Invalid option id", status: 400 as const };
  }
  if (!row) return { error: "Option not found", status: 404 as const };
  const isSuper = caller.roles?.includes("SUPER_ADMIN");
  if (!isSuper && String(caller.cafeId ?? "") !== String(row.menuItem.cafeId)) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { row };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ optionId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { optionId } = await params;
      const gate = await gateOption(optionId, caller as { roles?: string[]; cafeId?: string });
      if ("error" in gate) {
        return NextResponse.json({ success: false, message: gate.error }, { status: gate.status });
      }
      const body = (await req.json()) as {
        name?: string;
        type?: "single" | "multi";
        isRequired?: boolean;
        minSelect?: number;
        maxSelect?: number;
      };
      const data: Record<string, unknown> = {};
      if (typeof body.name === "string") data.name = body.name;
      if (body.type === "single" || body.type === "multi") data.type = body.type;
      if (typeof body.isRequired === "boolean") data.isRequired = body.isRequired;
      if (Number.isFinite(Number(body.minSelect))) data.minSelect = Number(body.minSelect);
      if (Number.isFinite(Number(body.maxSelect))) data.maxSelect = Number(body.maxSelect);

      const updated = await prisma.menuItemOption.update({
        where: { id: gate.row.id },
        data,
      });
      return NextResponse.json({
        success: true,
        data: { id: String(updated.id), name: updated.name },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/menu/options/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to update option" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ optionId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { optionId } = await params;
      const gate = await gateOption(optionId, caller as { roles?: string[]; cafeId?: string });
      if ("error" in gate) {
        return NextResponse.json({ success: false, message: gate.error }, { status: gate.status });
      }
      await prisma.$transaction([
        prisma.menuItemOptionValue.deleteMany({ where: { optionId: gate.row.id } }),
        prisma.menuItemOption.delete({ where: { id: gate.row.id } }),
      ]);
      return NextResponse.json({ success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[DELETE /api/menu/options/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to delete option" },
        { status: 500 }
      );
    }
  });
}
