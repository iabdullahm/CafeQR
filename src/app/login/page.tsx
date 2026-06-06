/**
 * /login — JWT-only login page (post Firebase Auth removal).
 *
 * Flow:
 *   1. User enters email + password
 *   2. POST /api/auth/login (bcrypt verify against Postgres users)
 *   3. On 200, store token + user (id/email/roles/cafeId) in localStorage
 *   4. Redirect by role:
 *        SUPER_ADMIN  -> /super-admin
 *        OWNER/MANAGER/CASHIER/KITCHEN -> /cafe-admin
 *        anything else -> /
 *
 * Removed: Firebase signInWithEmailAndPassword, createUserWithEmailAndPassword,
 * Firestore auto-provisioning. To add a new admin/owner now use the
 * prisma/scripts/create-admin.ts CLI (see Task #104).
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coffee, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type LoginUser = {
  id: string;
  email: string;
  full_name?: string;
  roles?: string[];
  cafeId?: string | null;
};

function redirectForRoles(roles: string[]): string {
  const upper = roles.map((r) => r.toUpperCase());
  if (upper.includes("SUPER_ADMIN")) return "/super-admin";
  if (
    upper.includes("OWNER") ||
    upper.includes("MANAGER") ||
    upper.includes("CASHIER") ||
    upper.includes("KITCHEN")
  ) {
    return "/cafe-admin";
  }
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle ?error=... query params from AuthGuard redirects.
  useEffect(() => {
    const errorType = searchParams.get("error");
    if (errorType === "inactive") {
      setErrorMessage("Your account is currently inactive. Please contact support.");
    } else if (errorType === "unauthorized") {
      setErrorMessage(
        "You do not have permission to access that area. Please log in with the correct account."
      );
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("cafeqr_user");
      } catch {
        /* ignore */
      }
    } else if (errorType === "expired") {
      setErrorMessage("Your session has expired. Please log in again.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) return;

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Login failed (${res.status})`);
      }

      const { token, user } = json.data as { token: string; user: LoginUser };
      if (!token || !user) {
        throw new Error("Malformed server response — no token returned.");
      }

      // Persist token + user. useUser() (JWT-backed) picks both up.
      try {
        localStorage.setItem("token", token);
        localStorage.setItem("cafeqr_user", JSON.stringify(user));
        window.dispatchEvent(new Event("storage"));
      } catch {
        /* localStorage disabled — session will only last this tab */
      }

      toast({ title: "Welcome back", description: user.full_name || user.email });
      router.push(redirectForRoles(user.roles ?? []));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Coffee className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">CafeQR Sign In</CardTitle>
          <CardDescription>Welcome back. Use your admin email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign-in error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
