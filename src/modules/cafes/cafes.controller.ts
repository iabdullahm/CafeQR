import { NextResponse } from 'next/server';
import { cafeService } from './cafes.service';
import { cafeCreateSchema, cafeStatusSchema, cafeUpdateSchema } from '@/lib/validations/cafe';
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
      city: searchParams.get('city') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const result = await cafeService.findAll(params);
    return NextResponse.json({
      success: true,
      data: {
        items: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      }
    });
  }

  async getById(req: Request, { params }: { params: { id: string } }) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();

    const cafe = await cafeService.findById(params.id);
    if (!cafe) return NextResponse.json({ success: false, error: 'Cafe not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: cafe
    });
  }

  async create(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'super_admin') return forbiddenResponse();

    try {
      const body = await req.json();
      const validatedData = cafeCreateSchema.parse(body);
      const cafe = await cafeService.create(validatedData);
      return NextResponse.json({
        success: true,
        message: "Cafe created successfully",
        data: cafe
      }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }

  async update(req: Request, { params }: { params: { id: string } }) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'super_admin') return forbiddenResponse();

    try {
      const body = await req.json();
      const validatedData = cafeUpdateSchema.parse(body);
      const cafe = await cafeService.update(params.id, validatedData);
      return NextResponse.json({
        success: true,
        message: "Cafe updated successfully",
        data: cafe
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
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
      return NextResponse.json({
        success: true,
        message: "Status updated successfully",
        data: cafe
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }
}

export const cafeController = new CafeController();
