"use client";

export interface UseDocResult<T = unknown> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * No-op replacement for the old Firestore useDoc hook.
 * Real data is fetched via /api/* polling now.
 */
export function useDoc<T = unknown>(): UseDocResult<T> {
  return { data: null, isLoading: false, error: null };
}
