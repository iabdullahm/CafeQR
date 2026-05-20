import { NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import {
  type OrderStatus,
  getTableStatusOnOrderUpdate,
} from '@/lib/orders-logic';

/**
 * Server-side counterpart of updateOrderStatusAtomic.
 *
 * PATCH /api/orders/[id]/status
 *   body: { cafeId: string, status: string }
 *
 * Does the same single-transaction sequence as the legacy lib function:
 *   1. Update the order's status.
 *   2. Cascade the table status (READY when ready, AVAILABLE when done).
 *   3. On the first transition to COMPLETED, award loyalty cups to the
 *      customer per /loyaltySettings/{cafeId}; mark order.loyaltyProcessed
 *      to prevent double-crediting.
 *
 * Auth: TODO — currently relies on the fact that only staff use the kds
 * and cafe-admin/orders UIs. Phase 4 (rules tightening) will require this
 * endpoint to start checking cafeId membership via withAuth/withRole.
 */

const VALID_STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED',
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ success: false, message: 'Missing order id' }, { status: 400 });
  }

  let body: { cafeId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const { cafeId, status: statusRaw } = body;
  if (!cafeId || !statusRaw) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: cafeId, status' },
      { status: 400 }
    );
  }
  const newStatus = statusRaw.toUpperCase() as OrderStatus;
  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { success: false, message: `Invalid status: ${statusRaw}` },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const orderRef = db.collection('cafes').doc(cafeId).collection('orders').doc(orderId);

    await db.runTransaction(async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) throw new Error('Order not found');
      const orderData = orderSnap.data() as Record<string, unknown>;

      tx.update(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });

      // Cascade table status
      if (orderData.tableId && orderData.cafeId) {
        const tableRef = db
          .collection('cafes').doc(orderData.cafeId as string)
          .collection('tables').doc(orderData.tableId as string);
        const nextTableStatus = getTableStatusOnOrderUpdate(newStatus) ?? 'AVAILABLE';
        tx.update(tableRef, { status: nextTableStatus });
      }

      // Loyalty earning: only on first COMPLETED transition, with phone, and eligible.
      if (
        newStatus === 'COMPLETED' &&
        !orderData.loyaltyProcessed &&
        orderData.customerPhone &&
        orderData.loyaltyEligible !== false
      ) {
        const customerRef = db.collection('customers').doc(`${cafeId}_${orderData.customerPhone}`);
        const customerSnap = await tx.get(customerRef);
        const settingsRef = db.collection('loyaltySettings').doc(cafeId);
        const settingsSnap = await tx.get(settingsRef);

        let isActive = true;
        let cupsReq = 5;
        let autoReset = true;
        // countOnlyCoffee currently unused; left as TODO mirror of legacy behaviour.

        if (settingsSnap.exists) {
          const settings = settingsSnap.data() as Record<string, unknown>;
          isActive = settings.active !== false;
          cupsReq = (settings.cupsRequired as number) || 5;
          autoReset = settings.autoReset !== false;
        }

        if (isActive && customerSnap.exists) {
          const cData = customerSnap.data() as Record<string, unknown>;
          let cups = (cData.cups as number) || 0;
          let totalOrders = (cData.totalOrders as number) || 0;
          let rewardsEarned = (cData.rewardsEarned as number) || 0;

          cups += 1;
          totalOrders += 1;
          if (cups >= cupsReq) {
            rewardsEarned += 1;
            cups = autoReset ? 0 : cups - cupsReq;
          }

          tx.update(customerRef, {
            cups,
            totalOrders,
            rewardsEarned,
            lastVisit: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          tx.update(orderRef, { loyaltyProcessed: true });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('PATCH /api/orders/[id]/status error:', msg);
    const notFound = msg === 'Order not found';
    return NextResponse.json(
      { success: false, message: msg },
      { status: notFound ? 404 : 500 }
    );
  }
}
