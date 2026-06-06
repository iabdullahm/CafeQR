/**
 * AuthGuard — JWT-based route guard (post Firebase Auth removal).
 *
 * Reads the user via useJwtAuth (which itself reads the localStorage JWT
 * and re-verifies via /api/auth/me). Redirects to /login when there is
 * no valid session. Enforces optional role-based access via allowedRoles.
 *
 * Pre-migration: this used Firebase Auth + a Firestore /users/{uid} doc
 * lookup. That created two failure modes — invalid Firebase config could
 * crash the whole admin app, and a missing Firestore profile would loop
 * users back to /login. Both are gone.
 */

"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return;

    // No session — back to login.
    if (!user) {
      router.push("/login");
      return;
    }

    // Role gate.
    if (allowedRoles && allowedRoles.length > 0) {
      // user.roles is supplied by the JWT-backed useUser implementation.
      const myRoles: string[] = Array.isArray((user as unknown as { roles?: string[] }).roles)
        ? (user as unknown as { roles: string[] }).roles
        : [];
      const allowed = myRoles.some((r) => allowedRoles.includes(r.toUpperCase()));
      if (!allowed) {
        router.push("/login?error=unauthorized");
        return;
      }
    }
  }, [user, isUserLoading, allowedRoles, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-lg font-headline">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // useEffect is already routing; render nothing while it happens.
    return null;
  }

  return <>{children}</>;
}
