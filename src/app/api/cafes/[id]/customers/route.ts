import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * GET /api/cafes/[id]/customers
 *
 * Cafe-scoped customer list with optional loyalty rollup.
 */
async function resolveCafeIdBigInt(raw: string): Promise<bigint | null> {
  if (/^\d+$/.test(raw)) {
    try {
      const exists = await prisma.cafe.findUnique({
        where: { id: BigInt(raw) },
        select: { id: true },
      });
      if (exists) return exists.id;
    } catch { /* fall through */ }
  }
  const byCode = await prisma.cafe.findFirst({
    where: { cafeCode: raw }, select: { id: true },
  });
  if (byCode) return byCode.id;
  const bySlug = await prisma.cafe.findFirst({
    where: { slug: raw }, select: { id: true },
  });
  if (bySlug) return bySlug.id;
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(
    req,
    ["SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"],
    async (caller) => {
      try {
        const { id } = await params;
        const realCafeId = await resolveCafeIdBigInt(id);
        if (!realCafeId) {
          return NextResponse.json(
            { success: false, message: "Cafe not found" },
            { status: 404 }
          );
        }

        const isSuper = caller.roles?.includes("SUPER_ADMIN");
        if (!isSuper) {
          const callerCafeId = (caller as { cafeId?: string }).cafeId;
          if (!callerCafeId || String(callerCafeId) !== String(realCafeId)) {
            return NextResponse.json(
              { success: false, message: "Forbidden" },
              { status: 403 }
            );
          }
        }

        const url = new URL(req.url);
        const limit = Math.min(
          Math.max(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 1),
          500
        );

        const customers = await prisma.customer.findMany({
          where: { cafeId: realCafeId },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            loyaltyAccount: { select: { cups: true, rewardsEarned: true, rewardsRedeemed: true } },
            _count: { select: { orders: true } },
          },
        });

        return NextResponse.json({
          success: true,
          data: customers.map((c) => ({
            id: String(c.id),
            name: c.name,
            phone: c.phone,
            email: c.email,
            carPlateNumber: c.carPlateNumber,
            notes: c.notes,
            createdAt: c.createdAt.toISOString(),
            ordersCount: c._count.orders,
            cups: c.loyaltyAccount?.cups ?? 0,
            rewardsEarned: c.loyaltyAccount?.rewardsEarned ?? 0,
            rewardsRedeemed: c.loyaltyAccount?.rewardsRedeemed ?? 0,
          })),
        });
      } catch (err) {
        console.error("[/api/cafes/[id]/customers] error:", err);
        return NextResponse.json(
          { success: false, message: "Server error" },
          { status: 500 }
        );
      }
    }
  );
}
