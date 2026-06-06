import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const rows = await prisma.plan.findMany({
      orderBy: { monthlyPrice: "asc" },
      include: { features: true },
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        slug: r.slug,
        description: r.description,
        monthlyPrice: Number(r.monthlyPrice),
        yearlyPrice: Number(r.yearlyPrice),
        currency: r.currency,
        billingCycleType: r.billingCycleType,
        maxBranches: r.maxBranches,
        maxTables: r.maxTables,
        maxProducts: r.maxProducts,
        maxStaffUsers: r.maxStaffUsers,
        trialDays: r.trialDays,
        isPopular: r.isPopular,
        status: r.status,
        features: r.features.map((f) => ({
          id: String(f.id),
          featureKey: f.featureKey,
          featureValue: f.featureValue,
        })),
      })),
    });
  });
}
