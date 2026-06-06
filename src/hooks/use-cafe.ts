import { useState, useEffect } from "react";
import { useUser } from "@/firebase";

/**
 * useCafe — resolves the active cafeId for the current session.
 *
 * Priority:
 *   1. Impersonation token (super-admin "view as cafe owner") — cafeId
 *      embedded in the JWT alongside `impersonatedBy`.
 *   2. The signed-in user's own cafeId (from useUser, supplied by the
 *      JWT login response).
 *
 * Post Firebase Auth removal: this hook no longer fetches /users/{uid}
 * from Firestore. Everything it needs is on the JWT-backed user.
 */
export function useCafe() {
  const { user } = useUser();

  const [impersonatedCafeId, setImpersonatedCafeId] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setImpersonatedCafeId(null);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.impersonatedBy && payload.cafeId) {
        setImpersonatedCafeId(payload.cafeId);
      } else {
        setImpersonatedCafeId(null);
      }
    } catch {
      setImpersonatedCafeId(null);
    }
  }, [user]);

  // useUser() (JWT-backed) puts cafeId on the user object.
  const userCafeId = (user as unknown as { cafeId?: string | null } | null)?.cafeId ?? null;
  const cafeId = impersonatedCafeId || userCafeId || null;

  return { cafeId, userProfile: user, isImpersonating: !!impersonatedCafeId };
}
