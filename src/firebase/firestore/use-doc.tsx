"use client";

export interface UseDocResult<T = unknown> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * No-op replacement for the old Firestore useDoc hook.
 * Accepts (and ignores) any arguments to stay drop-in compatible with
 * legacy callers like useDoc(docRef).
 */
export function useDoc<T = unknown>(..._args: unknown[]): UseDocResult<T> {
  void _args;
  return { data: null, isLoading: false, error: null };
}
