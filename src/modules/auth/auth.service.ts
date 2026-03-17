import { comparePassword, generateToken } from '@/lib/auth';
import { LoginInput } from '@/lib/validations/auth';

/**
 * @fileOverview Auth Service handles core authentication business logic.
 */

export class AuthService {
  async login(input: LoginInput) {
    // In a real app, we would use prisma.user.findUnique
    // For now, mirroring the mock login from seed data
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

    throw new Error('Invalid email or password');
  }

  async getMe(userId: string) {
    // Mock user retrieval
    return {
      id: userId,
      email: 'admin@cafeqr.com',
      fullName: 'Super Admin',
      role: 'super_admin'
    };
  }
}

export const authService = new AuthService();
