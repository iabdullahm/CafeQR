/**
 * useJwtAuth — the new auth source of truth for client pages.
 *
 * What it does:
 *   - Reads the JWT from localStorage
 *   - Hits /api/auth/me to hydrate the full user (id, email, roles, cafeId)
 *   - Re-checks on storage events (so multi-tab logins stay in sync)
 *   - Exposes signOut() that clears localStorage and pushes to /login
 *
 * Shape returned (Firebase-compatible so the 30+ pages that do
 * `const { user } = useUser()` keep working):
 *
 *   user: {
 *     uid: string            // Postgres user.id as string
 *     email: string
 *     displayName: string
 *     roles: string[]        // SUPER_ADMIN, OWNER, etc.
 *     cafeId: string | null  // tenant scope
 *     getIdToken: () => Promise<string>  // returns the raw JWT
 *   } | null
 *
 * Why a Firebase-shaped user: most cafe-admin pages already use
 * user.uid and user.email. Keeping the same field names means we do not
 * have to touch every file. Pages that previously read role + cafeId
 * from Firestore (/users/{uid}) can now read them directly from this
 * object instead.
 */

"use client";

import { useEffect, useState, useCallback } from "react";

export interface JwtUser {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  cafeId: string | null;
  getIdToken: () => Promise<string>;
}

export interface UseJwtAuthResult {
  user: JwtUser | null;
  isUserLoading: boolean;
  userError: Error | null;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const STORAGE_KEY_TOKEN = "token";
const STORAGE_KEY_USER = "cafeqr_user";

function readCachedUser(token: string): JwtUser | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_USER) : null;
    if (!raw) return null;
    const obj = JSON.parse(raw) as {
      id: string;
      email: string;
      full_name?: string;
      roles?: string[];
      cafeId?: string | null;
    };
    return {
      uid: String(obj.id),
      email: obj.email,
      displayName: obj.full_name || obj.email,
      roles: Array.isArray(obj.roles) ? obj.roles : [],
      cafeId: obj.cafeId ?? null,
      getIdToken: async () => token,
    };
  } catch {
    return null;
  }
}

async function fetchUserFromServer(token: string): Promise<JwtUser | null> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        id: string;
        email: string;
        full_name?: string;
        roles?: string[];
        cafeId?: string | null;
      };
    };
    if (!json.success || !json.data) return null;
    const obj = json.data;
    // Cache for fast paint on next reload.
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(obj));
    } catch {
      /* quota or disabled — ignore */
    }
    return {
      uid: String(obj.id),
      email: obj.email,
      displayName: obj.full_name || obj.email,
      roles: Array.isArray(obj.roles) ? obj.roles : [],
      cafeId: obj.cafeId ?? null,
      getIdToken: async () => token,
    };
  } catch {
    return null;
  }
}

export function useJwtAuth(): UseJwtAuthResult {
  const [user, setUser] = useState<JwtUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true);
  const [userError, setUserError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsUserLoading(true);
    setUserError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_TOKEN) : null;
    if (!token) {
      setUser(null);
      setIsUserLoading(false);
      return;
    }

    // Paint fast from cache while we re-verify.
    const cached = readCachedUser(token);
    if (cached) setUser(cached);

    const fresh = await fetchUserFromServer(token);
    if (fresh) {
      setUser(fresh);
    } else {
      // /api/auth/me said no — token is invalid/expired. Clear state.
      try {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      } catch { /* ignore */ }
      setUser(null);
      setUserError(new Error("Session expired"));
    }
    setIsUserLoading(false);
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch { /* ignore */ }
    setUser(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Cross-tab + storage event sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_TOKEN || e.key === STORAGE_KEY_USER || e.key === null) {
        void refresh();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  return { user, isUserLoading, userError, signOut, refresh };
}
