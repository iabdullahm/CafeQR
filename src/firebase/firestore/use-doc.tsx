"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UseDocResult {
  data: any;
  isLoading: boolean;
  error: Error | null;
}

/**
 * No-op replacement for the old Firestore useDoc hook.
 * data is typed as `any` so legacy callers (e.g. `configDoc?.language`)
 * keep typechecking without forcing a property contract.
 */
export function useDoc(..._args: any[]): UseDocResult {
  void _args;
  return { data: null, isLoading: false, error: null };
}
