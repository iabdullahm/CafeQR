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
      
      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          token: result.token,
          user: result.user
        }
      });
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message || 'Authentication failed' 
        },
        { status: 401 }
      );
    }
  }

  async getMe(req: Request) {
    const userPayload = getAuthorizedUser(req);
    if (!userPayload) return unauthorizedResponse();

    const currentUser = await authService.getMe(userPayload.userId);
    
    return NextResponse.json({
      success: true,
      data: {
        id: currentUser.id,
        full_name: currentUser.fullName,
        email: currentUser.email,
        roles: [currentUser.role] // Returning as an array as requested
      }
    });
  }

  async logout() {
    return NextResponse.json({
      success: true,
      message: "Logout successful (Token cleared on client)"
    });
  }
}

export const authController = new AuthController();
