import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/config/prisma";
import { withAuth } from "@/middleware/auth-helpers";

async function resolveCafeIdBigInt(raw: string): Promise<bigint | null> {
  if (/^\d+$/.test(raw)) {
    try {
      const exists = await prisma.cafe.findUnique({ where: { id: BigInt(raw) }, select: { id: true } });
      if (exists) return exists.id;
    } catch { /* fall through */ }
  }
  const byCode = await prisma.cafe.findFirst({ where: { cafeCode: raw }, select: { id: true } });
  if (byCode) return byCode.id;
  const bySlug = await prisma.cafe.findFirst({ where: { slug: raw }, select: { id: true } });
  if (bySlug) return bySlug.id;
  return null;
}

function gateCafe(caller: { roles?: string[]; cafeId?: string }, cafeId: bigint): boolean {
  if (caller.roles?.includes("SUPER_ADMIN")) return true;
  return String(caller.cafeId ?? "") === String(cafeId);
}


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    const { id } = await params;
    const cid = await resolveCafeIdBigInt(id);
    if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
    if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    const rows = await prisma.cafeUser.findMany({
      where: { cafeId: cid },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, status: true, lastLoginAt: true } },
      },
    });
    // CafeUser has no Prisma relation to Role — fetch the role catalogue
    // once and join in memory.
    const roleIds = Array.from(new Set(rows.map((r) => r.roleId)));
    const roles = roleIds.length
      ? await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } })
      : [];
    const roleNameById = new Map(roles.map((r) => [String(r.id), r.name]));
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        userId: String(r.userId),
        fullName: r.user.fullName,
        email: r.user.email,
        phone: r.user.phone,
        userStatus: r.user.status,
        cafeUserStatus: r.status,
        branchId: r.branchId ? String(r.branchId) : null,
        roleId: String(r.roleId),
        roleName: roleNameById.get(String(r.roleId)) ?? null,
        lastLoginAt: r.user.lastLoginAt?.toISOString() ?? null,
      })),
    });
  });
}

/** POST /api/cafes/[id]/staff
 *  Body: { fullName, email, phone?, password, roleName: OWNER|MANAGER|CASHIER|KITCHEN }
 *  Creates user + cafe_user link if not present.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ["SUPER_ADMIN", "OWNER", "MANAGER"], async (caller) => {
    try {
      const { id } = await params;
      const cid = await resolveCafeIdBigInt(id);
      if (!cid) return NextResponse.json({ success: false, message: "Cafe not found" }, { status: 404 });
      if (!gateCafe(caller, cid)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      const body = await req.json() as { fullName?: string; email?: string; phone?: string; password?: string; roleName?: string };
      if (!body.fullName || !body.email || !body.password || !body.roleName) {
        return NextResponse.json({ success: false, message: "fullName, email, password, roleName required" }, { status: 400 });
      }
      const email = body.email.toLowerCase().trim();
      const role = await prisma.role.findUnique({ where: { name: body.roleName.toUpperCase() } });
      if (!role) return NextResponse.json({ success: false, message: `Role ${body.roleName} not found` }, { status: 400 });

      const passwordHash = await bcrypt.hash(body.password, 10);
      const user = await prisma.user.upsert({
        where: { email },
        update: { fullName: body.fullName, phone: body.phone ?? null },
        create: { email, fullName: body.fullName, phone: body.phone ?? null, passwordHash, status: "active" },
      });

      let link = await prisma.cafeUser.findFirst({
        where: { cafeId: cid, userId: user.id },
      });
      if (!link) {
        link = await prisma.cafeUser.create({
          data: { cafeId: cid, userId: user.id, roleId: role.id },
        });
      }

      // Also grant the role on user_roles for JWT auth.
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });

      return NextResponse.json({
        success: true,
        data: { id: String(link.id), userId: String(user.id), email: user.email },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      console.error("[POST /api/cafes/[id]/staff] error:", msg);
      return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
  });
}
