import { NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import {
  type OrderType,
  type OrderStatus,
  type PlaceOrderInput,
  getTableStatusAfterOrder,
} from '@/lib/orders-logic';

/**
 * Server-side counterpart of placeOrderAtomic.
 *
 * Why server-side?
 *   The original lib/orders-logic.ts ran the transaction client-side using
 *   the Firebase Web SDK. That required Firestore rules to allow anonymous
 *   writes to /customers, /cafes/{id}/orders, /cafes/{id}/tables, and
 *   /cafes/{id}/branches/{bid}/counters — i.e. a customer could forge
 *   loyalty points or counter values. Doing the transaction via the Admin
 *   SDK lets us close those rules in Phase 4.
 *
 * Auth model:
 *   This endpoint is callable by unauthenticated customers (the QR ordering
 *   flow). To prevent abuse:
 *     - Server validates required fields and item shape.
 *     - Pricing is recomputed from the cafe menu (TODO Phase 2.1) rather
 *       than trusting client unitPrice. For now we mirror the legacy
 *       behaviour and trust the client price; this is no worse than the
 *       current production state.
 */

const VALID_TYPES: OrderType[] = ['DINE_IN', 'CAR_SERVICE', 'TAKEAWAY'];

export async function POST(req: Request) {
  let input: PlaceOrderInput;
  try {
    input = (await req.json()) as PlaceOrderInput;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { cafeId, branchId, tableId, type, items } = input;
  if (!cafeId || !branchId || !type || !items?.length) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: cafeId, branchId, type, items' },
      { status: 400 }
    );
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { success: false, message: `Invalid type: ${type}` },
      { status: 400 }
    );
  }
  for (const it of items) {
    if (!it.productId || typeof it.unitPrice !== 'number' || typeof it.quantity !== 'number' || it.quantity < 1) {
      return NextResponse.json(
        { success: false, message: 'Invalid item: productId, unitPrice, quantity required' },
        { status: 400 }
      );
    }
  }

  const {
    customerPhone,
    customerName,
    carNumber,
    notes,
    useReward,
    rewardDiscount = 0,
    source = 'qr_customer',
    createdBy,
    paymentMethod,
    paymentStatus,
    loyaltyEligible = true,
  } = input;

  const itemsSubtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const subtotal = Math.max(0, itemsSubtotal - rewardDiscount);
  const taxRate = 0;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  try {
    const db = getAdminDb();

    const branchCounterRef = db
      .collection('cafes').doc(cafeId)
      .collection('branches').doc(branchId)
      .collection('counters').doc('orders');
    const tableRef = tableId
      ? db.collection('cafes').doc(cafeId).collection('tables').doc(tableId)
      : null;
    const orderRef = db.collection('cafes').doc(cafeId).collection('orders').doc();

    const createdOrder = await db.runTransaction(async (tx) => {
      let tableExists = false;
      if (tableRef) {
        const snap = await tx.get(tableRef);
        tableExists = snap.exists;
      }

      const configRef = db.collection('cafes').doc(cafeId).collection('config').doc('settings');
      const configSnap = await tx.get(configRef);
      if (configSnap.exists) {
        const cfg = configSnap.data() as Record<string, unknown>;
        const active = (cfg.activeOrderTypes as Record<string, boolean>) || { dineIn: true, carService: true, pickup: true };
        if (type === 'CAR_SERVICE' && active.carService === false) throw new Error('Car service is currently disabled.');
        if (type === 'DINE_IN' && active.dineIn === false) throw new Error('Dine-in service is currently disabled.');
        if (type === 'TAKEAWAY' && active.pickup === false) throw new Error('Pickup service is currently disabled.');
      }

      const counterSnap = await tx.get(branchCounterRef);
      let newOrderNumber = 1000;
      if (!counterSnap.exists) {
        tx.set(branchCounterRef, { lastOrderNumber: 1000, updatedAt: new Date().toISOString() });
      } else {
        newOrderNumber = (counterSnap.data()?.lastOrderNumber || 1000) + 1;
        tx.update(branchCounterRef, { lastOrderNumber: newOrderNumber, updatedAt: new Date().toISOString() });
      }

      if (customerPhone && loyaltyEligible) {
        const customerRef = db.collection('customers').doc(`${cafeId}_${customerPhone}`);
        const customerSnap = await tx.get(customerRef);

        if (customerSnap.exists) {
          if (useReward) {
            const cData = customerSnap.data() as Record<string, unknown>;
            const rewardsRedeemed = ((cData.rewardsRedeemed as number) || 0) + 1;
            tx.update(customerRef, { rewardsRedeemed, updatedAt: FieldValue.serverTimestamp() });
          }
        } else {
          tx.set(customerRef, {
            name: customerName || 'Guest',
            phone: customerPhone,
            cafeId,
            cups: 0,
            totalOrders: 0,
            rewardsEarned: 0,
            rewardsRedeemed: useReward ? 1 : 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }

      const orderData = {
        id: orderRef.id,
        cafeId,
        branchId,
        tableId: tableId ?? null,
        orderNumber: newOrderNumber,
        type,
        status: 'PENDING' as OrderStatus,
        customerPhone: customerPhone || null,
        customerName: customerName || null,
        customerId: customerPhone ? `${cafeId}_${customerPhone}` : null,
        carNumber: type === 'CAR_SERVICE' ? (carNumber || null) : null,
        notes: notes || '',
        useReward: useReward || false,
        rewardDiscount,
        subtotal,
        taxAmount,
        totalAmount,
        earnedPoints: 0,
        source,
        createdBy: createdBy || null,
        paymentMethod: paymentMethod || 'online',
        paymentStatus: paymentStatus || 'pending',
        loyaltyEligible,
        items: items.map((it) => ({
          ...it,
          totalPrice: it.unitPrice * it.quantity,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      tx.set(orderRef, JSON.parse(JSON.stringify(orderData)));

      if (tableExists && tableRef) {
        tx.update(tableRef, { status: getTableStatusAfterOrder(type) });
      }

      return orderData;
    });

    return NextResponse.json({ success: true, data: createdOrder });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/orders/place error:', msg);

    // Business-rule failures: surface the message so the UI can show it.
    const businessError = /is currently disabled\.$/.test(msg);
    if (businessError) {
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    // Server / infra failure: NEVER leak internals (env var names, stack
    // traces, Firebase Admin diagnostics) to end customers. Logs above keep
    // the real reason for debugging.
    const customerSafeMessage =
      'Order service is temporarily unavailable. Please ask the cashier to take your order, or try again in a few minutes.';
    return NextResponse.json(
      { success: false, message: customerSafeMessage },
      { status: 503 }
    );
  }
}
