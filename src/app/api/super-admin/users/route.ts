import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";
import { parsePagination, sliceForPage } from "@/utils/pagination";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const { limit, cursorArg, take } = parsePagination(req);
    const rows = await prisma.user.findMany({
      ...cursorArg,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      include: {
        roles: { include: { role: { select: { name: true } } } },
      },
    });
    const { data, nextCursor } = sliceForPage(rows, limit, (r) => String(r.id));
    return NextResponse.json({
      success: true,
      data: data.map((r) => ({
        id: String(r.id),
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        status: r.status,
        roles: r.roles.map((ur) => ur.role.name),
        createdAt: r.createdAt.toISOString(),
        lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
      })),
      nextCursor,
    });
  });
}
