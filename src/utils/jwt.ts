
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwtSecret as string, { expiresIn: env.jwtExpiresIn as any });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
};
