
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Coffee, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { 
        email: email.trim(), 
        password 
      });
      
      const { token, user } = res.data.data;
      setAuth(user, token);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.full_name}`,
      });

      // Simple routing based on user roles
      if (user.roles && (user.roles.includes('super_admin') || user.roles.includes('admin'))) {
        router.push('/super-admin');
      } else {
        router.push('/cafe-admin');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Invalid credentials";
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
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
