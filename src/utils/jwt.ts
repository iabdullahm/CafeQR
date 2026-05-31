
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  cafeId?: string;
  impersonatedBy?: string;
}

/**
 * Parse a duration string like "7d", "12h", "30m" into seconds.
 * Falls back to 7 days if the value can't be parsed — this is what the
 * legacy code intended but never produced (it passed the raw string to
 * jsonwebtoken with `as any`, which broke the recent jsonwebtoken
 * type-narrowing and silently set the token to expire at iat+0s).
 */
function expiresInSeconds(raw: string | undefined): number {
  const DEFAULT = 60 * 60 * 24 * 7; // 7 days
  if (!raw) return DEFAULT;
  const trimmed = String(raw).trim();
  // Allow a plain integer = seconds.
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const m = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!m) return DEFAULT;
  const n = Number(m[1]);
  switch (m[2].toLowerCase()) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 3600;
    case 'd': return n * 86400;
    default:  return DEFAULT;
  }
}

const EXPIRES_IN_SECONDS = expiresInSeconds(env.jwtExpiresIn);

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwtSecret as string, { expiresIn: EXPIRES_IN_SECONDS });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
};
