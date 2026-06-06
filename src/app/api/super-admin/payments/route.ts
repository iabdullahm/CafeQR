import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    const rows = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        invoiceId: String(r.invoiceId),
        amount: Number(r.amount),
        method: r.method,
        transactionId: r.transactionId,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  });
}
