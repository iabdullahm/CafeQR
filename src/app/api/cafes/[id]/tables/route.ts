import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
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

function siteOrigin(req: Request): string {
  const host = req.headers.get("host") || "cafe-qr.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "KITCHEN"], async (caller) => {
    const { id } = await params;
    const cid = await resolveCafeIdBigInt(id);
    if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
    if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    const rows = await prisma.cafeTable.findMany({
      where: { cafeId: cid },
      orderBy: [{ branchId: "asc" }, { tableNumber: "asc" }],
      include: { qrCode: { select: { token: true, url: true, code: true } } },
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        cafeId: String(r.cafeId),
        branchId: String(r.branchId),
        tableNumber: r.tableNumber,
        tableName: r.tableName,
        seatsCount: r.seatsCount,
        status: r.status,
        qrToken: r.qrCode?.token ?? null,
        qrUrl: r.qrCode?.url ?? null,
        qrCode: r.qrCode?.code ?? null,
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
      const body = await req.json() as { branchId?: string; tableNumber?: string; tableName?: string; seatsCount?: number; generateQr?: boolean };
      if (!body.branchId || !body.tableNumber) {
        return NextResponse.json({ success: false, message: "branchId, tableNumber required" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const table = await tx.cafeTable.create({
          data: {
            cafeId: cid,
            branchId: BigInt(body.branchId!),
            tableNumber: body.tableNumber!,
            tableName: body.tableName ?? null,
            seatsCount: body.seatsCount ?? 2,
          },
        });

        let qr: { id: bigint; token: string; url: string; code: string } | null = null;
        if (body.generateQr !== false) {
          const token = randomBytes(16).toString("hex");
          const code = `QR-${cid}-${body.branchId!}-${table.id}`;
          const url = `${siteOrigin(req)}/c/${cid}/${body.branchId}/${table.id}?t=${token}`;
          const qrRow = await tx.qRCode.create({
            data: {
              cafeId: cid,
              branchId: BigInt(body.branchId!),
              tableId: table.id,
              qrType: "table",
              code,
              token,
              url,
            },
          });
          await tx.cafeTable.update({ where: { id: table.id }, data: { qrCodeId: qrRow.id } });
          qr = { id: qrRow.id, token, url, code };
        }
        return { table, qr };
      });

      return NextResponse.json({
        success: true,
        data: {
          id: String(result.table.id),
          tableNumber: result.table.tableNumber,
          qrToken: result.qr?.token ?? null,
          qrUrl: result.qr?.url ?? null,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
