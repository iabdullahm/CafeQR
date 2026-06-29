import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * PATCH  /api/super-admin/plans/[id]
 * DELETE /api/super-admin/plans/[id]
 *
 * SUPER_ADMIN-only plan management.
 *
 * PATCH: partial update — any combination of name, description, prices,
 * limits, isPopular, status. Slug is also editable but we re-check the
 * unique constraint defensively. Features are NOT updated via PATCH;
 * use the dedicated feature endpoints (not yet built — features rarely
 * change once a plan launches).
 *
 * DELETE: soft-disable a plan by setting status="archived". A real
 * delete would cascade-orphan the subscription rows that reference it,
 * so we refuse a hard delete if any subscription points at the plan.
 */

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
      const planId = safeBigInt(id);
      if (!planId) {
        return NextResponse.json({ success: false, message: "Invalid plan id" }, { status: 400 });
      }
      const existing = await prisma.plan.findUnique({ where: { id: planId } });
      if (!existing) {
        return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
      }

      const body = (await req.json().catch(() => ({}))) as Partial<{
        name: string;
        slug: string;
        description: string | null;
        monthlyPrice: number;
        yearlyPrice: number;
        currency: string;
        billingCycleType: string;
        maxBranches: number;
        maxTables: number;
        maxProducts: number;
        maxStaffUsers: number;
        trialDays: number;
        isPopular: boolean;
        status: string;
      }>;

      // Validate slug shape + uniqueness if it's being changed.
      if (body.slug && body.slug !== existing.slug) {
        if (!/^[a-z0-9-]+$/.test(body.slug)) {
          return NextResponse.json(
            { success: false, message: "slug must be lowercase letters, digits, and dashes only" },
            { status: 400 }
          );
        }
        const clash = await prisma.plan.findUnique({ where: { slug: body.slug } });
        if (clash) {
          return NextResponse.json(
            { success: false, message: `Plan with slug '${body.slug}' already exists.` },
            { status: 409 }
          );
        }
      }

      // Build the data object explicitly so the caller can't slip in
      // unexpected fields (defence-in-depth alongside the type cast).
      const data: Record<string, unknown> = {};
      const numericFields = [
        "monthlyPrice", "yearlyPrice", "maxBranches", "maxTables",
        "maxProducts", "maxStaffUsers", "trialDays",
      ] as const;
      for (const k of numericFields) {
        if (k in body && typeof body[k] === "number") {
          if (body[k]! < 0) {
            return NextResponse.json(
              { success: false, message: `${k} must be >= 0` },
              { status: 400 }
            );
          }
          data[k] = body[k];
        }
      }
      const stringFields = ["name", "slug", "description", "currency", "billingCycleType", "status"] as const;
      for (const k of stringFields) {
        if (k in body) data[k] = body[k];
      }
      if (typeof body.isPopular === "boolean") data.isPopular = body.isPopular;

      if (Object.keys(data).length === 0) {
        return NextResponse.json(
          { success: false, message: "Nothing to update" },
          { status: 400 }
        );
      }

      const updated = await prisma.plan.update({
        where: { id: planId },
        data,
        include: { features: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: String(updated.id),
          name: updated.name,
          slug: updated.slug,
          description: updated.description,
          monthlyPrice: Number(updated.monthlyPrice),
          yearlyPrice: Number(updated.yearlyPrice),
          currency: updated.currency,
          billingCycleType: updated.billingCycleType,
          maxBranches: updated.maxBranches,
          maxTables: updated.maxTables,
          maxProducts: updated.maxProducts,
          maxStaffUsers: updated.maxStaffUsers,
          trialDays: updated.trialDays,
          isPopular: updated.isPopular,
          status: updated.status,
          features: updated.features.map((f) => ({
            id: String(f.id),
            featureKey: f.featureKey,
            featureValue: f.featureValue,
          })),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/super-admin/plans/[id]] error:", msg);
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    try {
      const { id } = await params;
      const planId = safeBigInt(id);
      if (!planId) {
        return NextResponse.json({ success: false, message: "Invalid plan id" }, { status: 400 });
      }

      // Refuse hard delete if anyone still subscribes to this plan;
      // dropping the row would orphan or break the FK.
      const subCount = await prisma.subscription.count({ where: { planId } });
      if (subCount > 0) {
        // Soft-archive instead so the plan disappears from sign-up
        // flows but historical subscriptions remain readable.
        const archived = await prisma.plan.update({
          where: { id: planId },
          data: { status: "archived" },
        });
        return NextResponse.json({
          success: true,
          data: {
            id: String(archived.id),
            status: archived.status,
            archived: true,
            subCount,
          },
          message: `Plan archived (${subCount} active subscription(s) preserved).`,
        });
      }

      // Safe to hard-delete: also wipe features in the same transaction.
      await prisma.$transaction([
        prisma.planFeature.deleteMany({ where: { planId } }),
        prisma.plan.delete({ where: { id: planId } }),
      ]);
      return NextResponse.json({ success: true, data: { id, deleted: true } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[DELETE /api/super-admin/plans/[id]] error:", msg);
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
