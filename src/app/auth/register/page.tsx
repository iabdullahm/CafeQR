"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Self-service registration was tied to Firebase Auth. After the JWT
 * migration accounts are seeded server-side via prisma/scripts/create-admin.ts.
 *
 * This page now just redirects to /login. If you need new account
 * creation later, build a /api/auth/register endpoint that bcrypts and
 * upserts a Postgres user.
 */
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Redirecting to sign in...
    </div>
  );
}
