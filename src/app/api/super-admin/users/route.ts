import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        roles: { include: { role: { select: { name: true } } } },
      },
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        status: r.status,
        roles: r.roles.map((ur) => ur.role.name),
        createdAt: r.createdAt.toISOString(),
        lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
      })),
    });
  });
}
