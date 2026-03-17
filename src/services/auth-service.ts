
import { comparePassword, generateToken, type TokenPayload } from '@/lib/auth';
import { type LoginInput } from '@/lib/validations/auth';

// Mock DB interaction - In a real app, use a DB client like Prisma or pg
export class AuthService {
  async login(input: LoginInput) {
    // 1. Find user (Mocked)
    if (input.email === 'admin@cafeqr.com' && input.password === 'admin123') {
      const user = {
        id: '1',
        email: 'admin@cafeqr.com',
        role: 'super_admin',
        full_name: 'Super Admin'
      };

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return { user, token };
    }

    throw new Error('Invalid credentials');
  }

  async getCurrentUser(payload: TokenPayload) {
    // In real app: return await db.user.findUnique({ where: { id: payload.userId } })
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      full_name: payload.role === 'super_admin' ? 'Super Admin' : 'Cafe User'
    };
  }
}

export const authService = new AuthService();
