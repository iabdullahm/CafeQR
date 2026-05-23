
import { generateToken, type TokenPayload } from '@/lib/auth';
import { type LoginInput } from '@/lib/validations/auth';

/**
 * @fileOverview Mock Auth Service for fallback or client-side logic.
 * This service is kept in sync with the backend module for consistency.
 */

export class AuthService {
  async login(_input: LoginInput) {
    // Demo credential bypass removed for security. The real login flow now
    // goes through /api/auth/login, which validates against the database
    // (or the env-gated dev seed account in non-production builds).
    throw new Error('Use POST /api/auth/login — direct client login disabled.');
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
