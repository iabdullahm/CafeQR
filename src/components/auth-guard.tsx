
"use client";

import { useEffect, ReactNode } from "react";
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
    if (!isProfileLoading && profile) {
      // 1. Enforce account activity check
      if (profile.isActive === false) {
        // If inactive, we could redirect to a support page or back to login
        router.push("/login?error=inactive");
        return;
      }

      // 2. Enforce role-based access control
      if (allowedRoles && profile.role) {
        if (!allowedRoles.includes(profile.role)) {
          // If role doesn't match, redirect to login or show forbidden
          router.push("/login?error=unauthorized");
        }
      }
    }
  }, [profile, isProfileLoading, allowedRoles, router]);

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

  // If no user after loading, we render nothing (useEffect handles redirection)
  if (!user || !profile) return null;

  return <>{children}</>;
}
