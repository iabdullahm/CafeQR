/**
 * POST /api/orders/place-pg
 *
 * Postgres-only order placement. No Firebase Admin SDK dependency.
 *
 * Each item may carry `optionValueIds: string[]` — the customer's
 * modifier selections. The server fetches every chosen MenuItemOptionValue,
 * validates that the selections respect each option group's min/max
 * constraints, recomputes unitPrice = base + sum(extraPrice), and writes
 * one OrderItemOption row per selected value so receipts, KDS, and
 * historical reports can display them.
 *
 * Cafe id resolution (legacy QR codes carried Firestore-era strings):
 *   1. numeric id, 2. cafeCode, 3. slug, 4. fallback Demo Cafe.
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

type ItemSelection = {
  it: OrderItemInput;
  menuItemIdBig: bigint | null;
  valueIds: bigint[];               // chosen MenuItemOptionValue ids (deduped)
  resolvedValues: Array<{           // hydrated from DB, used for price + persistence
    id: bigint;
    valueName: string;
    extraPrice: number;
    optionId: bigint;
    optionName: string;
  }>;
  baseUnitPrice: number;            // authoritative from DB if menuItem exists, else client unitPrice
  computedUnitPrice: number;        // base + sum(extraPrice)
};

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
  // SECURITY / DoS guard: cap the order size so a malicious client cannot
  // queue gigabyte-sized writes or OOM the server with a single POST.
  const MAX_ITEMS = 100;
  const MAX_QTY = 99;
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { success: false, message: `Too many items (max ${MAX_ITEMS}).` },
      { status: 400 }
    );
  }
  for (const it of items as OrderItemInput[]) {
    if (typeof it.quantity === "number" && it.quantity > MAX_QTY) {
      return NextResponse.json(
        { success: false, message: `Quantity too high (max ${MAX_QTY} per item).` },
        { status: 400 }
      );
    }
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

  // Collect every distinct chosen MenuItemOptionValue id across all items.
  const selections: ItemSelection[] = (items as OrderItemInput[]).map((it) => {
    const menuItemIdBig = safeBigInt(it.productId);
    const raw = (it.options as { optionValueIds?: unknown[] } | undefined)?.optionValueIds;
    const valueIds: bigint[] = [];
    if (Array.isArray(raw)) {
      for (const v of raw) {
        const b = safeBigInt(v);
        if (b !== null) valueIds.push(b);
      }
    }
    return {
      it,
      menuItemIdBig,
      valueIds: Array.from(new Set(valueIds.map((b) => b.toString()))).map((s) => BigInt(s)),
      resolvedValues: [],
      baseUnitPrice: it.unitPrice,
      computedUnitPrice: it.unitPrice,
    };
  });

  // Single round-trip to hydrate all values + their parent option groups.
  const allValueIds = Array.from(new Set(selections.flatMap((s) => s.valueIds.map((v) => v.toString())))).map((s) => BigInt(s));
  const valueRows = allValueIds.length > 0
    ? await prisma.menuItemOptionValue.findMany({
        where: { id: { in: allValueIds } },
        include: { option: { select: { id: true, name: true, menuItemId: true, minSelect: true, maxSelect: true, type: true } } },
      })
    : [];
  const valueById = new Map(valueRows.map((v) => [v.id.toString(), v]));

  // Also fetch authoritative base prices for items that exist in DB.
  const menuItemIds = selections
    .map((s) => s.menuItemIdBig)
    .filter((v): v is bigint => v !== null);
  const baseRows = menuItemIds.length > 0
    ? await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        select: { id: true, price: true },
      })
    : [];
  const baseById = new Map(baseRows.map((r) => [r.id.toString(), Number(r.price)]));

  // Per-item: resolve, validate, recompute price.
  for (const sel of selections) {
    if (sel.menuItemIdBig && baseById.has(sel.menuItemIdBig.toString())) {
      sel.baseUnitPrice = baseById.get(sel.menuItemIdBig.toString())!;
    }
    let extras = 0;
    const byOption = new Map<string, { id: bigint; name: string; chosen: number; minSelect: number; maxSelect: number; type: string }>();
    for (const vid of sel.valueIds) {
      const v = valueById.get(vid.toString());
      if (!v) continue;
      // Modifier value must belong to the item being ordered.
      if (sel.menuItemIdBig && v.option.menuItemId !== sel.menuItemIdBig) continue;
      extras += Number(v.extraPrice);
      sel.resolvedValues.push({
        id: v.id,
        valueName: v.valueName,
        extraPrice: Number(v.extraPrice),
        optionId: v.option.id,
        optionName: v.option.name,
      });
      const key = v.option.id.toString();
      const existing = byOption.get(key);
      if (existing) existing.chosen += 1;
      else byOption.set(key, {
        id: v.option.id,
        name: v.option.name,
        chosen: 1,
        minSelect: v.option.minSelect,
        maxSelect: v.option.maxSelect,
        type: v.option.type,
      });
    }
    // Enforce min/max per option group that the customer touched.
    for (const grp of byOption.values()) {
      if (grp.maxSelect > 0 && grp.chosen > grp.maxSelect) {
        return NextResponse.json(
          { success: false, message: `'${grp.name}' allows at most ${grp.maxSelect} choice(s).` },
          { status: 400 }
        );
      }
      if (grp.minSelect > 0 && grp.chosen < grp.minSelect) {
        return NextResponse.json(
          { success: false, message: `'${grp.name}' requires at least ${grp.minSelect} choice(s).` },
          { status: 400 }
        );
      }
    }
    sel.computedUnitPrice = round3(sel.baseUnitPrice + extras);
  }

  // Subtotal from server-recomputed unit prices, not client-sent.
  let subtotal = 0;
  for (const sel of selections) {
    subtotal += sel.computedUnitPrice * sel.it.quantity;
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

      for (const sel of selections) {
        const created = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            menuItemId: sel.menuItemIdBig ?? BigInt(0),
            itemName: sel.it.productName ?? sel.it.nameEn ?? "Item",
            unitPrice: sel.computedUnitPrice,
            quantity: sel.it.quantity,
            totalPrice: round3(sel.computedUnitPrice * sel.it.quantity),
            notes: sel.it.notes ?? null,
          },
        });
        if (sel.resolvedValues.length > 0) {
          await tx.orderItemOption.createMany({
            data: sel.resolvedValues.map((v) => ({
              orderItemId: created.id,
              optionName: v.optionName,
              optionValue: v.valueName,
              extraPrice: v.extraPrice,
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
    return NextResponse.json(
      { success: false, message: "Order service is temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
