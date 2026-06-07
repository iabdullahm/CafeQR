/**
 * PATCH /api/super-admin/cafes/[id]
 *
 * Lets a SUPER_ADMIN toggle a cafe's status (active <-> suspended) from
 * the CRM table. Accepts `{ isActive: boolean }` in the body.
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing cafe id" },
        { status: 400 }
      );
    }
    let cafeId: bigint;
    try {
      cafeId = BigInt(id);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid cafe id" },
        { status: 400 }
      );
    }
    const body = (await req.json().catch(() => ({}))) as {
      isActive?: boolean;
      status?: string;
    };
    let newStatus: "active" | "suspended" | undefined;
    if (typeof body.isActive === "boolean") {
      newStatus = body.isActive ? "active" : "suspended";
    } else if (body.status === "active" || body.status === "suspended") {
      newStatus = body.status;
    }
    if (!newStatus) {
      return NextResponse.json(
        { success: false, message: "Missing isActive or status" },
        { status: 400 }
      );
    }
    const cafe = await prisma.cafe.update({
      where: { id: cafeId },
      data: { status: newStatus as any },
      select: { id: true, status: true },
    });
    return NextResponse.json({
      success: true,
      data: { id: String(cafe.id), status: cafe.status },
    });
  });
}
