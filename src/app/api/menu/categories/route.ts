import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function POST(req: Request) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const body = (await req.json()) as {
        cafeId?: string;
        name?: string;
        nameAr?: string;
        description?: string;
        image?: string;
        sortOrder?: number;
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
      if (!body.name) {
        return NextResponse.json(
          { success: false, message: "name required" },
          { status: 400 }
        );
      }

      const cat = await prisma.menuCategory.create({
        data: {
          cafeId: BigInt(resolvedCafeId),
          name: body.name,
          nameAr: body.nameAr ?? null,
          description: body.description ?? null,
          image: body.image ?? null,
          sortOrder: body.sortOrder ?? 0,
        },
      });

      return NextResponse.json({
        success: true,
        data: { id: String(cat.id), name: cat.name },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[POST /api/menu/categories] error:", msg);
      return NextResponse.json(
        { success: false, message: "Failed to create category" },
        { status: 500 }
      );
    }
  });
}
