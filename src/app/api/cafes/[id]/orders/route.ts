import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * GET /api/cafes/[id]/orders
 *
 * Cafe-scoped list of orders for cafe-admin + KDS pages.
 *
 * Query params:
 *   ?status=pending,preparing,ready  comma-separated filter
 *   ?limit=100                       default 200
 *
 * Auth: OWNER/MANAGER/CASHIER/KITCHEN scoped to their own cafe,
 * SUPER_ADMIN can read any cafe.
 *
 * Returns orders ordered by placedAt DESC with items inlined.
 */
async function resolveCafeIdBigInt(raw: string): Promise<bigint | null> {
  if (/^\d+$/.test(raw)) {
    try {
      const exists = await prisma.cafe.findUnique({
        where: { id: BigInt(raw) },
        select: { id: true },
      });
      if (exists) return exists.id;
    } catch { /* fall through */ }
  }
  const byCode = await prisma.cafe.findFirst({
    where: { cafeCode: raw },
    select: { id: true },
  });
  if (byCode) return byCode.id;
  const bySlug = await prisma.cafe.findFirst({
    where: { slug: raw },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    req,
    ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "KITCHEN"],
    async (caller) => {
      try {
        const { id } = await params;
        const realCafeId = await resolveCafeIdBigInt(id);
        if (!realCafeId) {
          return NextResponse.json(
            { success: false, message: "Cafe not found" },
            { status: 404 }
          );
        }

        // Tenant gate: non-super-admin can only read their own cafe.
        const isSuper = caller.roles?.includes("SUPER_ADMIN");
        if (!isSuper) {
          const callerCafeId = (caller as { cafeId?: string }).cafeId;
          if (!callerCafeId || String(callerCafeId) !== String(realCafeId)) {
            return NextResponse.json(
              { success: false, message: "Forbidden" },
              { status: 403 }
            );
          }
        }

        const url = new URL(req.url);
        const statusFilter = url.searchParams.get("status");
        const limit = Math.min(
          Math.max(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 1),
          500
        );

        const where: Record<string, unknown> = { cafeId: realCafeId };
        if (statusFilter) {
          const statuses = statusFilter.split(",").map((s) => s.trim()).filter(Boolean);
          if (statuses.length > 0) where.status = { in: statuses };
        }

        const orders = await prisma.order.findMany({
          where,
          orderBy: { placedAt: "desc" },
          take: limit,
          include: {
            items: {
              include: {
                menuItem: { select: { name: true, image: true } },
                options:  { orderBy: { id: "asc" } },
              },
            },
            table: { select: { tableNumber: true, tableName: true } },
            customer: { select: { name: true, phone: true } },
          },
        });

        return NextResponse.json({
          success: true,
          data: orders.map((o) => ({
            id: String(o.id),
            orderNumber: o.orderNumber,
            cafeId: String(o.cafeId),
            tableId: o.tableId ? String(o.tableId) : null,
            tableNumber: o.table?.tableNumber ?? null,
            customerName: o.customer?.name ?? null,
            customerPhone: o.customer?.phone ?? null,
            type: o.orderType,
            orderType: o.orderType,
            source: o.source,
            status: o.status,
            paymentStatus: o.paymentStatus,
            subtotal: Number(o.subtotal),
            discountAmount: Number(o.discountAmount),
            taxAmount: Number(o.taxAmount),
            totalAmount: Number(o.totalAmount),
            notes: o.notes,
            placedAt: o.placedAt.toISOString(),
            createdAt: o.createdAt.toISOString(),
            completedAt: o.completedAt?.toISOString() ?? null,
            items: o.items.map((it) => ({
              id: String(it.id),
              menuItemId: String(it.menuItemId),
              itemName: it.itemName || it.menuItem?.name || "Item",
              image: it.menuItem?.image ?? null,
              unitPrice: Number(it.unitPrice),
              quantity: it.quantity,
              totalPrice: Number(it.totalPrice),
              notes: it.notes,
              // Modifier choices captured at order time as a flat
              // [{ group, choice, price }] list — the OrderItemOption
              // rows are immutable snapshots so renaming a modifier in
              // the menu later does not change historical receipts.
              modifiers: it.options.map((opt) => ({
                id: String(opt.id),
                group: opt.optionName,
                choice: opt.optionValue,
                price: Number(opt.extraPrice),
              })),
            })),
          })),
        });
      } catch (err) {
        console.error("[/api/cafes/[id]/orders] error:", err);
        return NextResponse.json(
          { success: false, message: "Server error" },
          { status: 500 }
        );
      }
    }
  );
}
