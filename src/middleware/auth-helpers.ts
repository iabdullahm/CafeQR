import { NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth';

/**
 * @fileOverview Auth Middleware helpers for route protection.
 */

/**
 * Helper to validate JWT from request headers
 */
export function getAuthorizedUser(req: Request): TokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ 
    success: false, 
    error: 'Unauthorized: No valid token provided' 
  }, { status: 401 });
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse() {
  return NextResponse.json({ 
    success: false, 
    error: 'Forbidden: You do not have the required role to access this resource' 
  }, { status: 403 });
}

/**
 * Functional wrapper for role-based authorization
 */
export function withRole(req: Request, requiredRoles: string[], handler: (user: TokenPayload) => Promise<NextResponse>) {
  const user = getAuthorizedUser(req);
  
  if (!user) {
    return unauthorizedResponse();
  }

  // Check if user has at least one of the required roles
  const hasPermission = requiredRoles.some(role => user.roles.includes(role));

  if (!hasPermission) {
    return forbiddenResponse();
  }

  return handler(user);
}
