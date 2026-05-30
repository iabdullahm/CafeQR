/**
 * POST /api/orders/place-pg
 *
 * Postgres-only order placement. Replaces /api/orders/place for environments
 * where Firebase Admin SDK can't initialise (e.g. service-account key
 * generation blocked by org policy).
 *
 * Why a parallel route?
 *   - Zero risk to the existing /api/orders/place — we ship this in parallel
 *     and switch the client only after we verify it works.
 *   - No dependency on FIREBASE_SERVICE_ACCOUNT_KEY — pure Prisma + Neon.
 *
 * Trade-offs:
 *   - No real-time order tracking in customer success page (Firestore
 *     onSnapshot replaced with polling).
 *   - Loyalty / customer linking deferred — only the order rows are written.
 *
 * Payload shape: identical to /api/orders/place so the client can switch
 * with a one-line URL change.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  PlaceOrderInput,
  PlaceOrderItem,
} from "@/lib/orders-logic";

const VALID_TYPES = ["DINE_IN", "CAR_SERVICE", "TAKEAWAY"] as const;
type ValidType = (typeof VALID_TYPES)[number];
const VALID_SOURCES = ["qr", "in_store", "phone"] as const;

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
  for (const it of items) {
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

  // Compute totals server-side to avoid trusting the client.
  let subtotal = 0;
  for (const it of items) {
    const lineTotal = it.unitPrice * it.quantity;
    const optionsTotal = (it.options ?? []).reduce(
      (s, o) => s + (o.extraPrice ?? 0),
      0
    );
    subtotal += lineTotal + optionsTotal * it.quantity;
  }
  const discountAmount = Number(input.discountAmount ?? 0);
  const taxAmount = Number(input.taxAmount ?? 0);
  const totalAmount = subtotal - discountAmount + taxAmount;

  // Resolve foreign keys. The customer page passes string ids like "1" or
  // "default"; coerce gracefully.
  const cafeIdBig = safeBigInt(cafeId);
  if (!cafeIdBig) {
    return NextResponse.json(
      { success: false, message: "Invalid cafeId" },
      { status: 400 }
    );
  }
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
          orderType: type as ValidType,
          source: (input.source ?? "qr") as (typeof VALID_SOURCES)[number],
          subtotal: round3(subtotal),
          discountAmount: round3(discountAmount),
          taxAmount: round3(taxAmount),
          totalAmount: round3(totalAmount),
          notes: input.notes ?? null,
          status: "pending",
          paymentStatus: input.paymentMethod === "cash" ? "unpaid" : "paid",
        },
      });

      // Bulk-insert items
      for (const it of items as PlaceOrderItem[]) {
        const optionsTotal = (it.options ?? []).reduce(
          (s, o) => s + (o.extraPrice ?? 0),
          0
        );
        const itemTotal = (it.unitPrice + optionsTotal) * it.quantity;

        const menuItemIdBig = safeBigInt(it.productId);
        // If the productId isn't a real DB row (e.g. legacy Firestore string),
        // store the line as a free-text item without a menuItemId. We allow
        // null on menuItemId in our migration, but the current schema requires
        // it — fall back to id=0 sentinel if absent.
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            menuItemId: menuItemIdBig ?? BigInt(0),
            itemName: it.name ?? "Item",
            unitPrice: round3(it.unitPrice),
            quantity: it.quantity,
            totalPrice: round3(itemTotal),
            notes: it.notes ?? null,
          },
        });

        if ((it.options ?? []).length > 0) {
          await tx.orderItemOption.createMany({
            data: it.options!.map((o) => ({
              orderItemId: orderItem.id,
              optionName: o.name ?? "",
              optionValue: o.value ?? "",
              extraPrice: round3(o.extraPrice ?? 0),
            })),
          });
        }
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

    // Customer-safe message — never leak DB internals.
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
  // Accept positive integer strings only
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
