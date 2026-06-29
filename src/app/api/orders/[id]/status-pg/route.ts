/**
 * PATCH /api/orders/[id]/status-pg
 *
 * Postgres-only status updater. Authenticates with the legacy JWT
 * (stored in localStorage by the cafe-admin / super-admin pages) instead
 * of Firebase Admin SDK — so it works without FIREBASE_SERVICE_ACCOUNT_KEY.
 *
 * The Firebase variant at /api/orders/[id]/status remains for callers
 * that already authenticate with a Firebase ID token; once the org-policy
 * Firebase blocker is resolved we can collapse the two routes.
 *
 * Auth model:
 *   Authorization: Bearer <legacy-jwt>  (signed with JWT_SECRET)
 *   The JWT payload must include `roles: string[]`, and one of the roles
 *   must be in the allowed list (case-insensitive).
 *
 * Body: { status: 'pending'|'confirmed'|'preparing'|'ready'|'completed'|'cancelled' }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/jwt";
import { OrderStatus } from "@prisma/client";

const ALLOWED_ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "KITCHEN"];
const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

function unauthorized(msg = "Unauthorized"): NextResponse {
  return NextResponse.json({ success: false, message: msg }, { status: 401 });
}

function isAllowedRole(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  const upper = roles.map((r) => String(r).toUpperCase());
  return ALLOWED_ROLES.some((r) => upper.includes(r));
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ---- Auth ----
  const authHeader = req.headers.get("authorization") ?? "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return unauthorized("Missing Bearer token");

  let payload;
  try {
    payload = verifyToken(m[1]);
  } catch {
    return unauthorized("Invalid token");
  }

  if (!isAllowedRole(payload.roles)) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  // ---- Body ----
  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const requestedStatus = String(body.status ?? "").toLowerCase() as OrderStatus;
  if (!VALID_STATUSES.includes(requestedStatus)) {
    return NextResponse.json(
      { success: false, message: `Invalid status: ${body.status}` },
      { status: 400 }
    );
  }

  // ---- Resolve order ID ----
  const { id } = await params;
  const orderIdBig = safeBigInt(id);
  if (!orderIdBig) {
    // The legacy admin sometimes still uses Firestore string ids
    // (e.g. "KKs5W41v6MXKCY3DAIqE") — those orders never went through
    // this Postgres path and won't be found here. Reply with a clear
    // 404 so the client can fall back gracefully.
    return NextResponse.json(
      { success: false, message: "Order not found (not a Postgres order id)" },
      { status: 404 }
    );
  }

  // ---- Authorise BEFORE mutating ----
  // SECURITY: the old code updated first then checked cafe ownership,
  // which left a window where an OWNER of cafe A could race to flip the
  // status of a cafe B order before the check ran. We now read first,
  // verify, and only then write. SUPER_ADMIN bypasses the gate.
  const existing = await prisma.order.findUnique({
    where: { id: orderIdBig },
    select: { id: true, cafeId: true },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }
  const isSuper = (payload.roles ?? []).includes("SUPER_ADMIN");
  if (!isSuper && payload.cafeId && String(existing.cafeId) !== String(payload.cafeId)) {
    return NextResponse.json(
      { success: false, message: "Order belongs to a different cafe" },
      { status: 403 }
    );
  }

  // ---- Update ----
  try {
    const updated = await prisma.order.update({
      where: { id: orderIdBig },
      data: {
        status: requestedStatus,
        completedAt: requestedStatus === "completed" ? new Date() : undefined,
        cancelledAt: requestedStatus === "cancelled" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(updated.id),
        status: updated.status,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/orders/[id]/status-pg] error:", msg);

    if (/Record to update not found/i.test(msg)) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Could not update order status — please retry.",
      },
      { status: 503 }
    );
  }
}

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
