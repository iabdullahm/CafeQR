"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useJwtAuth } from "@/hooks/use-jwt-auth";
import { useMemo, type DependencyList } from "react";

/**
 * Drop-in shims for the legacy @/firebase hooks.
 *
 * - useUser     : JWT-backed (delegates to useJwtAuth). `user` is typed
 *                 as `any` so legacy callers like `user.uid` typecheck.
 * - useAuth     : null.
 * - useFirestore: null (Firestore was retired in favor of Postgres APIs).
 * - useFirebase / useFirebaseApp : null services.
 * - useMemoFirebase: passthrough to useMemo for callers that still use it.
 */

export interface UserHookResult {
  user: any;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useUser(): UserHookResult {
  const { user, isUserLoading, userError } = useJwtAuth();
  return {
    user: user as any,
    isUserLoading,
    userError,
  };
}

export function useAuth(): any {
  return null;
}

export function useFirestore(): any {
  return null;
}

export function useFirebaseApp(): any {
  return null;
}

export function useFirebase(): {
  areServicesAvailable: boolean;
  firebaseApp: any;
  firestore: any;
  auth: any;
  user: any;
  isUserLoading: boolean;
  userError: Error | null;
} {
  const { user, isUserLoading, userError } = useJwtAuth();
  return {
    areServicesAvailable: false,
    firebaseApp: null,
    firestore: null,
    auth: null,
    user: user as any,
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
