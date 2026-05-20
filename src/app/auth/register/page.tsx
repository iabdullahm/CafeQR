'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Coffee, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const initialPlan = searchParams.get('plan') || 'free';
  const role = searchParams.get('role') || 'cafe_owner';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [plan, setPlan] = useState(initialPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('plan')) {
      setPlan(searchParams.get('plan') as string);
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!email || !password || !fullName || !cafeName) return;

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoading(true);

    try {
      // 1. Create standard Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      
      // 2. Create the Cafe Document
      const cafeId = cred.user.uid + '_cafe';
      await setDoc(doc(db, 'cafes', cafeId), {
        name: cafeName,
        owner_name: fullName,
        owner_email: normalizedEmail,
        plan: plan,
        createdAt: new Date().toISOString(),
        isActive: true
      });

      // 3. Create the Firestore user profile
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        fullName: fullName,
        email: normalizedEmail,
        role: 'OWNER',
        cafeId: cafeId,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Registration Successful!",
        description: "Welcome to CafeQR. Setting up your dashboard...",
      });
      
      router.push('/cafe-admin');
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = "Registration failed. Please try again.";
      
      if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Please log in.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password is too weak. Please use at least 6 characters.";
      }

      setErrorMessage(message);
      toast({
        variant: "destructive",
        title: "Registration failed",
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
            <Coffee className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold text-primary">Join CafeQR</CardTitle>
          <CardDescription>Create your account and setup your digital menu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider" htmlFor="fullName">Full Name</label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="h-12 border-muted focus-visible:ring-amber-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider" htmlFor="cafeName">Cafe Name</label>
              <Input
                id="cafeName"
                type="text"
                placeholder="My Awesome Cafe"
                value={cafeName}
                onChange={(e) => setCafeName(e.target.value)}
                disabled={isLoading}
                className="h-12 border-muted focus-visible:ring-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider" htmlFor="email">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 border-muted focus-visible:ring-amber-500"
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
                className="h-12 border-muted focus-visible:ring-amber-500"
                autoComplete="new-password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider" htmlFor="plan">Selected Plan</label>
              <select 
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="free">Free (0 OMR)</option>
                <option value="starter">Basic (5 OMR/mo)</option>
                <option value="growth">Popular ⭐ (9 OMR/mo)</option>
                <option value="pro">Business (15 OMR/mo)</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 font-black h-12 text-lg rounded-xl shadow-lg shadow-amber-600/20 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : "Create Account"}
            </Button>
            
            <div className="text-center text-sm font-medium text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 font-bold hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
