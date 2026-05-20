import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth-helpers';
import prisma from '@/config/prisma';
import { signToken } from '@/utils/jwt';

export async function POST(req: Request, { params }: { params: Promise<{ cafeId: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async (user) => {
    try {
      const { cafeId } = await params;
      if (!cafeId) return NextResponse.json({ success: false, message: 'Missing cafeId' }, { status: 400 });

      // In Postgres, ID might be BigInt, requiring conversion. If they pass BigInt strings, wait, let's just see.
      // Firebase cafes table uses `CAF-...` or numerical string.
      // Let's find the cafe. First try checking if it parses as number, else search by cafeCode.
      let cafe;
      if (!isNaN(Number(cafeId))) {
        cafe = await prisma.cafe.findUnique({
          where: { id: BigInt(cafeId) },
        });
      }
      if (!cafe) {
        cafe = await prisma.cafe.findFirst({
          where: { cafeCode: cafeId },
        });
      }

      if (!cafe) {
        // If not found in Prisma, it might be a Firebase ID.
        // We bypass the strict check and generate a token for the Firebase ID directly.
        if (typeof cafeId === 'string' && cafeId.length > 10) {
          const tokenPayload = {
            sub: "CAFE_DEFAULT_OWNER",
            email: `impersonated@cafeqr.com`,
            roles: ["OWNER"],
            cafeId: cafeId,
            impersonatedBy: user.sub
          };
          const newToken = signToken(tokenPayload);
          return NextResponse.json({
            success: true,
            data: { token: newToken }
          });
        }
        
        return NextResponse.json({ success: false, message: 'Cafe not found in DB' }, { status: 404 });
      }

      // Identify the owner or default user to impersonate as.
      const targetUserId = cafe.ownerUserId ? String(cafe.ownerUserId) : "CAFE_DEFAULT_OWNER";

      const tokenPayload = {
        sub: targetUserId,
        email: `impersonated@cafeqr.com`, // Avoid messing with real user's email matching
        roles: ["OWNER"],
        cafeId: String(cafe.id),
        impersonatedBy: user.sub
      };

      const newToken = signToken(tokenPayload);

      return NextResponse.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error: any) {
      console.error('Impersonation Error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  });
}
