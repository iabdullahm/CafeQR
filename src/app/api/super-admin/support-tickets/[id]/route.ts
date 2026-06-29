import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * PATCH /api/super-admin/support-tickets/[id]
 *
 * SUPER_ADMIN-only. Updates a support ticket's status and/or priority.
 *
 * Body:
 *   { status?: 'open'|'pending'|'resolved'|'closed',
 *     priority?: 'low'|'medium'|'high'|'urgent' }
 *
 * The Prisma schema stores both as free-form strings, so we validate
 * against an allowlist server-side rather than rely on the database.
 *
 * Notes:
 *   - We do not auto-cascade status across messages; messages live in a
 *     separate table and have their own read/unread state.
 *   - Future: assignedTo / closedAt fields can be added here once the
 *     schema grows them. For now keeping the surface deliberately small.
 */

const STATUS_VALUES = new Set(["open", "pending", "resolved", "closed"]);
const PRIORITY_VALUES = new Set(["low", "medium", "high", "urgent"]);

function safeBigInt(raw: string): bigint | null {
  try { return BigInt(raw); } catch { return null; }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    try {
      const { id } = await params;
      const ticketId = safeBigInt(id);
      if (!ticketId) {
        return NextResponse.json({ success: false, message: "Invalid ticket id" }, { status: 400 });
      }

      const existing = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
      if (!existing) {
        return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
      }

      const body = (await req.json().catch(() => ({}))) as { status?: string; priority?: string };

      const data: Record<string, unknown> = {};
      if (body.status) {
        const s = body.status.toLowerCase();
        if (!STATUS_VALUES.has(s)) {
          return NextResponse.json(
            { success: false, message: `status must be one of ${Array.from(STATUS_VALUES).join(", ")}` },
            { status: 400 }
          );
        }
        data.status = s;
      }
      if (body.priority) {
        const p = body.priority.toLowerCase();
        if (!PRIORITY_VALUES.has(p)) {
          return NextResponse.json(
            { success: false, message: `priority must be one of ${Array.from(PRIORITY_VALUES).join(", ")}` },
            { status: 400 }
          );
        }
        data.priority = p;
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json(
          { success: false, message: "Provide status and/or priority." },
          { status: 400 }
        );
      }

      const updated = await prisma.supportTicket.update({
        where: { id: ticketId },
        data,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: String(updated.id),
          cafeId: String(updated.cafeId),
          ticketNumber: updated.ticketNumber,
          subject: updated.subject,
          priority: updated.priority,
          status: updated.status,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/super-admin/support-tickets/[id]] error:", msg);
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
