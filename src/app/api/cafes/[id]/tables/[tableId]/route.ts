import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function loadAndGate(tableId: string, caller: any) {
  const t = await prisma.cafeTable.findUnique({ where: { id: BigInt(tableId) } });
  if (!t) return { error: "Not found", status: 404 };
  const isSuper = caller.roles?.includes("SUPER_ADMIN");
  if (!isSuper && String(caller.cafeId ?? "") !== String(t.cafeId)) {
    return { error: "Forbidden", status: 403 };
  }
  return { t };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; tableId: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { tableId } = await params;
      const res = await loadAndGate(tableId, caller);
      if ("error" in res) return NextResponse.json({ success: false, message: res.error }, { status: res.status });
      const body = await req.json() as Record<string, unknown>;
      const editable = ["tableNumber", "tableName", "seatsCount", "status"];
      const data: Record<string, unknown> = {};
      for (const k of editable) if (k in body) data[k] = body[k];
      const row = await prisma.cafeTable.update({ where: { id: BigInt(tableId) }, data });
      return NextResponse.json({ success: true, data: { id: String(row.id) } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; tableId: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    const { tableId } = await params;
    const res = await loadAndGate(tableId, caller);
    if ("error" in res) return NextResponse.json({ success: false, message: res.error }, { status: res.status });
    await prisma.$transaction(async (tx) => {
      // Disable the linked QR code (don't delete to keep history).
      const t = await tx.cafeTable.findUnique({ where: { id: BigInt(tableId) } });
      if (t?.qrCodeId) {
        await tx.qRCode.update({ where: { id: t.qrCodeId }, data: { status: "deleted" } });
      }
      await tx.cafeTable.delete({ where: { id: BigInt(tableId) } });
    });
    return NextResponse.json({ success: true });
  });
}
