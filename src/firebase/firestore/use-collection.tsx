"use client";

export interface UseCollectionResult<T = unknown> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * No-op replacement for the old Firestore useCollection hook.
 * Returns empty data + finished loading. Real data is fetched via
 * /api/* polling in the pages that need it.
 */
export function useCollection<T = unknown>(): UseCollectionResult<T> {
  return { data: null, isLoading: false, error: null };
}
