import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";
import { parsePagination, sliceForPage } from "@/utils/pagination";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const { limit, cursorArg, take } = parsePagination(req);
    const rows = await prisma.activityLog.findMany({
      ...cursorArg,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
    });
    const { data, nextCursor } = sliceForPage(rows, limit, (r) => String(r.id));
    return NextResponse.json({
      success: true,
      data: data.map((r) => ({
        id: String(r.id),
        userId: r.userId ? String(r.userId) : null,
        action: r.action,
        module: r.module,
        details: r.details,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt.toISOString(),
      })),
      nextCursor,
    });
  });
}
