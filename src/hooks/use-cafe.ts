import { useState, useEffect } from "react";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

export function useCafe() {
  const { user } = useUser();
  const db = useFirestore();

  const [impersonatedCafeId, setImpersonatedCafeId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.impersonatedBy && payload.cafeId) {
          setImpersonatedCafeId(payload.cafeId);
        }
      } catch (e) {}
    }
  }, []);

  const userProfileRef = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  
  const cafeId = impersonatedCafeId || userProfile?.cafeId || null;

  return { cafeId, userProfile, isImpersonating: !!impersonatedCafeId };
}
