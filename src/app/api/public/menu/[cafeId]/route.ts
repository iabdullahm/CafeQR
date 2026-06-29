import { NextResponse } from "next/server";
import prisma from "@/config/prisma";

/**
 * GET /api/public/menu/[cafeId]
 *
 * Public, unauthenticated menu for the customer-facing storefront.
 * Returns categories + items, each item carrying its structured
 * modifier groups + choices for the customer modifier picker.
 *
 * Resolves cafeId by numeric id, cafeCode, or slug.
 */
async function resolveCafeId(raw: string): Promise<bigint | null> {
  if (/^\d+$/.test(raw)) {
    try {
      const exists = await prisma.cafe.findUnique({
        where: { id: BigInt(raw) },
        select: { id: true },
      });
      if (exists) return exists.id;
    } catch { /* fall through */ }
  }
  const byCode = await prisma.cafe.findFirst({ where: { cafeCode: raw }, select: { id: true } });
  if (byCode) return byCode.id;
  const bySlug = await prisma.cafe.findFirst({ where: { slug: raw }, select: { id: true } });
  if (bySlug) return bySlug.id;
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cafeId: string }> }
) {
  try {
    const { cafeId } = await params;
    const realCafeId = await resolveCafeId(cafeId);
    if (!realCafeId) {
      return NextResponse.json(
        { success: false, message: "Cafe not found" },
        { status: 404 }
      );
    }

    const [categories, items] = await Promise.all([
      prisma.menuCategory.findMany({
        where: { cafeId: realCafeId, status: "active" },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      prisma.menuItem.findMany({
        where: { cafeId: realCafeId, status: "active", isAvailable: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: {
          options: {
            orderBy: { id: "asc" },
            include: {
              values: {
                where: { status: "active" },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cafeId: String(realCafeId),
        categories: categories.map((c) => ({
          id: String(c.id),
          name: c.name,
          nameEn: c.name,
          nameAr: c.nameAr ?? c.name,
          description: c.description,
          image: c.image,
          sortOrder: c.sortOrder,
        })),
        products: items.map((p) => ({
          id: String(p.id),
          categoryId: String(p.categoryId),
          name: p.name,
          nameEn: p.name,
          nameAr: p.nameAr ?? p.name,
          description: p.description,
          descriptionEn: p.description,
          descriptionAr: p.descriptionAr ?? p.description,
          imageUrl: p.image,
          image: p.image,
          price: Number(p.price),
          isFeatured: p.isFeatured,
          isAvailable: p.isAvailable,
          sortOrder: p.sortOrder,
          // Structured options for the customer modifier picker. Falls back
          // to the legacy free-form optionsData JSON blob if no structured
          // groups exist yet for this item.
          options: p.options.length > 0
            ? p.options.map((opt) => ({
                id: String(opt.id),
                name: opt.name,
                type: opt.type,
                isRequired: opt.isRequired,
                minSelect: opt.minSelect,
                maxSelect: opt.maxSelect,
                values: opt.values.map((v) => ({
                  id: String(v.id),
                  valueName: v.valueName,
                  extraPrice: Number(v.extraPrice),
                  sortOrder: v.sortOrder,
                })),
              }))
            : ((p.optionsData as unknown[] | null) ?? []),
        })),
      },
    }, {
      // PERF: every QR scan hits this endpoint; menu changes are rare.
      // s-maxage=60: Vercel CDN caches for 60s.
      // stale-while-revalidate=300: serve stale up to 5 min while we
      // refetch in the background — keeps p99 flat during dinner rush.
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[/api/public/menu/[cafeId]] error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
