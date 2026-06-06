import { NextResponse } from "next/server";
import prisma from "@/config/prisma";

/**
 * GET /api/public/menu/[cafeId]
 *
 * Public, unauthenticated menu for the customer-facing storefront.
 * Returns categories + items in the shape CustomerMenuClient expects.
 *
 * Resolves cafeId by numeric id, cafeCode, or slug (matches the rules
 * of /api/public/cafes/[id] and /api/orders/place-pg/resolveCafeId).
 */
async function resolveCafeId(raw: string): Promise<bigint | null> {
  if (/^\d+$/.test(raw)) {
    try {
      const exists = await prisma.cafe.findUnique({
        where: { id: BigInt(raw) },
        select: { id: true },
      });
      if (exists) return exists.id;
    } catch {
      /* fall through */
    }
  }
  const byCode = await prisma.cafe.findFirst({
    where: { cafeCode: raw },
    select: { id: true },
  });
  if (byCode) return byCode.id;
  const bySlug = await prisma.cafe.findFirst({
    where: { slug: raw },
    select: { id: true },
  });
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
          options: (p.optionsData as unknown[] | null) ?? [],
        })),
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
