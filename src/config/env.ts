/**
 * @fileOverview Centralized environment variable management.
 *
 * SECURITY: There is intentionally NO fallback for JWT_SECRET. A
 * hardcoded default was discovered in the security audit — anyone
 * who could read the repository could forge JWTs for any tenant,
 * including SUPER_ADMIN. In production we now throw on missing
 * secret; in dev we throw too but with a clear message so the
 * developer notices instead of accidentally testing against a
 * predictable key.
 */

function requireSecret(name: string, value: string | undefined): string {
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${name} is not set or is too short (<16 chars). Refusing to boot — set it in Vercel project env.`
    );
  }
  // Dev/test — emit a noisy warning but throw too. The previous default
  // ("cafeqr-default-secret-key") would let a forged dev token verify
  // against prod if the prod secret leaked or matched.
  throw new Error(
    `${name} is not set. Add it to .env.local with at least 16 random chars before starting the dev server.`
  );
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: requireSecret("JWT_SECRET", process.env.JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};
