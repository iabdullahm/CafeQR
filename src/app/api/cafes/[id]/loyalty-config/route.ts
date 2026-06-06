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
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"], async (caller) => {
    const { id } = await params;
    const cid = await resolveCafeIdBigInt(id);
    if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
    if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    const row = await prisma.loyaltyProgram.findUnique({ where: { cafeId: cid } });
    return NextResponse.json({
      success: true,
      data: row ? {
        cafeId: String(row.cafeId),
        status: row.status,
        cupsRequired: row.cupsRequired,
        rewardItem: row.rewardItem,
        countOnlyCoffee: row.countOnlyCoffee,
        eligibleCategories: row.eligibleCategories,
        autoReset: row.autoReset,
        branchRules: row.branchRules,
      } : null,
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
      const body = await req.json() as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      for (const k of ["status", "cupsRequired", "rewardItem", "countOnlyCoffee", "eligibleCategories", "autoReset", "branchRules"]) {
        if (k in body) data[k] = body[k];
      }
      const row = await prisma.loyaltyProgram.upsert({
        where: { cafeId: cid },
        update: data,
        create: { cafeId: cid, ...data },
      });
      return NextResponse.json({ success: true, data: { cafeId: String(row.cafeId), cupsRequired: row.cupsRequired } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
