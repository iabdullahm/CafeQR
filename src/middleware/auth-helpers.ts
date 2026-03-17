import { NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/utils/jwt';
import { errorResponse } from '@/utils/api-response';

/**
 * Helper to validate JWT from request headers
 */
export function getAuthorizedUser(req: Request): TokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

/**
 * Functional wrapper for role-based authorization in Next.js Routes
 */
export async function withAuth(
  req: Request, 
  allowedRoles: string[] | null, 
  handler: (user: TokenPayload) => Promise<NextResponse>
) {
  const user = getAuthorizedUser(req);
  
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  if (allowedRoles) {
    const hasAccess = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasAccess) {
      return errorResponse('Forbidden', 403);
    }
  }

  return handler(user);
}

/**
 * Specifically named role wrapper to match dashboard controller requirements
 */
export async function withRole(
  req: Request,
  allowedRoles: string[],
  handler: (user: TokenPayload) => Promise<NextResponse>
) {
  return withAuth(req, allowedRoles, handler);
}
