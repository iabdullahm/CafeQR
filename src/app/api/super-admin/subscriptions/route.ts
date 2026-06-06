import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const rows = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        cafe: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, monthlyPrice: true } },
      },
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        cafeId: String(r.cafeId),
        cafeName: r.cafe.name,
        cafeSlug: r.cafe.slug,
        planId: String(r.planId),
        planName: r.plan.name,
        planPrice: Number(r.plan.monthlyPrice),
        subscriptionType: r.subscriptionType,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        nextBillingDate: r.nextBillingDate?.toISOString() ?? null,
        totalAmount: Number(r.totalAmount),
        currency: r.currency,
        status: r.status,
        paymentStatus: r.paymentStatus,
        autoRenew: r.autoRenew,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  });
}
