/**
 * GET /api/public/qr-resolve/[token]
 *
 * Public (no-auth) endpoint that resolves a QR-code token to its
 * cafe/branch/table tuple so a customer can be redirected to the right
 * customer menu. Used by /t/[token]/page.tsx after Phase 4d (no Firestore).
 *
 * Behavior:
 *   - Find QRCode row by token (unique). If missing or inactive → 404.
 *   - Return cafeId, branchId, tableId, tableName, plus a lightweight
 *     cafe summary (name, logo, currency) so the secure landing page can
 *     paint immediately without a second request.
 *   - Bumps scanCount / lastScannedAt for analytics.
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Missing token" },
        { status: 400 }
      );
    }
    const qr = await prisma.qRCode.findUnique({
      where: { token },
      include: {
        // QRCode.tableId is a single optional FK, but qrCode is also pointed
        // at from CafeTable.qrCodeId — we want the table that uses this QR.
        tables: {
          select: { id: true, tableNumber: true, tableName: true, branchId: true, cafeId: true },
          take: 1,
        },
      },
    });
    if (!qr || qr.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Invalid or expired QR code" },
        { status: 404 }
      );
    }

    // Prefer the CafeTable link; fall back to QRCode's own ids.
    const linkedTable = qr.tables[0];
    const cafeIdStr = String(linkedTable?.cafeId ?? qr.cafeId);
    const branchIdStr = String(linkedTable?.branchId ?? qr.branchId);
    const tableIdStr = linkedTable
      ? String(linkedTable.id)
      : qr.tableId
      ? String(qr.tableId)
      : "default";
    const tableName = linkedTable?.tableName || linkedTable?.tableNumber || tableIdStr;

    // Fetch a light cafe summary alongside.
    const cafe = await prisma.cafe.findUnique({
      where: { id: BigInt(cafeIdStr) },
      select: {
        id: true,
        name: true,
        slug: true,
        cafeCode: true,
        logo: true,
        coverImage: true,
        currency: true,
        nameAr: true,
      },
    });

    // Fire-and-forget analytics update (don't block the response).
    prisma.qRCode
      .update({
        where: { id: qr.id },
        data: { scanCount: { increment: 1 }, lastScannedAt: new Date() },
      })
      .catch(() => {
        /* swallow */
      });

    return NextResponse.json({
      success: true,
      data: {
        cafeId: cafeIdStr,
        branchId: branchIdStr,
        tableId: tableIdStr,
        tableName,
        qrType: qr.qrType,
        cafe: cafe
          ? {
              id: String(cafe.id),
              name: cafe.name,
              nameAr: cafe.nameAr,
              slug: cafe.slug,
              cafeCode: cafe.cafeCode,
              logo: cafe.logo,
              coverImage: cafe.coverImage,
              currency: cafe.currency,
            }
          : null,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/public/qr-resolve/[token]] error:", msg);
    return NextResponse.json(
      { success: false, message: "Failed to resolve QR code" },
      { status: 500 }
    );
  }
}
