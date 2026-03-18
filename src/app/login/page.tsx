'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Coffee, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      // Use Firebase Auth directly
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;
      
      // Update local store for components that haven't migrated to useUser() yet
      const userData = {
        id: fbUser.uid,
        full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || '',
        roles: ['cafe_admin'] // Default for prototype
      };
      
      const token = await fbUser.getIdToken();
      setAuth(userData, token);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.full_name}`,
      });

      // Simple routing based on standard flow
      router.push('/cafe-admin');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message || "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-none animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Coffee className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold">Welcome to CafeQR</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cafeqr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary font-bold h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : "Sign In"}
            </Button>
            <div className="text-center p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground mt-4">
              <p className="font-bold mb-1">Demo Access:</p>
              <p>Email: admin@cafeqr.com</p>
              <p>Password: 123456</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
