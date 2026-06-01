/**
 * POST /api/orders/place-pg
 *
 * Postgres-only order placement. No Firebase Admin SDK dependency.
 *
 * Cafe id resolution: customers scan a QR encoded with a Firestore-era
 * id (string like "CAF-1716173400"). We resolve it to a real Postgres
 * bigint by trying, in order:
 *   1. Direct numeric parse
 *   2. cafeCode lookup
 *   3. slug lookup
 *   4. Fallback to seeded Demo Cafe (id=1) so the order isn't lost.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PlaceOrderInput, OrderItemInput } from "@/lib/orders-logic";
import { OrderType as PrismaOrderType, OrderSource as PrismaOrderSource } from "@prisma/client";

const VALID_INPUT_TYPES = ["DINE_IN", "CAR_SERVICE", "TAKEAWAY"] as const;
type ValidInputType = (typeof VALID_INPUT_TYPES)[number];

function mapOrderType(t: ValidInputType): PrismaOrderType {
  switch (t) {
    case "DINE_IN":      return PrismaOrderType.dine_in;
    case "CAR_SERVICE":  return PrismaOrderType.car;
    case "TAKEAWAY":     return PrismaOrderType.pickup;
  }
}

function mapOrderSource(s: string | undefined): PrismaOrderSource {
  if (s === "cashier_manual") return PrismaOrderSource.cashier;
  if (s === "admin") return PrismaOrderSource.admin;
  return PrismaOrderSource.qr;
}

function genOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 1000).toString(36).toUpperCase().padStart(2, "0");
  return `ORD-${ts}-${rnd}`;
}

function safeBigInt(v: unknown): bigint | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v);
  if (!/^\d+$/.test(s)) return null;
  try { return BigInt(s); } catch { return null; }
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

const FALLBACK_CAFE_ID = BigInt(1);

async function resolveCafeId(raw: unknown): Promise<bigint> {
  if (raw === null || raw === undefined || raw === "") return FALLBACK_CAFE_ID;
  const s = String(raw).trim();

  if (/^\d+$/.test(s)) {
    try {
      const id = BigInt(s);
      const exists = await prisma.cafe.findUnique({ where: { id }, select: { id: true } });
      if (exists) return exists.id;
    } catch { /* fall through */ }
  }

  const byCode = await prisma.cafe.findFirst({ where: { cafeCode: s }, select: { id: true } });
  if (byCode) return byCode.id;

  const bySlug = await prisma.cafe.findFirst({ where: { slug: s }, select: { id: true } });
  if (bySlug) return bySlug.id;

  console.warn(`[place-pg] Unknown cafe id '${s}' — using fallback Demo Cafe.`);
  return FALLBACK_CAFE_ID;
}

export async function POST(req: Request) {
  let input: PlaceOrderInput;
  try {
    input = (await req.json()) as PlaceOrderInput;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { cafeId, branchId, tableId, type, items } = input;
  if (!cafeId || !type || !items?.length) {
    return NextResponse.json(
      { success: false, message: "Missing required fields: cafeId, type, items" },
      { status: 400 }
    );
  }
  if (!VALID_INPUT_TYPES.includes(type as ValidInputType)) {
    return NextResponse.json({ success: false, message: `Invalid type: ${type}` }, { status: 400 });
  }
  for (const it of items as OrderItemInput[]) {
    if (!it.productId || typeof it.unitPrice !== "number" || typeof it.quantity !== "number" || it.quantity < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid item: productId, unitPrice, quantity required" },
        { status: 400 }
      );
    }
  }

  let subtotal = 0;
  for (const it of items as OrderItemInput[]) {
    subtotal += it.unitPrice * it.quantity;
  }
  const discountAmount = Number(input.rewardDiscount ?? 0);
  const taxAmount = 0;
  const totalAmount = subtotal - discountAmount + taxAmount;

  const cafeIdBig = await resolveCafeId(cafeId);
  const branchIdBig = safeBigInt(branchId);
  const tableIdBig = safeBigInt(tableId);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          cafeId: cafeIdBig,
          branchId: branchIdBig,
          tableId: tableIdBig,
          orderNumber: genOrderNumber(),
          orderType: mapOrderType(type as ValidInputType),
          source: mapOrderSource(input.source),
          subtotal: round3(subtotal),
          discountAmount: round3(discountAmount),
          taxAmount: round3(taxAmount),
          totalAmount: round3(totalAmount),
          notes: input.notes ?? null,
          status: "pending",
          paymentStatus: input.paymentMethod === "cash" ? "unpaid" : "paid",
        },
      });

      for (const it of items as OrderItemInput[]) {
        const menuItemIdBig = safeBigInt(it.productId);
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            menuItemId: menuItemIdBig ?? BigInt(0),
            itemName: it.productName ?? it.nameEn ?? "Item",
            unitPrice: round3(it.unitPrice),
            quantity: it.quantity,
            totalPrice: round3(it.unitPrice * it.quantity),
            notes: it.notes ?? null,
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(order.id),
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        placedAt: order.placedAt.toISOString(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/orders/place-pg] error:", msg);
    return NextResponse.json(
      { success: false, message: "Order service is temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
