"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UseCollectionResult {
  data: any[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * No-op replacement for the old Firestore useCollection hook.
 * Accepts (and ignores) any arguments; returns null data with a loose
 * any[] type so legacy `.map(...)` consumers keep typechecking.
 */
export function useCollection(..._args: any[]): UseCollectionResult {
  void _args;
  return { data: null, isLoading: false, error: null };
}
