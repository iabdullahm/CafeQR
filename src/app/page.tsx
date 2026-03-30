import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coffee, QrCode, ShieldCheck, Store, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card">
        <Link className="flex items-center justify-center gap-2" href="#">
          <span className="font-headline font-bold text-2xl text-primary">عُمان تُصَنِّع</span>
        </Link>
        <nav className="mr-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/super-admin">
            تسجيل دخول
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/cafe-admin">
            حساب المصنع
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-b from-card to-background relative overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-10 text-center">
              
              {/* Value Proposition */}
              <div className="space-y-6 max-w-4xl">
                <h1 className="text-4xl font-headline font-bold sm:text-5xl md:text-6xl text-primary leading-tight">
                  منصة وطنية تربط المستثمرين والمقاولين مباشرة بالمصانع العمانية 
                </h1>
                <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl md:leading-relaxed">
                  لتعزيز المحتوى المحلي وتقليل الاستيراد وبناء اقتصاد مستدام.
                </p>
              </div>

              {/* Advanced Search Feature (Core Feature) */}
              <div className="w-full max-w-3xl pt-4">
                <div className="relative group flex items-center shadow-2xl rounded-full bg-white p-2 border-2 border-primary/20 hover:border-primary transition-colors">
                  <div className="flex-1 pl-4 pr-6">
                    <Input 
                      className="border-0 shadow-none focus-visible:ring-0 text-xl py-8 px-0 placeholder:text-muted-foreground placeholder:font-light"
                      placeholder="ابحث عن: حديد، أسمنت، بلاستيك، مواد غذائية…" 
                      type="text"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full text-muted-foreground hover:bg-gray-100 shrink-0 mx-2">
                     <Filter className="h-6 w-6" />
                  </Button>
                  <Button size="icon" className="h-16 w-32 rounded-full bg-primary hover:bg-primary/90 shrink-0 text-lg font-bold">
                     <Search className="h-6 w-6 ml-2" />
                     بحث
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                   <span className="text-sm text-muted-foreground ml-2">الأكثر بحثاً:</span>
                   {["أنابيب بي في سي", "كابلات كهربائية", "رخام عماني", "تغليف"].map(tag => (
                     <span key={tag} className="text-sm bg-accent/30 text-accent-foreground px-3 py-1 rounded-full cursor-pointer hover:bg-accent/50 transition-colors">
                       {tag}
                     </span>
                   ))}
                </div>
              </div>

            </div>
          </div>
          
          {/* Decorative background blurs */}
          <div className="absolute top-1/4 -right-64 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-64 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t bg-card mt-auto">
        <p className="text-sm text-muted-foreground">© 2026 المنصة الوطنية. جميع الحقوق محفوظة.</p>
        <nav className="sm:mr-auto flex gap-4 sm:gap-6">
          <Link className="text-sm hover:underline underline-offset-4" href="#">
            الشروط والأحكام
          </Link>
          <Link className="text-sm hover:underline underline-offset-4" href="#">
            الخصوصية
          </Link>
        </nav>
      </footer>
    </div>
  );
}
