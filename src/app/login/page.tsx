
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Coffee, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

function LoginForm() {
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

  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const [hasManuallyLoggedIn, setHasManuallyLoggedIn] = useState(false);

  useEffect(() => {
    // If there's an error (like unauthorized), don't auto-redirect on initial load, let them see it and login again
    // However, if they just manually logged in, we SHOULD redirect them.
    if (searchParams.get('error') && !hasManuallyLoggedIn) return;

    if (user && profile && !isProfileLoading) {
      if (profile.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else {
        router.push('/cafe-admin');
      }
    }
  }, [user, profile, isProfileLoading, router, searchParams, hasManuallyLoggedIn]);

  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType === 'inactive') {
      setErrorMessage('Your account is currently inactive. Please contact support.');
    } else if (errorType === 'unauthorized') {
      setErrorMessage('You do not have permission to access that area. Please log in with the correct account.');
      // Auto sign out to prevent redirect loops and allow changing accounts
      signOut(auth).catch(console.error);
      localStorage.removeItem('token');
    }
  }, [searchParams, auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!email || !password) return;

    const normalizedEmail = email.trim().toLowerCase();
    const authEmail = normalizedEmail.includes('@') ? normalizedEmail : `${normalizedEmail}@cafeqr-tenant.local`;
    setIsLoading(true);

    try {
      // 1. Attempt standard sign in
      try {
        await signInWithEmailAndPassword(auth, authEmail, password);
      } catch (signInErr: any) {
        // 2. Dynamic Auto-provisioning logic
        let shouldProvision = false;
        let provisionData: any = null;

        // Auto-provision Super Admin for the new project
        if (normalizedEmail === 'admin@admin.com' || normalizedEmail === 'abdullah.j@creativetechno.net') {
          shouldProvision = true;
          provisionData = {
            email: normalizedEmail,
            password: password,
            role: 'SUPER_ADMIN',
            fullName: 'Platform Administrator',
            cafeId: 'SUPER_ADMIN',
            isDynamic: true
          };
        } else {
          // Standard Owner Provisioning
          const q = query(collection(db, 'cafes'), where('owner_email', '==', normalizedEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const cafeData = snap.docs[0].data();
            if (cafeData.owner_temp_pass === password && cafeData.adminAccessStatus !== 'suspended') {
              shouldProvision = true;
              provisionData = {
                email: normalizedEmail,
                password: password,
                role: 'OWNER',
                fullName: cafeData.owner_name || 'Cafe Admin',
                cafeId: snap.docs[0].id,
                isDynamic: true
              };
            }
          }
        }
        
        if (shouldProvision && (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-email' || signInErr.code === 'auth/wrong-password')) {
          const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
          
          // Create the Firestore profile
          await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            fullName: provisionData.fullName,
            email: normalizedEmail,
            role: provisionData.role,
            cafeId: provisionData.cafeId,
            isActive: true,
            createdAt: new Date().toISOString()
          });

          toast({
            title: "Admin Account Verified!",
            description: "Logging you into the platform...",
          });
          setHasManuallyLoggedIn(true);
          return;
        }
        
        // Re-throw if not a demo provisioning scenario
        throw signInErr;
      }
      
      setHasManuallyLoggedIn(true);
      toast({
        title: "Welcome back!",
        description: "Successfully authenticated.",
      });

      // 3. Synchronize with Platform JWT for API access
      try {
        const authResponse = await axios.post('/api/auth/login', { 
          email: normalizedEmail, 
          password,
          isFirebaseSynced: true 
        });
        
        if (authResponse.data.success && authResponse.data.data.token) {
          localStorage.setItem('token', authResponse.data.data.token);
        }
      } catch (authApiErr) {
        console.warn('Platform JWT sync failed, some API features may be limited', authApiErr);
      }

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
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider" htmlFor="email">Login ID (Email or Username)</label>
              <Input
                id="email"
                type="text"
                placeholder="admin@example.com or username"
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
