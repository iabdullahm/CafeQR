/**
 * @fileOverview Centralized environment variable management.
 */

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'cafeqr-default-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
