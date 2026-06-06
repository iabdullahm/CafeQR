import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

/**
 * POST /api/menu/items — create a menu item.
 *
 * Body: { categoryId, name, nameAr?, description?, descriptionAr?,
 *         image?, price, sku?, options?, isFeatured?, isAvailable? }
 *
 * Auth: cafe-scoped role (OWNER/MANAGER) or SUPER_ADMIN. cafeId comes
 * from the caller's JWT for non-super-admin.
 */
export async function POST(req: Request) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const body = (await req.json()) as {
        cafeId?: string;
        categoryId?: string;
        name?: string;
        nameAr?: string;
        description?: string;
        descriptionAr?: string;
        image?: string;
        price?: number | string;
        sku?: string;
        options?: unknown[];
        isFeatured?: boolean;
        isAvailable?: boolean;
      };

      const isSuper = caller.roles?.includes("SUPER_ADMIN");
      const callerCafeId = (caller as { cafeId?: string }).cafeId;
      const resolvedCafeId = isSuper && body.cafeId ? body.cafeId : callerCafeId;
      if (!resolvedCafeId) {
        return NextResponse.json(
          { success: false, message: "cafeId missing" },
          { status: 400 }
        );
      }
      if (!body.categoryId || !body.name || body.price === undefined) {
        return NextResponse.json(
          { success: false, message: "categoryId, name, price required" },
          { status: 400 }
        );
      }

      const item = await prisma.menuItem.create({
        data: {
          cafeId: BigInt(resolvedCafeId),
          categoryId: BigInt(body.categoryId),
          name: body.name,
          nameAr: body.nameAr ?? null,
          description: body.description ?? null,
          descriptionAr: body.descriptionAr ?? null,
          image: body.image ?? null,
          price: Number(body.price),
          sku: body.sku ?? null,
          optionsData: (body.options ?? []) as object,
          isFeatured: !!body.isFeatured,
          isAvailable: body.isAvailable ?? true,
        },
      });

      return NextResponse.json({
        success: true,
        data: { id: String(item.id), name: item.name, image: item.image },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[POST /api/menu/items] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to create item" },
        { status: 500 }
      );
    }
  });
}
