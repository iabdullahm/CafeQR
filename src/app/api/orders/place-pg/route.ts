/**
 * POST /api/orders/place-pg
 *
 * Postgres-only order placement. Replaces /api/orders/place for environments
 * where Firebase Admin SDK can't initialise (e.g. service-account key
 * generation blocked by org policy).
 *
 * No dependency on FIREBASE_SERVICE_ACCOUNT_KEY — pure Prisma + Neon.
 *
 * Payload shape: identical to /api/orders/place (PlaceOrderInput) so the
 * client can switch with a one-line URL change.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PlaceOrderInput, OrderItemInput } from "@/lib/orders-logic";

const VALID_TYPES = ["DINE_IN", "CAR_SERVICE", "TAKEAWAY"] as const;
type ValidType = (typeof VALID_TYPES)[number];

function genOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 1000)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `ORD-${ts}-${rnd}`;
}

export async function POST(req: Request) {
  let input: PlaceOrderInput;
  try {
    input = (await req.json()) as PlaceOrderInput;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { cafeId, branchId, tableId, type, items } = input;
  if (!cafeId || !branchId || !type || !items?.length) {
    return NextResponse.json(
      {
        success: false,
        message: "Missing required fields: cafeId, branchId, type, items",
      },
      { status: 400 }
    );
  }
  if (!VALID_TYPES.includes(type as ValidType)) {
    return NextResponse.json(
      { success: false, message: `Invalid type: ${type}` },
      { status: 400 }
    );
  }
  for (const it of items as OrderItemInput[]) {
    if (
      !it.productId ||
      typeof it.unitPrice !== "number" ||
      typeof it.quantity !== "number" ||
      it.quantity < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid item: productId, unitPrice, quantity required",
        },
        { status: 400 }
      );
    }
  }

  // Compute totals server-side
  let subtotal = 0;
  for (const it of items as OrderItemInput[]) {
    const lineTotal = it.unitPrice * it.quantity;
    subtotal += lineTotal;
  }
  const discountAmount = Number(input.rewardDiscount ?? 0);
  const taxAmount = 0;
  const totalAmount = subtotal - discountAmount + taxAmount;

  const cafeIdBig = safeBigInt(cafeId);
  if (!cafeIdBig) {
    return NextResponse.json(
      { success: false, message: "Invalid cafeId" },
      { status: 400 }
    );
  }
  const branchIdBig = safeBigInt(branchId);
  const tableIdBig = safeBigInt(tableId);

  // Map client source value to enum used in schema
  const sourceEnum: "qr" | "in_store" =
    input.source === "cashier_manual" ? "in_store" : "qr";

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          cafeId: cafeIdBig,
          branchId: branchIdBig,
          tableId: tableIdBig,
          orderNumber: genOrderNumber(),
          orderType: type as ValidType,
          source: sourceEnum,
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
        const itemTotal = it.unitPrice * it.quantity;
        const menuItemIdBig = safeBigInt(it.productId);
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            // Sentinel 0 when productId isn't a real DB row (legacy Firestore string ids)
            menuItemId: menuItemIdBig ?? BigInt(0),
            itemName: it.productName ?? it.nameEn ?? "Item",
            unitPrice: round3(it.unitPrice),
            quantity: it.quantity,
            totalPrice: round3(itemTotal),
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
      {
        success: false,
        message:
          "Order service is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 }
    );
  }
}

// ----- helpers -----

function safeBigInt(v: unknown): bigint | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v);
  if (!/^\d+$/.test(s)) return null;
  try {
    return BigInt(s);
  } catch {
    return null;
  }
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
