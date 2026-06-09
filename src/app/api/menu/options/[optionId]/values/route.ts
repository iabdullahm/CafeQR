/**
 * POST /api/menu/options/[optionId]/values  — add a choice to an option group.
 * Cafe-scoped via the parent MenuItem.
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ optionId: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { optionId } = await params;
      let option;
      try {
        option = await prisma.menuItemOption.findUnique({
          where: { id: BigInt(optionId) },
          include: { menuItem: { select: { cafeId: true } } },
        });
      } catch {
        return NextResponse.json({ success: false, message: "Invalid option id" }, { status: 400 });
      }
      if (!option) {
        return NextResponse.json({ success: false, message: "Option not found" }, { status: 404 });
      }
      const isSuper = caller.roles?.includes("SUPER_ADMIN");
      if (!isSuper && String(caller.cafeId ?? "") !== String(option.menuItem.cafeId)) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }

      const body = (await req.json()) as {
        valueName?: string;
        extraPrice?: number | string;
        sortOrder?: number;
      };
      if (!body.valueName) {
        return NextResponse.json(
          { success: false, message: "valueName required" },
          { status: 400 }
        );
      }
      const created = await prisma.menuItemOptionValue.create({
        data: {
          optionId: option.id,
          valueName: body.valueName,
          extraPrice: Number(body.extraPrice) || 0,
          sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
        },
      });
      return NextResponse.json({
        success: true,
        data: {
          id: String(created.id),
          valueName: created.valueName,
          extraPrice: Number(created.extraPrice),
          sortOrder: created.sortOrder,
          status: created.status,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[POST /api/menu/options/[id]/values] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to add choice" },
        { status: 500 }
      );
    }
  });
}
