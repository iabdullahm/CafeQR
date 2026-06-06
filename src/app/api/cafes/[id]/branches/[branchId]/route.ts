import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function loadAndGate(branchId: string, caller: any) {
  const b = await prisma.cafeBranch.findUnique({ where: { id: BigInt(branchId) } });
  if (!b) return { error: "Not found", status: 404 };
  const isSuper = caller.roles?.includes("SUPER_ADMIN");
  if (!isSuper && String(caller.cafeId ?? "") !== String(b.cafeId)) {
    return { error: "Forbidden", status: 403 };
  }
  return { b };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; branchId: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { branchId } = await params;
      const res = await loadAndGate(branchId, caller);
      if ("error" in res) return NextResponse.json({ success: false, message: res.error }, { status: res.status });
      const body = await req.json() as Record<string, unknown>;
      const editable = ["name", "branchCode", "phone", "email", "city", "address", "status", "isMainBranch"];
      const data: Record<string, unknown> = {};
      for (const k of editable) if (k in body) data[k] = body[k];
      const row = await prisma.cafeBranch.update({ where: { id: BigInt(branchId) }, data });
      return NextResponse.json({ success: true, data: { id: String(row.id), name: row.name } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; branchId: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    const { branchId } = await params;
    const res = await loadAndGate(branchId, caller);
    if ("error" in res) return NextResponse.json({ success: false, message: res.error }, { status: res.status });
    await prisma.cafeBranch.update({ where: { id: BigInt(branchId) }, data: { status: "closed" } });
    return NextResponse.json({ success: true });
  });
}
