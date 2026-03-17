import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from './env';

/**
 * @fileOverview Core authentication utilities.
 */

export interface TokenPayload {
  sub: string; // User ID as 'sub' (subject) per standard JWT claims
  email: string;
  roles: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch (err) {
    return null;
  }
}
