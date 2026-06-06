import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function resolveCafeIdBigInt(raw: string): Promise<bigint | null> {
  if (/^\d+$/.test(raw)) {
    try {
      const exists = await prisma.cafe.findUnique({ where: { id: BigInt(raw) }, select: { id: true } });
      if (exists) return exists.id;
    } catch { /* fall through */ }
  }
  const byCode = await prisma.cafe.findFirst({ where: { cafeCode: raw }, select: { id: true } });
  if (byCode) return byCode.id;
  const bySlug = await prisma.cafe.findFirst({ where: { slug: raw }, select: { id: true } });
  if (bySlug) return bySlug.id;
  return null;
}

function gateCafe(caller: any, cafeId: bigint): boolean {
  if (caller.roles?.includes("SUPER_ADMIN")) return true;
  return String(caller.cafeId ?? "") === String(cafeId);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "KITCHEN"], async (caller) => {
    const { id } = await params;
    const cid = await resolveCafeIdBigInt(id);
    if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
    if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    const rows = await prisma.cafeBranch.findMany({
      where: { cafeId: cid },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        cafeId: String(r.cafeId),
        branchCode: r.branchCode,
        name: r.name,
        phone: r.phone,
        email: r.email,
        city: r.city,
        address: r.address,
        latitude: r.latitude ? Number(r.latitude) : null,
        longitude: r.longitude ? Number(r.longitude) : null,
        status: r.status,
        isMainBranch: r.isMainBranch,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id } = await params;
      const cid = await resolveCafeIdBigInt(id);
      if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
      if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      const body = await req.json() as { name?: string; branchCode?: string; phone?: string; email?: string; city?: string; address?: string; isMainBranch?: boolean };
      if (!body.name) return NextResponse.json({ success: false, message: "name required" }, { status: 400 });
      const branchCode = body.branchCode || body.name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 6) + "-" + Date.now().toString(36).slice(-3).toUpperCase();
      const row = await prisma.cafeBranch.create({
        data: {
          cafeId: cid,
          branchCode,
          name: body.name,
          phone: body.phone ?? null,
          email: body.email ?? null,
          city: body.city ?? null,
          address: body.address ?? null,
          isMainBranch: !!body.isMainBranch,
        },
      });
      return NextResponse.json({ success: true, data: { id: String(row.id), branchCode: row.branchCode, name: row.name } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
