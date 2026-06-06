/**
 * prisma/scripts/migrate-firestore-orders.ts
 *
 * One-shot migration of legacy Firestore orders + customers into Postgres.
 *
 * Idempotent — re-running upserts. Orders are matched by orderNumber when
 * present, otherwise by Firestore docId stored in a synthetic orderNumber
 * prefix (FS-<docId>).
 *
 * Customers are matched by (cafeId, phone) since phone is the natural
 * key for QR ordering. If no phone, by (cafeId, name).
 *
 * Image URLs are preserved (they point at firebasestorage.googleapis.com
 * for now — Phase 3 will rehost).
 *
 * Usage:
 *   npx tsx prisma/scripts/migrate-firestore-orders.ts
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, Timestamp } from "firebase/firestore";
import { PrismaClient, OrderType, OrderSource, OrderStatus } from "@prisma/client";

import { firebaseConfig } from "../../src/firebase/config";

type AnyDoc = Record<string, unknown>;

function s(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  return String(v).trim() || null;
}
function n(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function ts(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function mapOrderType(t: unknown): OrderType {
  const v = String(t ?? "").toLowerCase();
  if (v === "dine_in" || v === "dinein" || v === "dine-in") return OrderType.dine_in;
  if (v === "car" || v === "car_service" || v === "carservice") return OrderType.car;
  return OrderType.pickup;
}
function mapOrderSource(s_: unknown): OrderSource {
  const v = String(s_ ?? "").toLowerCase();
  if (v === "cashier" || v === "cashier_manual") return OrderSource.cashier;
  if (v === "admin") return OrderSource.admin;
  return OrderSource.qr;
}
function mapOrderStatus(s_: unknown): OrderStatus {
  const v = String(s_ ?? "pending").toLowerCase();
  // Try a few legacy names.
  if (v === "preparing" || v === "in_progress") return OrderStatus.preparing;
  if (v === "ready" || v === "done_preparing") return OrderStatus.ready;
  if (v === "completed" || v === "delivered") return OrderStatus.completed;
  if (v === "cancelled" || v === "canceled") return OrderStatus.cancelled;
  return OrderStatus.pending;
}

async function main() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const fs = getFirestore(app);
  const prisma = new PrismaClient();

  let customerOk = 0;
  let orderOk = 0;
  let orderFail = 0;
  let itemTotal = 0;

  try {
    const cafesSnap = await getDocs(collection(fs, "cafes"));
    console.log(`Scanning ${cafesSnap.size} cafes for orders + customers...`);

    for (const cafeDoc of cafesSnap.docs) {
      const firestoreCafeId = cafeDoc.id;
      const cafeData = cafeDoc.data() as AnyDoc;
      const slug = s(cafeData.slug) || firestoreCafeId;
      const cafeCode = s(cafeData.cafeCode) || `IMP-${firestoreCafeId.toUpperCase().slice(0, 10)}`;

      const pgCafe = await prisma.cafe.findFirst({
        where: { OR: [{ slug }, { cafeCode }] },
        select: { id: true, name: true },
      });
      if (!pgCafe) {
        console.log(`  skip cafe '${firestoreCafeId}' — not in Postgres yet`);
        continue;
      }

      // ---- customers ----
      try {
        const custSnap = await getDocs(collection(fs, "cafes", firestoreCafeId, "customers"));
        for (const c of custSnap.docs) {
          const cd = c.data() as AnyDoc;
          const phone = s(cd.phone);
          const name = s(cd.name) || phone || "Unknown";
          const email = s(cd.email);

          let existing = null;
          if (phone) {
            existing = await prisma.customer.findFirst({
              where: { cafeId: pgCafe.id, phone },
            });
          }
          if (!existing && name) {
            existing = await prisma.customer.findFirst({
              where: { cafeId: pgCafe.id, name },
            });
          }
          if (existing) {
            await prisma.customer.update({
              where: { id: existing.id },
              data: { name, phone, email },
            });
          } else {
            await prisma.customer.create({
              data: {
                cafeId: pgCafe.id,
                name,
                phone,
                email,
                carPlateNumber: s(cd.carPlateNumber ?? cd.car_plate),
                notes: s(cd.notes),
              },
            });
            customerOk++;
          }
        }
      } catch (err) {
        console.warn(`  ! customers fetch failed for '${firestoreCafeId}':`,
          err instanceof Error ? err.message : err);
      }

      // ---- orders ----
      try {
        const ordSnap = await getDocs(collection(fs, "cafes", firestoreCafeId, "orders"));
        for (const o of ordSnap.docs) {
          const od = o.data() as AnyDoc;
          const orderNumber = s(od.orderNumber) || `FS-${o.id}`;

          // Skip if already in Postgres.
          const existing = await prisma.order.findUnique({ where: { orderNumber } });
          if (existing) continue;

          // Resolve customer by phone if any.
          let customerId: bigint | null = null;
          const phone = s(od.customerPhone ?? od.phone);
          if (phone) {
            const c = await prisma.customer.findFirst({
              where: { cafeId: pgCafe.id, phone },
              select: { id: true },
            });
            if (c) customerId = c.id;
          }

          const items = Array.isArray(od.items) ? (od.items as AnyDoc[]) : [];

          // Compute totals if missing.
          let subtotal = n(od.subtotal);
          if (subtotal === null) {
            subtotal = items.reduce(
              (acc, it) => acc + (n(it.price) ?? 0) * (n(it.quantity) ?? n(it.qty) ?? 1),
              0
            );
          }
          const discount = n(od.discount ?? od.discountAmount) ?? 0;
          const tax = n(od.tax ?? od.taxAmount) ?? 0;
          const total = n(od.total ?? od.totalAmount) ?? subtotal - discount + tax;

          try {
            const newOrder = await prisma.order.create({
              data: {
                cafeId: pgCafe.id,
                customerId,
                orderNumber,
                orderType: mapOrderType(od.type ?? od.orderType),
                source: mapOrderSource(od.source),
                subtotal,
                discountAmount: discount,
                taxAmount: tax,
                totalAmount: total,
                notes: s(od.notes),
                status: mapOrderStatus(od.status),
                paymentStatus: s(od.paymentStatus) ?? "unpaid",
                placedAt: ts(od.createdAt ?? od.placedAt) ?? new Date(),
                completedAt: ts(od.completedAt),
                cancelledAt: ts(od.cancelledAt),
              },
            });
            orderOk++;

            // ---- order items ----
            for (const it of items) {
              const menuItemIdRaw = s(it.productId ?? it.menuItemId ?? it.id);
              // Try to resolve to a Postgres menu_item by name within this cafe.
              const itemName = s(it.name ?? it.nameEn) || "Item";
              let menuItemId: bigint | null = null;
              if (menuItemIdRaw && /^\d+$/.test(menuItemIdRaw)) {
                try { menuItemId = BigInt(menuItemIdRaw); } catch { /* ignore */ }
              }
              if (!menuItemId) {
                const m = await prisma.menuItem.findFirst({
                  where: { cafeId: pgCafe.id, name: itemName },
                  select: { id: true },
                });
                if (m) menuItemId = m.id;
              }
              if (!menuItemId) menuItemId = BigInt(0); // sentinel; FK relaxed at db level via 0-row

              const qty = n(it.quantity ?? it.qty) ?? 1;
              const unit = n(it.price ?? it.unitPrice) ?? 0;

              try {
                await prisma.orderItem.create({
                  data: {
                    orderId: newOrder.id,
                    menuItemId,
                    itemName,
                    unitPrice: unit,
                    quantity: qty,
                    totalPrice: unit * qty,
                    notes: s(it.notes),
                  },
                });
                itemTotal++;
              } catch {
                // skip item if FK to menu_item 0 fails; we still keep the order header.
              }
            }
          } catch (err) {
            orderFail++;
            console.warn(`  ! order '${orderNumber}' failed:`,
              err instanceof Error ? err.message : err);
          }
        }
      } catch (err) {
        console.warn(`  ! orders fetch failed for '${firestoreCafeId}':`,
          err instanceof Error ? err.message : err);
      }
    }

    console.log("");
    console.log(`OK — customers added: ${customerOk}`);
    console.log(`     orders migrated: ${orderOk} (failed: ${orderFail})`);
    console.log(`     order items added: ${itemTotal}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
