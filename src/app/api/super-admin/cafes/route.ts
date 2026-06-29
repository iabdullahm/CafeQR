/**
 * GET /api/super-admin/cafes
 *
 * Returns the tenant list for the Super-Admin CRM page. Cursor-paginated
 * via ?cursor=<id>&limit=<n> with nextCursor in the response (default
 * limit 50, max 200). Each row shape matches legacy Firestore field
 * names so the UI doesn't need to rewrite its columns.
 *
 * Pure JWT auth via withAuth(["SUPER_ADMIN"]).
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";
import { parsePagination, sliceForPage } from "@/utils/pagination";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    // PlanMap: slug -> id, shared across all rows so the modal can
    // resolve "pro" to a planId when calling change_plan.
    const plans = await prisma.plan.findMany({ select: { id: true, slug: true, name: true } });
    const planMap: Record<string, string> = {};
    for (const p of plans) planMap[(p.slug || p.name || "").toLowerCase()] = String(p.id);

    const { limit, cursorArg, take } = parsePagination(req);
    const cafes = await prisma.cafe.findMany({
      ...cursorArg,
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: { select: { id: true, name: true, slug: true } } },
        },
        _count: { select: { orders: true } },
      },
    });
    const { data, nextCursor } = sliceForPage(cafes, limit, (c) => String(c.id));

    return NextResponse.json({
      success: true,
      data: data.map((c) => {
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
      nextCursor,
    });
  });
}
