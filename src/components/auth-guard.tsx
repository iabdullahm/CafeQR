
"use client";

import { useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

/**
 * AuthGuard protects routes by checking Firebase Auth state and Firestore user profile.
 * It enforces account activity and role-based access control.
 */
export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Reference to the user's profile in Firestore to check roles and activity
  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    // Redirect to login if auth check finishes and no user is found
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!isProfileLoading && profile && user) {
      // 1. Enforce account activity check
      if (profile.isActive === false) {
        router.push("/login?error=inactive");
        return;
      }

      // 2. Enforce role-based access control
      if (allowedRoles && profile.role) {
        if (!allowedRoles.includes(profile.role)) {
          router.push("/login?error=unauthorized");
          return;
        }
      }

      // 3. Platform JWT Synchronization
      // If we have a profile but no token (or old version), try to sync
      const currentToken = localStorage.getItem('token');
      const tokenVersion = localStorage.getItem('token_version');
      
      if ((!currentToken || tokenVersion !== '1.1') && profile.email) {
        console.log("AuthGuard: Syncing platform token...");
        const demoCreds: Record<string, string> = {
          'admin@cafeqr.com': '123456',
          'abdullah@urbanbrew.om': 'Admin@123'
        };
        
        if (demoCreds[profile.email]) {
           axios.post('/api/auth/login', { email: profile.email, password: demoCreds[profile.email] })
            .then(res => {
              if (res.data.success) {
                localStorage.setItem('token', res.data.data.token);
                localStorage.setItem('token_version', '1.1');
                console.log("AuthGuard: Platform token synchronized.");
              }
            }).catch(e => console.error("Sync failed", e));
        }
      }
    }
  }, [profile, isProfileLoading, user, allowedRoles, router]);

  // Show a professional loading state during the authentication handshake
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-lg font-headline">Securing Session...</p>
        </div>
      </div>
    );
  }

  // If no user or profile after loading, we render nothing (useEffect handles redirection)
  if (!user || !profile) return null;

  // Prevent components from rendering if unauthorized or inactive
  if (profile.isActive === false) return null;
  if (allowedRoles && profile.role && !allowedRoles.includes(profile.role)) return null;

  return <>{children}</>;
}
