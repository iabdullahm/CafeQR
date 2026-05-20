import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Replaces the deprecated `prisma` field in package.json (removed in Prisma 7).
 * Run with: prisma generate / prisma migrate dev / prisma db seed.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
