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

function gateCafe(caller: { roles?: string[]; cafeId?: string }, cafeId: bigint): boolean {
  if (caller.roles?.includes("SUPER_ADMIN")) return true;
  return String(caller.cafeId ?? "") === String(cafeId);
}


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "KITCHEN"], async (caller) => {
    const { id } = await params;
    const cid = await resolveCafeIdBigInt(id);
    if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
    if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    const row = await prisma.cafe.findUnique({ where: { id: cid }, select: { settings: true, currency: true, taxRate: true, timezone: true } });
    return NextResponse.json({
      success: true,
      data: {
        currency: row?.currency,
        taxRate: row ? Number(row.taxRate ?? 0) : 0,
        timezone: row?.timezone,
        settings: row?.settings ?? null,
      },
    });
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id } = await params;
      const cid = await resolveCafeIdBigInt(id);
      if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
      if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      const body = await req.json() as { settings?: object; currency?: string; taxRate?: number; timezone?: string };
      const data: Record<string, unknown> = {};
      if (body.settings !== undefined) data.settings = body.settings as object;
      if (body.currency !== undefined) data.currency = body.currency;
      if (body.taxRate !== undefined) data.taxRate = body.taxRate;
      if (body.timezone !== undefined) data.timezone = body.timezone;
      const row = await prisma.cafe.update({ where: { id: cid }, data });
      return NextResponse.json({ success: true, data: { id: String(row.id) } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
