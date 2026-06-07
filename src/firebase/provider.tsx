"use client";

import { useJwtAuth } from "@/hooks/use-jwt-auth";
import { useMemo, type DependencyList } from "react";

/**
 * Drop-in shims for the legacy @/firebase hooks.
 *
 * - useUser     : JWT-backed (delegates to useJwtAuth).
 * - useAuth     : null.
 * - useFirestore: null (Firestore was retired in favor of Postgres APIs).
 * - useFirebase / useFirebaseApp : null services.
 * - useMemoFirebase: passthrough to useMemo for callers that still use it.
 */

export interface UserHookResult<U = unknown> {
  user: U | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useUser<U = unknown>(): UserHookResult<U> {
  const { user, isUserLoading, userError } = useJwtAuth();
  return {
    user: user as unknown as U | null,
    isUserLoading,
    userError,
  };
}

export function useAuth(): null {
  return null;
}

export function useFirestore(): null {
  return null;
}

export function useFirebaseApp(): null {
  return null;
}

export function useFirebase(): {
  areServicesAvailable: boolean;
  firebaseApp: null;
  firestore: null;
  auth: null;
  user: null;
  isUserLoading: boolean;
  userError: Error | null;
} {
  const { user, isUserLoading, userError } = useJwtAuth();
  return {
    areServicesAvailable: false,
    firebaseApp: null,
    firestore: null,
    auth: null,
    user: user as unknown as null,
    isUserLoading,
    userError,
  };
}

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
