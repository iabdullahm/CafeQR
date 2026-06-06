import { NextResponse } from "next/server";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

export async function GET(req: Request) {
  return withAuth(req, ["SUPER_ADMIN"], async () => {
    // No Lead model in schema yet — return empty list. Cafes/customers
    // serve as proxies until a Lead model is added.
    return NextResponse.json({ success: true, data: [] });
  });
}
