
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Coffee, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Define the demo accounts for auto-provisioning in the prototype
const DEMO_ACCOUNTS = [
  { email: 'admin@cafeqr.com', password: '123456', role: 'SUPER_ADMIN', fullName: 'Platform Admin', cafeId: null },
  { email: 'abdullah@urbanbrew.om', password: 'Admin@123', role: 'OWNER', fullName: 'Abdullah Al Jahwari', cafeId: 'urban-brew-cafe' },
  { email: 'sara@urbanbrew.om', password: 'Admin@123', role: 'MANAGER', fullName: 'Sara Al Balushi', cafeId: 'urban-brew-cafe' },
  { email: 'faisal@coastalcup.om', password: 'Admin@123', role: 'OWNER', fullName: 'Faisal Al Hinai', cafeId: 'coastal-cup' },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Redirect handled by AuthGuard or triggered here for speed
      // We check if it's the admin or a cafe user
      const isPlatformAdmin = email.includes('admin@cafeqr.com');
      router.push(isPlatformAdmin ? '/super-admin' : '/cafe-admin');
    }
  }, [user, router, email]);

  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType === 'inactive') {
      setErrorMessage('Your account is currently inactive. Please contact support.');
    } else if (errorType === 'unauthorized') {
      setErrorMessage('You do not have permission to access this area.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!email || !password) return;

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoading(true);

    try {
      // 1. Attempt standard sign in
      try {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } catch (signInErr: any) {
        // 2. If it's a demo account and doesn't exist, provision it (Prototype logic)
        const demo = DEMO_ACCOUNTS.find(d => d.email === normalizedEmail && d.password === password);
        
        if (demo && (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-email')) {
          const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          
          // Create the Firestore profile
          await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            fullName: demo.fullName,
            email: normalizedEmail,
            role: demo.role,
            cafeId: demo.cafeId,
            isActive: true,
            createdAt: new Date().toISOString()
          });

          // If they are an owner, we should ensure the cafe stub exists too
          if (demo.cafeId && (demo.role === 'OWNER' || demo.role === 'MANAGER')) {
            const cafeRef = doc(db, 'cafes', demo.cafeId);
            const cafeSnap = await getDoc(cafeRef);
            if (!cafeSnap.exists()) {
              await setDoc(cafeRef, {
                id: demo.cafeId,
                name: normalizedEmail.includes('urban') ? 'Urban Brew Cafe' : 'Coastal Cup',
                slug: demo.cafeId,
                isActive: true,
                currency: 'OMR',
                timezone: 'Asia/Muscat',
                createdAt: new Date().toISOString()
              });
            }
          }

          toast({
            title: "Demo account provisioned!",
            description: "Welcome to the CafeQR prototype.",
          });
          return;
        }
        
        // Re-throw if not a demo provisioning scenario
        throw signInErr;
      }
      
      toast({
        title: "Welcome back!",
        description: "Successfully authenticated.",
      });

    } catch (err: any) {
      console.error('Login error:', err);
      let message = "Invalid email or password.";
      
      if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered but the password was incorrect.";
      } else if (err.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later.";
      } else if (err.code === 'auth/invalid-credential') {
        message = "Invalid credentials. Please check your email and password.";
      }

      setErrorMessage(message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-none animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Coffee className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold text-primary">CafeQR Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider" htmlFor="email">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="abdullah@urbanbrew.om"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 border-muted focus-visible:ring-primary/20"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 border-muted focus-visible:ring-primary/20"
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 font-black h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="text-center p-4 bg-muted/50 rounded-2xl text-[10px] text-muted-foreground mt-6 border border-dashed border-muted-foreground/20">
            <p className="font-bold mb-2 uppercase tracking-widest text-primary/70">Prototype Access</p>
            <div className="grid grid-cols-1 gap-1 italic">
              <p>Super Admin: admin@cafeqr.com / 123456</p>
              <p>Owner: abdullah@urbanbrew.om / Admin@123</p>
              <p>Manager: sara@urbanbrew.om / Admin@123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
