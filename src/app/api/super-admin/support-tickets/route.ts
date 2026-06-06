import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const rows = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        cafeId: String(r.cafeId),
        ticketNumber: r.ticketNumber,
        subject: r.subject,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  });
}
