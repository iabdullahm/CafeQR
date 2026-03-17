
import { NextResponse } from 'next/server';
import { cafeService } from '@/services/cafe-service';
import { cafeCreateSchema } from '@/lib/validations/cafe';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const result = await cafeService.findAll({ search, status, page, limit });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = cafeCreateSchema.parse(body);
    const cafe = await cafeService.create(validatedData);
    return NextResponse.json(cafe, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
