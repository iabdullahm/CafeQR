import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coffee, QrCode, ShieldCheck, Store } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="font-headline font-bold text-xl text-primary">CafeQR</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/super-admin">
            Super Admin
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/cafe-admin">
            Cafe Admin
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-card to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-primary">
                  Modern QR Ordering for Your Cafe
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Empower your customers to order directly from their tables. Manage everything from one intuitive dashboard.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/cafe-admin">Get Started as Cafe Owner</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/c/demo/branch1/table1">View Demo Menu</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <QrCode className="h-12 w-12 text-accent mb-2" />
                <h3 className="text-xl font-headline font-bold">QR Ordering</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Seamless scanning and ordering process for dine-in and car services.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <Store className="h-12 w-12 text-primary mb-2" />
                <h3 className="text-xl font-headline font-bold">Multi-Tenant</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Secure data isolation for every cafe on the platform.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <ShieldCheck className="h-12 w-12 text-primary mb-2" />
                <h3 className="text-xl font-headline font-bold">Smart Management</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Real-time order tracking and AI-powered menu descriptions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-card">
        <p className="text-xs text-muted-foreground">© 2024 CafeQR SaaS. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
