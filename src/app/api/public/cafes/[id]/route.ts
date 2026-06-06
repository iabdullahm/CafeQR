import { NextResponse } from "next/server";
import prisma from "@/config/prisma";

/**
 * GET /api/public/cafes/[id]
 *
 * Public, unauthenticated cafe metadata for the customer-facing menu
 * page. Resolves id by:
 *   1. numeric Postgres id
 *   2. cafeCode
 *   3. slug
 *
 * Returns everything the customer client needs to render the storefront
 * (logo, cover, currency, tax rate, name/nameAr), with sensible
 * placeholder URLs when columns are null.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id" },
        { status: 400 }
      );
    }

    let cafe = null;
    if (/^\d+$/.test(id)) {
      try {
        cafe = await prisma.cafe.findUnique({ where: { id: BigInt(id) } });
      } catch {
        /* fall through */
      }
    }
    if (!cafe) cafe = await prisma.cafe.findFirst({ where: { cafeCode: id } });
    if (!cafe) cafe = await prisma.cafe.findFirst({ where: { slug: id } });

    if (!cafe) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(cafe.id),
        slug: cafe.slug,
        cafeCode: cafe.cafeCode,
        name: cafe.name,
        nameAr: cafe.nameAr,
        description: cafe.description,
        descriptionAr: cafe.descriptionAr,
        logo: cafe.logo || "https://picsum.photos/seed/logo/150/150",
        coverImage:
          cafe.coverImage ||
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
        currency: cafe.currency || "OMR",
        country: cafe.country,
        city: cafe.city,
        timezone: cafe.timezone,
        latitude: cafe.latitude ? Number(cafe.latitude) : null,
        longitude: cafe.longitude ? Number(cafe.longitude) : null,
        taxRate: Number(cafe.taxRate ?? 0),
        settings: cafe.settings ?? null,
        status: cafe.status,
      },
    });
  } catch (err) {
    console.error("[/api/public/cafes/[id]] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
