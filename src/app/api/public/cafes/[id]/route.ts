import { NextResponse } from 'next/server';
import prisma from '@/config/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    let cafe;
    if (!isNaN(Number(id))) {
      cafe = await prisma.cafe.findUnique({
        where: { id: BigInt(id) }
      });
    }

    if (!cafe) {
      cafe = await prisma.cafe.findFirst({
        where: { cafeCode: id }
      });
    }

    if (!cafe) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: cafe.name,
        logo: cafe.logo || "https://picsum.photos/seed/logo/150/150",
        coverImage: cafe.coverImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&fit=crop",
        currency: "OMR"
      }
    });
  } catch (error) {
    console.error('Public Cafe API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
