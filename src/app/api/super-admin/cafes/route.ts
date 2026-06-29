/**
 * GET /api/super-admin/cafes
 *
 * Returns the full tenant list for the Super-Admin CRM page. Each row is
 * shaped to match the legacy Firestore document fields the UI was built
 * against (name, slug, owner_name, owner_email, isActive, subscription,
 * ordersCount, createdAt, updatedAt) so we don't have to rewrite the
 * table columns.
 *
 * Pure JWT auth via withAuth(['SUPER_ADMIN']).
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    // PlanMap: slug -> id, shared across all rows so the modal can
    // resolve a slug like "pro" to a planId when calling change_plan.
    const plans = await prisma.plan.findMany({ select: { id: true, slug: true, name: true } });
    const planMap: Record<string, string> = {};
    for (const p of plans) planMap[(p.slug || p.name || "").toLowerCase()] = String(p.id);

    const cafes = await prisma.cafe.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: { select: { id: true, name: true, slug: true } } },
        },
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: cafes.map((c) => {
        const sub = c.subscriptions[0];
        const subStatus = sub?.status ?? null;
        const planCode = (sub?.plan?.slug || sub?.plan?.name || "free").toLowerCase();
        const isActive = c.status === "active";
        return {
          id: String(c.id),
          cafeCode: c.cafeCode,
          name: c.name,
          slug: c.slug,
          logoUrl: c.logo ?? null,
          email: c.email ?? null,
          phone: c.phone ?? null,
          country: c.country ?? null,
          city: c.city ?? null,
          owner_name: c.owner?.fullName ?? null,
          owner_email: c.owner?.email ?? null,
          owner_user_id: c.owner?.id ? String(c.owner.id) : null,
          isActive,
          status: c.status,
          plan: planCode,
          subscription: sub
            ? {
                id: String(sub.id),
                planId: planCode,
                status: subStatus,
                planMap, // slug -> planId for the change_plan modal
              }
            : null,
          ordersCount: c._count.orders,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        };
      }),
    });
  });
}
