import { NextResponse } from 'next/server';
import { cafeService } from './cafes.service';
import { cafeCreateSchema, cafeStatusSchema } from '@/lib/validations/cafe';
import { getAuthorizedUser, unauthorizedResponse, forbiddenResponse } from '@/middleware/auth-helpers';

/**
 * @fileOverview Cafe Controller manages HTTP request/response for Cafe routes.
 */

export class CafeController {
  async getAll(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    
    // Only super_admin or admin can list all cafes
    if (!['super_admin', 'admin'].includes(user.role)) return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const params = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await cafeService.findAll(params);
    return NextResponse.json(result);
  }

  async getById(req: Request, { params }: { params: { id: string } }) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();

    const cafe = await cafeService.findById(params.id);
    if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

    return NextResponse.json(cafe);
  }

  async create(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'super_admin') return forbiddenResponse();

    try {
      const body = await req.json();
      const validatedData = cafeCreateSchema.parse(body);
      const cafe = await cafeService.create(validatedData);
      return NextResponse.json(cafe, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async patchStatus(req: Request, { params }: { params: { id: string } }) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'super_admin') return forbiddenResponse();

    try {
      const body = await req.json();
      const { status } = cafeStatusSchema.parse(body);
      const cafe = await cafeService.updateStatus(params.id, status);
      return NextResponse.json(cafe);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
}

export const cafeController = new CafeController();
