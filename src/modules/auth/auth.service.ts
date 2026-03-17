import { comparePassword, generateToken } from '@/lib/auth';
import { LoginInput } from '@/lib/validations/auth';

/**
 * @fileOverview Auth Service handles core authentication business logic.
 */

export class AuthService {
  async login(input: LoginInput) {
    // In a real app, use prisma.user.findUnique({ where: { email: input.email } })
    
    // Support for seeded admin login
    if (input.email === 'admin@cafeqr.com' && (input.password === '123456' || input.password === 'admin123')) {
      const user = {
        id: "1",
        email: 'admin@cafeqr.com',
        roles: ['super_admin'],
        full_name: 'Super Admin'
      };

      const token = generateToken({
        sub: user.id,
        email: user.email,
        roles: user.roles
      });

      return { user, token };
    }

    throw new Error('Invalid email or password');
  }

  async getMe(userId: string) {
    // In a real app, fetch from database using Prisma
    return {
      id: userId,
      email: 'admin@cafeqr.com',
      fullName: 'Super Admin',
      roles: ['super_admin']
    };
  }
}

export const authService = new AuthService();
