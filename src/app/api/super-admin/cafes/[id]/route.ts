/**
 * GET    /api/super-admin/cafes/[id]  full cafe details for the CRM detail page.
 * PATCH  /api/super-admin/cafes/[id]  toggle status (active <-> suspended).
 */

import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

function resolveCafeId(raw: string): bigint | null {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    try { return BigInt(raw); } catch { return null; }
  }
  return null;
}

async function findCafeByAnyId(raw: string) {
  const numeric = resolveCafeId(raw);
  if (numeric !== null) {
    const c = await prisma.cafe.findUnique({ where: { id: numeric } });
    if (c) return c;
  }
  const byCode = await prisma.cafe.findFirst({ where: { cafeCode: raw } });
  if (byCode) return byCode;
  return prisma.cafe.findFirst({ where: { slug: raw } });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing cafe id" },
        { status: 400 }
      );
    }
    const baseCafe = await findCafeByAnyId(id);
    if (!baseCafe) {
      return NextResponse.json(
        { success: false, message: "Cafe not found" },
        { status: 404 }
      );
    }
    const cafe = await prisma.cafe.findUnique({
      where: { id: baseCafe.id },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: { select: { id: true, name: true, slug: true } } },
        },
        _count: { select: { orders: true, branches: true, tables: true, items: true, customers: true } },
      },
    });
    if (!cafe) {
      return NextResponse.json(
        { success: false, message: "Cafe not found" },
        { status: 404 }
      );
    }
    const sub = cafe.subscriptions[0];
    const planCode = (sub?.plan?.slug || sub?.plan?.name || "free").toLowerCase();
    return NextResponse.json({
      success: true,
      data: {
        id: String(cafe.id),
        cafeCode: cafe.cafeCode,
        name: cafe.name,
        slug: cafe.slug,
        logoUrl: cafe.logo ?? null,
        email: cafe.email ?? null,
        phone: cafe.phone ?? null,
        country: cafe.country ?? null,
        city: cafe.city ?? null,
        address: cafe.address ?? null,
        location: [cafe.address, cafe.city, cafe.country].filter(Boolean).join(", "),
        owner_name: cafe.owner?.fullName ?? null,
        owner_email: cafe.owner?.email ?? null,
        owner_phone: cafe.owner?.phone ?? null,
        owner_user_id: cafe.owner?.id ? String(cafe.owner.id) : null,
        isActive: cafe.status === "active",
        status: cafe.status,
        plan: planCode,
        subscription: sub
          ? { id: String(sub.id), planId: planCode, status: sub.status }
          : null,
        ordersCount: cafe._count.orders,
        branches_count: cafe._count.branches,
        tables_count: cafe._count.tables,
        menu_count: cafe._count.items,
        customers_count: cafe._count.customers,
        createdAt: cafe.createdAt.toISOString(),
        updatedAt: cafe.updatedAt.toISOString(),
      },
    });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing cafe id" },
        { status: 400 }
      );
    }
    let cafeId: bigint;
    try {
      cafeId = BigInt(id);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid cafe id" },
        { status: 400 }
      );
    }
    const body = (await req.json().catch(() => ({}))) as {
      isActive?: boolean;
      status?: string;
    };
    let newStatus: "active" | "suspended" | undefined;
    if (typeof body.isActive === "boolean") {
      newStatus = body.isActive ? "active" : "suspended";
    } else if (body.status === "active" || body.status === "suspended") {
      newStatus = body.status;
    }
    if (!newStatus) {
      return NextResponse.json(
        { success: false, message: "Missing isActive or status" },
        { status: 400 }
      );
    }
    const cafe = await prisma.cafe.update({
      where: { id: cafeId },
      data: { status: newStatus as any },
      select: { id: true, status: true },
    });
    return NextResponse.json({
      success: true,
      data: { id: String(cafe.id), status: cafe.status },
    });
  });
}
