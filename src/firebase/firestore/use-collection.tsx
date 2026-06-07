"use client";

export interface UseCollectionResult<T = unknown> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * No-op replacement for the old Firestore useCollection hook.
 * Accepts (and ignores) any arguments to stay drop-in compatible with
 * legacy callers like useCollection(query(...)).
 */
export function useCollection<T = unknown>(..._args: unknown[]): UseCollectionResult<T> {
  void _args;
  return { data: null, isLoading: false, error: null };
}
