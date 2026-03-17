import { NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth';

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
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
