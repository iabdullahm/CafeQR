import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

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
