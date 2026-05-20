import path from 'node:path';
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Replaces the deprecated `prisma` field in package.json (removed in Prisma 7).
 * Run with: prisma generate / prisma migrate dev / prisma db seed.
 *
 * Note: when a prisma.config.ts exists, Prisma 6 skips its built-in .env
 * autoloading, so we explicitly import 'dotenv/config' to keep DATABASE_URL
 * available the same way it was before this file existed.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
