import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * PATCH /api/super-admin/subscriptions/[id]
 *
 * SUPER_ADMIN-only endpoint for billing operations on a Subscription row.
 * Replaces the "Not implemented yet" toasts that previously lived in
 * subscription-management-modal.tsx and super-admin/subscriptions/page.tsx.
 *
 * Supported actions (one per request):
 *
 *   { action: "pause" }
 *     -> status = "suspended". Use when a cafe is in a billing dispute
 *        or has voluntarily paused service.
 *
 *   { action: "resume" }
 *     -> status = "active". Re-enables a suspended or cancelled sub
 *        without re-running the trial.
 *
 *   { action: "cancel" }
 *     -> status = "cancelled", cancelledAt = now(), autoRenew = false.
 *        Service stays live until endDate; downgrade after that.
 *
 *   { action: "renew" }
 *     -> status = "active". Marks a manual renewal recorded outside the
 *        normal billing cycle (e.g. wire transfer received). Does not
 *        extend endDate by itself — caller can also send extendDays.
 *
 *   { action: "toggle_auto_renew" }
 *     -> flips autoRenew. No payment side-effect.
 *
 *   { action: "change_plan", planId: "<bigint>", billingCycle?: "monthly"|"yearly" }
 *     -> swaps planId. Recomputes amount + totalAmount from the new plan
 *        (monthlyPrice or yearlyPrice). Does NOT prorate — the caller is
 *        expected to handle credits manually for now.
 *
 *   Optional on any action: { extendDays: number }
 *     -> adds N days to endDate. Useful when granting a goodwill
 *        extension during a pause/resume.
 *
 * All branches return the updated subscription in the same shape the
 * GET endpoint uses, so the client can replace its row in-place.
 */

type Action =
  | "pause"
  | "resume"
  | "cancel"
  | "renew"
  | "toggle_auto_renew"
  | "change_plan";

interface PatchBody {
  action?: Action;
  planId?: string;
  billingCycle?: "monthly" | "yearly";
  extendDays?: number;
}

function safeBigInt(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    try {
      const { id } = await params;
      const subId = safeBigInt(id);
      if (!subId) {
        return NextResponse.json(
          { success: false, message: "Invalid subscription id" },
          { status: 400 }
        );
      }

      const body = (await req.json().catch(() => ({}))) as PatchBody;
      if (!body.action) {
        return NextResponse.json(
          { success: false, message: "action is required" },
          { status: 400 }
        );
      }

      const existing = await prisma.subscription.findUnique({
        where: { id: subId },
        include: { plan: { select: { monthlyPrice: true, yearlyPrice: true } } },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Subscription not found" },
          { status: 404 }
        );
      }

      // Build the data patch one action at a time so the audit story
      // stays clear and unrelated fields are never accidentally touched.
      const data: Record<string, unknown> = {};

      switch (body.action) {
        case "pause":
          data.status = "suspended";
          break;

        case "resume":
          data.status = "active";
          break;

        case "cancel":
          // Cancelling does not immediately terminate access — service
          // runs out at endDate. autoRenew flipped off so it does not
          // silently re-activate at the next billing cycle.
          data.status = "cancelled";
          data.cancelledAt = new Date();
          data.autoRenew = false;
          break;

        case "renew":
          data.status = "active";
          // If the previous cycle ended, snap nextBillingDate forward by
          // one billing period as a sensible default.
          if (existing.endDate < new Date() && existing.nextBillingDate) {
            const periodDays = existing.subscriptionType === "yearly" ? 365 : 30;
            data.nextBillingDate = addDays(existing.nextBillingDate, periodDays);
          }
          break;

        case "toggle_auto_renew":
          data.autoRenew = !existing.autoRenew;
          break;

        case "change_plan": {
          if (!body.planId) {
            return NextResponse.json(
              { success: false, message: "planId is required for change_plan" },
              { status: 400 }
            );
          }
          const newPlanIdBig = safeBigInt(body.planId);
          if (!newPlanIdBig) {
            return NextResponse.json(
              { success: false, message: "Invalid planId" },
              { status: 400 }
            );
          }
          const newPlan = await prisma.plan.findUnique({
            where: { id: newPlanIdBig },
            select: { id: true, monthlyPrice: true, yearlyPrice: true },
          });
          if (!newPlan) {
            return NextResponse.json(
              { success: false, message: "Plan not found" },
              { status: 404 }
            );
          }
          const cycle =
            body.billingCycle ?? (existing.subscriptionType === "yearly" ? "yearly" : "monthly");
          const amount =
            cycle === "yearly" ? newPlan.yearlyPrice : newPlan.monthlyPrice;
          data.planId = newPlan.id;
          data.subscriptionType = cycle;
          data.amount = amount;
          data.totalAmount = amount; // No proration; admin handles credits manually.
          break;
        }

        default:
          return NextResponse.json(
            { success: false, message: `Unknown action: ${body.action}` },
            { status: 400 }
          );
      }

      if (typeof body.extendDays === "number" && body.extendDays > 0) {
        data.endDate = addDays(existing.endDate, body.extendDays);
      }

      const updated = await prisma.subscription.update({
        where: { id: subId },
        data,
        include: {
          cafe: { select: { id: true, name: true, slug: true } },
          plan: { select: { id: true, name: true, monthlyPrice: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: String(updated.id),
          cafeId: String(updated.cafeId),
          cafeName: updated.cafe.name,
          cafeSlug: updated.cafe.slug,
          planId: String(updated.planId),
          planName: updated.plan.name,
          planPrice: Number(updated.plan.monthlyPrice),
          subscriptionType: updated.subscriptionType,
          startDate: updated.startDate.toISOString(),
          endDate: updated.endDate.toISOString(),
          nextBillingDate: updated.nextBillingDate?.toISOString() ?? null,
          totalAmount: Number(updated.totalAmount),
          currency: updated.currency,
          status: updated.status,
          paymentStatus: updated.paymentStatus,
          autoRenew: updated.autoRenew,
          createdAt: updated.createdAt.toISOString(),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[PATCH /api/super-admin/subscriptions/[id]] error:", msg);
      return NextResponse.json(
        { success: false, message: msg },
        { status: 500 }
      );
    }
  });
}
