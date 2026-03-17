
import { generateToken, type TokenPayload } from '@/lib/auth';
import { type LoginInput } from '@/lib/validations/auth';

/**
 * @fileOverview Mock Auth Service for fallback or client-side logic.
 */

export class AuthService {
  async login(input: LoginInput) {
    // Sync with demo credentials provided in the UI
    if (input.email === 'admin@cafeqr.com' && input.password === '123456') {
      const user = {
        id: '1',
        email: 'admin@cafeqr.com',
        role: 'super_admin',
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
      full_name: payload.roles.includes('super_admin') ? 'Super Admin' : 'Cafe User'
    };
  }
}

export const authService = new AuthService();
