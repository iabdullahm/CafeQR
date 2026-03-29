
import { generateToken, type TokenPayload } from '@/lib/auth';
import { type LoginInput } from '@/lib/validations/auth';

/**
 * @fileOverview Mock Auth Service for fallback or client-side logic.
 * This service is kept in sync with the backend module for consistency.
 */

export class AuthService {
  async login(input: LoginInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Sync with demo credentials provided in the UI
    if (normalizedEmail === 'admin@cafeqr.com' && input.password === '123456') {
      const user = {
        id: '1',
        email: 'admin@cafeqr.com',
        role: 'SUPER_ADMIN',
        full_name: 'Demo Admin'
      };

      const token = generateToken({
        sub: user.id,
        email: user.email,
        roles: [user.role]
      } as any);

      return { user, token };
    }

    throw new Error('Invalid credentials');
  }

  async getCurrentUser(payload: TokenPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      full_name: payload.roles.includes('SUPER_ADMIN') ? 'Super Admin' : 'Cafe User'
    };
  }
}

export const authService = new AuthService();
