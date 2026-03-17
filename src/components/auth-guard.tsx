"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, token, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    if (allowedRoles && user) {
      const hasRole = user.roles.some((role) => allowedRoles.includes(role));
      if (!hasRole) {
        router.push("/login");
      }
    }
  }, [user, token, router, allowedRoles]);

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-primary">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
