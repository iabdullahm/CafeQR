/**
 * GET /api/public/orders/[id]/status
 *
 * Public (no-auth) endpoint that returns just the live status of an
 * order. Used by CustomerMenuClient to poll for status updates after
 * a customer placed an order — replaces the old Firestore onSnapshot
 * which is dead after Phase 4d (db = null no-op shim).
 *
 * Returns only minimal fields so leaking the id to a curious customer
 * doesn't expose the rest of the order details.
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing order id" },
        { status: 400 }
      );
    }
    let orderId: bigint;
    try {
      orderId = BigInt(id);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid order id" },
        { status: 400 }
      );
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        completedAt: true,
      },
    });
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        id: String(order.id),
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        completedAt: order.completedAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/public/orders/[id]/status] error:", msg);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order status" },
      { status: 500 }
    );
  }
}
