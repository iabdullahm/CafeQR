import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const rows = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        userId: r.userId ? String(r.userId) : null,
        action: r.action,
        module: r.module,
        details: r.details,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  });
}
