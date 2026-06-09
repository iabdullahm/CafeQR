/**
 * GET  /api/menu/items/[id]/options  — list option groups for a menu item, with values.
 * POST /api/menu/items/[id]/options  — create a new option group on a menu item.
 *
 * Auth: cafe-scoped (OWNER/MANAGER) or SUPER_ADMIN. The menu item must
 * belong to the caller's cafe.
 *
 * Schema:
 *   MenuItemOption: { name, type ("single"|"multi"), isRequired, minSelect, maxSelect }
 *   MenuItemOptionValue: { valueName, extraPrice, sortOrder, status }
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function gateItem(itemId: string, caller: { roles?: string[]; cafeId?: string }) {
  let item;
  try {
    item = await prisma.menuItem.findUnique({
      where: { id: BigInt(itemId) },
      select: { id: true, cafeId: true },
    });
  } catch {
    return { error: "Invalid item id", status: 400 as const };
  }
  if (!item) return { error: "Menu item not found", status: 404 as const };
  const isSuper = caller.roles?.includes("SUPER_ADMIN");
  if (!isSuper && String(caller.cafeId ?? "") !== String(item.cafeId)) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { item };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    const { id } = await params;
    const res = await gateItem(id, caller as { roles?: string[]; cafeId?: string });
    if ("error" in res) {
      return NextResponse.json({ success: false, message: res.error }, { status: res.status });
    }
    const options = await prisma.menuItemOption.findMany({
      where: { menuItemId: res.item.id },
      orderBy: { id: "asc" },
      include: {
        values: {
          where: { status: "active" },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    return NextResponse.json({
      success: true,
      data: options.map((o) => ({
        id: String(o.id),
        name: o.name,
        type: o.type,
        isRequired: o.isRequired,
        minSelect: o.minSelect,
        maxSelect: o.maxSelect,
        values: o.values.map((v) => ({
          id: String(v.id),
          valueName: v.valueName,
          extraPrice: Number(v.extraPrice),
          sortOrder: v.sortOrder,
          status: v.status,
        })),
      })),
    });
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id } = await params;
      const gate = await gateItem(id, caller as { roles?: string[]; cafeId?: string });
      if ("error" in gate) {
        return NextResponse.json({ success: false, message: gate.error }, { status: gate.status });
      }
      const body = (await req.json()) as {
        name?: string;
        type?: "single" | "multi";
        isRequired?: boolean;
        minSelect?: number;
        maxSelect?: number;
        values?: Array<{ valueName?: string; extraPrice?: number | string; sortOrder?: number }>;
      };
      if (!body.name) {
        return NextResponse.json(
          { success: false, message: "name required" },
          { status: 400 }
        );
      }
      const type = body.type === "multi" ? "multi" : "single";
      const minSelect = Number.isFinite(Number(body.minSelect)) ? Number(body.minSelect) : (body.isRequired ? 1 : 0);
      const maxSelect = Number.isFinite(Number(body.maxSelect)) ? Number(body.maxSelect) : 1;

      const created = await prisma.menuItemOption.create({
        data: {
          menuItemId: gate.item.id,
          name: body.name,
          type,
          isRequired: !!body.isRequired,
          minSelect,
          maxSelect,
          values: Array.isArray(body.values) && body.values.length > 0
            ? {
                create: body.values
                  .filter((v) => !!v.valueName)
                  .map((v, idx) => ({
                    valueName: v.valueName!,
                    extraPrice: Number(v.extraPrice) || 0,
                    sortOrder: typeof v.sortOrder === "number" ? v.sortOrder : idx,
                  })),
              }
            : undefined,
        },
        include: { values: { orderBy: { sortOrder: "asc" } } },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: String(created.id),
          name: created.name,
          type: created.type,
          isRequired: created.isRequired,
          minSelect: created.minSelect,
          maxSelect: created.maxSelect,
          values: created.values.map((v) => ({
            id: String(v.id),
            valueName: v.valueName,
            extraPrice: Number(v.extraPrice),
            sortOrder: v.sortOrder,
            status: v.status,
          })),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[POST /api/menu/items/[id]/options] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to create option group" },
        { status: 500 }
      );
    }
  });
}
