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


/**
 * POST /api/super-admin/plans
 *
 * Create a new billing plan. Slug must be unique. Features are optional;
 * pass them as an array of { featureKey, featureValue } and they will be
 * created in the same transaction as the plan.
 */
export async function POST(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    try {
      const body = (await req.json()) as {
        name?: string;
        slug?: string;
        description?: string;
        monthlyPrice?: number;
        yearlyPrice?: number;
        currency?: string;
        billingCycleType?: string;
        maxBranches?: number;
        maxTables?: number;
        maxProducts?: number;
        maxStaffUsers?: number;
        trialDays?: number;
        isPopular?: boolean;
        status?: string;
        features?: { featureKey: string; featureValue: string }[];
      };

      if (!body.name || !body.slug) {
        return NextResponse.json(
          { success: false, message: "name and slug are required" },
          { status: 400 }
        );
      }
      // Slug must be url-safe so we can use it in URLs later.
      if (!/^[a-z0-9-]+$/.test(body.slug)) {
        return NextResponse.json(
          { success: false, message: "slug must be lowercase letters, digits, and dashes only" },
          { status: 400 }
        );
      }
      const monthlyPrice = Number(body.monthlyPrice ?? 0);
      const yearlyPrice = Number(body.yearlyPrice ?? monthlyPrice * 10);
      if (monthlyPrice < 0 || yearlyPrice < 0) {
        return NextResponse.json(
          { success: false, message: "prices must be >= 0" },
          { status: 400 }
        );
      }

      // Race-safe check on slug — Prisma will also reject via the
      // @unique constraint, but a 409 is friendlier than a 500.
      const existing = await prisma.plan.findUnique({ where: { slug: body.slug } });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Plan with slug '${body.slug}' already exists.` },
          { status: 409 }
        );
      }

      const created = await prisma.plan.create({
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description ?? null,
          monthlyPrice,
          yearlyPrice,
          currency: body.currency ?? "USD",
          billingCycleType: body.billingCycleType ?? "monthly",
          maxBranches: body.maxBranches ?? 1,
          maxTables: body.maxTables ?? 10,
          maxProducts: body.maxProducts ?? 50,
          maxStaffUsers: body.maxStaffUsers ?? 3,
          trialDays: body.trialDays ?? 14,
          isPopular: body.isPopular ?? false,
          status: body.status ?? "active",
          features: body.features?.length
            ? {
                create: body.features.map((f) => ({
                  featureKey: f.featureKey,
                  featureValue: f.featureValue,
                })),
              }
            : undefined,
        },
        include: { features: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: String(created.id),
          name: created.name,
          slug: created.slug,
          monthlyPrice: Number(created.monthlyPrice),
          yearlyPrice: Number(created.yearlyPrice),
          features: created.features.map((f) => ({
            id: String(f.id),
            featureKey: f.featureKey,
            featureValue: f.featureValue,
          })),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[POST /api/super-admin/plans] error:", msg);
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
