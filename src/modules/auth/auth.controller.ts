import { NextResponse } from 'next/server';
import { authService } from './auth.service';
import { loginSchema } from '@/lib/validations/auth';
import { getAuthorizedUser, unauthorizedResponse } from '@/middleware/auth-helpers';

/**
 * @fileOverview Auth Controller manages HTTP request/response for Auth routes.
 */

export class AuthController {
  async login(req: Request) {
    try {
      const body = await req.json();
      const validatedData = loginSchema.parse(body);
      
      const result = await authService.login(validatedData);
      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Authentication failed' },
        { status: 401 }
      );
    }
  }

  async getMe(req: Request) {
    const user = getAuthorizedUser(req);
    if (!user) return unauthorizedResponse();

    const currentUser = await authService.getMe(user.userId);
    return NextResponse.json(currentUser);
  }
}

export const authController = new AuthController();
