import { NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';
import { withFirebaseAuth } from '@/middleware/firebase-auth';
import {
  type OrderStatus,
  getTableStatusOnOrderUpdate,
} from '@/lib/orders-logic';

/**
 * Server-side counterpart of updateOrderStatusAtomic.
 *
 * PATCH /api/orders/[id]/status
 *   headers: Authorization: Bearer <firebase id token>
 *   body:    { cafeId: string, status: string }
 *
 * Gated by withFirebaseAuth to one of the staff roles. Additionally, the
 * caller's profile.cafeId must match the order's cafeId (super admins
 * skip that check).
 *
 * Sequence (single transaction):
 *   1. Update the order's status + updatedAt.
 *   2. Cascade the table status (READY when ready, AVAILABLE when done).
 *   3. On the first transition to COMPLETED, award loyalty cups per
 *      /loyaltySettings/{cafeId}; mark order.loyaltyProcessed to prevent
 *      double credit.
 */

const VALID_STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED',
];

const STAFF_ROLES = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER', 'KITCHEN'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withFirebaseAuth(req, STAFF_ROLES, async (user) => {
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

    // Cross-cafe guard: non-super-admins can only touch their own cafe.
    if (user.role !== 'SUPER_ADMIN' && user.cafeId !== cafeId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
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
  });
}
