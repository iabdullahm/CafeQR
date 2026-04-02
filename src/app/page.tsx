"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Coffee, QrCode, Smartphone, Car, LayoutDashboard, 
  MapPin, Zap, TrendingUp, Heart, Star, CheckCircle2, ChevronRight, Store, CreditCard, ShoppingBag, Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { translations } from './locales';

export default function Home() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "en" | "ar";
    if (savedLang && (savedLang === "en" || savedLang === "ar")) {
      setLang(savedLang);
    } else if (navigator.language.includes("ar")) {
      setLang("ar");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang]);

  if (!mounted) return <div className="min-h-screen bg-[#fafaf9]" />;

  const t = translations[lang];


  return (
    <div className={`flex flex-col min-h-screen bg-[#fafaf9] overflow-x-hidden ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 sm:h-20 flex items-center px-6 lg:px-12 backdrop-blur-xl bg-white/80 border-b border-zinc-100">
        <Link className="flex items-center gap-2 group" href="#">
          <div className="bg-amber-600 p-2 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-md shadow-amber-600/20">
            <Coffee className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tight text-zinc-900">Cafe<span className="text-amber-600">QR</span></span>
        </Link>
        <nav className={`ml-auto hidden md:flex items-center gap-8 ${lang === 'ar' ? 'mx-auto' : ''}`}>
          <Link className="text-sm font-bold text-zinc-600 hover:text-amber-600 transition-colors" href="#how-it-works">{t.nav.works}</Link>
          <Link className="text-sm font-bold text-zinc-600 hover:text-amber-600 transition-colors" href="#features">{t.nav.features}</Link>
          <Link className="text-sm font-bold text-zinc-600 hover:text-amber-600 transition-colors" href="#pricing">{t.nav.pricing}</Link>
        </nav>
        <div className={`flex items-center gap-3 ${lang === 'ar' ? 'mr-auto ml-0' : 'ml-auto md:ml-8'}`}>
          <div className="flex items-center gap-2 mr-2 md:mr-4 bg-zinc-100 p-1 rounded-full px-3 cursor-pointer hover:bg-zinc-200 transition-colors" 
               onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <Globe className="w-4 h-4 text-zinc-600" />
            <span className="text-xs font-bold text-zinc-700">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </div>
          <Link href="/cafe-admin" className="text-sm font-bold text-zinc-700 hover:text-amber-600 hidden sm:block">
            {t.nav.login}
          </Link>
          <Button asChild className="rounded-full bg-zinc-900 hover:bg-black text-white px-6 font-bold shadow-xl shadow-zinc-900/20">
            <Link href="/cafe-admin">{t.nav.start}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-24 sm:pt-32">
        {/* 1. HERO SECTION */}
        <section className="relative w-full py-12 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.1),transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.05),transparent_40%)]" />
          <div className="container px-6 lg:px-12 mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-bold text-sm tracking-wide mb-8 animate-fade-in shadow-sm border border-amber-200">
                <Coffee className="w-4 h-4" />
                {t.hero.badge}
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-zinc-900 tracking-tight leading-[1.1] mb-8 lg:leading-[1.1]">
                {t.hero.title1}
                <span className="text-amber-600 relative inline-block">
                  {t.hero.title2}
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-amber-300/60 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="8" fill="none" className="path-draw" />
                  </svg>
                </span>
              </h1>
              <p className="text-xl text-zinc-600 leading-relaxed font-medium mb-12 max-w-2xl mx-auto lg:mx-0">
                {t.hero.desc}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                <Button asChild className="h-16 px-10 rounded-full font-black text-lg bg-zinc-900 hover:bg-black text-white shadow-2xl shadow-zinc-900/30 w-full sm:w-auto hover:scale-105 transition-transform group relative overflow-hidden">
                  <Link href="/cafe-admin">
                    <span className="relative z-10">{t.hero.cta}</span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  </Link>
                </Button>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <Button asChild className="h-16 px-8 rounded-full font-bold text-lg bg-white border-2 border-zinc-200 text-zinc-700 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 shadow-sm w-full sm:w-auto transition-all">
                    <Link href="#demo">{t.hero.demo}</Link>
                  </Button>
                  <p className="text-xs text-zinc-400 font-medium px-4">{t.hero.noCard}</p>
                </div>
              </div>
            </div>
            {/* Visuals - Phone and Dashboard Abstract Mockup */}
            <div className="flex-1 w-full relative h-[500px] lg:h-[600px] flex items-center justify-center -rotate-2 hover:rotate-0 transition-transform duration-700">
               <div className="absolute right-0 lg:-right-10 top-10 w-4/5 h-4/5 bg-white rounded-3xl shadow-2xl shadow-zinc-200/50 border border-zinc-100 p-4 transform translate-x-10 -z-10 flex flex-col">
                  <div className="h-8 border-b border-zinc-100 flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 rounded-xl bg-zinc-50 border border-zinc-100 p-6 flex flex-col gap-4">
                     <div className="w-1/3 h-6 bg-zinc-200 rounded-md" />
                     <div className="flex gap-4">
                       <div className="w-1/4 h-24 bg-amber-100 rounded-xl" />
                       <div className="w-1/4 h-24 bg-green-100 rounded-xl" />
                       <div className="w-1/4 h-24 bg-blue-100 rounded-xl" />
                       <div className="flex-1 h-24 bg-zinc-200 rounded-xl" />
                     </div>
                     <div className="flex-1 bg-white rounded-xl border border-zinc-100 shadow-sm mt-4 p-4">
                       <div className="h-8 w-1/4 bg-zinc-100 rounded-md mb-4" />
                       {[1,2,3].map(i => <div key={i} className="h-12 w-full bg-zinc-50 rounded-lg mb-2" />)}
                     </div>
                  </div>
               </div>
               
               <div className="relative w-[280px] h-[580px] bg-zinc-900 rounded-[3rem] shadow-2xl border-[8px] border-zinc-900 overflow-hidden transform -translate-x-10 lg:-translate-x-20 rotate-6 hover:rotate-2 transition-transform duration-500">
                 <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                   <div className="w-1/3 h-4 bg-black rounded-b-xl" />
                 </div>
                 <div className="absolute inset-0 bg-zinc-50 flex flex-col">
                   <div className="h-48 bg-amber-600 w-full" />
                   <div className="flex-1 p-4 -mt-10 overflow-hidden space-y-3">
                     <div className="w-full h-32 bg-white rounded-2xl shadow-md p-4 flex flex-col gap-2">
                       <div className="w-12 h-12 bg-amber-100 rounded-xl mb-auto" />
                       <div className="w-3/4 h-4 bg-zinc-200 rounded-full" />
                       <div className="w-1/2 h-4 bg-zinc-100 rounded-full" />
                     </div>
                     {[1,2].map(i => (
                       <div key={i} className="w-full h-20 bg-white rounded-2xl border border-zinc-100 flex items-center p-3 gap-3">
                         <div className="w-14 h-14 bg-zinc-100 rounded-xl" />
                         <div className="flex-1 space-y-2">
                           <div className="w-full h-3 bg-zinc-200 rounded-full" />
                           <div className="w-1/2 h-3 bg-zinc-100 rounded-full" />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* 2. TRUST / LOGOS */}
        <section className="w-full py-10 border-y border-zinc-100 bg-white">
          <div className="container mx-auto px-6 text-center">
            <p className="text-center font-bold text-zinc-400 uppercase tracking-widest text-sm mb-10">{t.trusted}</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
              <div className="flex items-center gap-2 font-black text-2xl text-zinc-900"><Coffee className="w-8 h-8"/> BrewHouse</div>
              <div className="flex items-center gap-2 font-black text-2xl text-zinc-900"><Store className="w-8 h-8"/> Urban Cafe</div>
              <div className="flex items-center gap-2 font-black text-2xl text-zinc-900"><MapPin className="w-8 h-8"/> Local Roasters</div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section id="how-it-works" className="w-full py-24 bg-zinc-50 border-t border-zinc-100">
          <div className="container px-6 lg:px-12 mx-auto">
             <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-black text-zinc-900 mb-4">{t.works.title}</h2>
              <p className="text-lg text-zinc-500 font-medium">{t.works.desc}</p>
            </div>
            
             <div className="grid md:grid-cols-3 gap-8 relative">
               {/* Connecting Line (desktop) */}
               <div className="hidden md:block absolute top-[5rem] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-200 to-transparent z-0" />
               
               {t.works.steps.map((s: any, i: number) => {
                 const icons = [QrCode, Smartphone, CheckCircle2];
                 const Icon = icons[i];
                 return (
                  <div key={i} className="relative z-10 flex flex-col items-center text-center p-6 bg-white rounded-3xl shadow-xl shadow-zinc-200/30 border border-zinc-100 hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shadow-inner mb-6 relative">
                      <div className={`absolute -top-3 ${lang === 'ar' ? '-left-3' : '-right-3'} w-8 h-8 bg-amber-600 text-white font-black rounded-full flex items-center justify-center border-4 border-white`}>
                        {i + 1}
                      </div>
                      <Icon className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 mb-3">{s.title}</h3>
                    <p className="text-zinc-600 leading-relaxed font-medium">{s.desc}</p>
                  </div>
                 );
               })}
             </div>
          </div>
        </section>

        {/* 4. FEATURES */}
        <section id="features" className="w-full py-24 bg-white">
          <div className="container px-6 lg:px-12 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-black text-zinc-900 mb-4">{t.features.title}</h2>
              <p className="text-lg text-zinc-500 font-medium">{t.features.desc}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {t.features.list.map((f: any, i: number) => {
                 const icons = [Zap, TrendingUp, Car, LayoutDashboard, Heart, Store];
                 const colors = ['text-yellow-600', 'text-green-600', 'text-amber-600', 'text-blue-600', 'text-red-600', 'text-purple-600'];
                 const bgs = ['bg-yellow-100', 'bg-green-100', 'bg-amber-100', 'bg-blue-100', 'bg-red-100', 'bg-purple-100'];
                 const Icon = icons[i];
                 return (
                  <div key={i} className="flex flex-col p-8 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:shadow-2xl hover:shadow-zinc-200/50 transition-all group">
                    <div className={`w-14 h-14 ${bgs[i]} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${colors[i]}`} />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 mb-3">{f.title}</h3>
                    <p className="text-zinc-600 font-medium leading-relaxed">{f.desc}</p>
                  </div>
                 );
               })}
            </div>
          </div>
        </section>

        {/* 5. USE CASES */}
        <section className="w-full py-24 bg-zinc-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15),transparent_60%)]" />
          <div className="container px-6 lg:px-12 mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <h2 className="text-4xl lg:text-5xl font-black">{t.usecases.title}</h2>
                <p className="text-xl text-zinc-400 font-medium leading-relaxed">{t.usecases.desc}</p>
                <div className="space-y-6 pt-4 text-left">
                  {t.usecases.list.map((uc: any, i: number) => (
                     <div key={i} className="flex gap-4 items-start">
                       <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                       <div>
                         <h4 className="text-xl font-bold mb-1">{uc.title}</h4>
                         <p className="text-zinc-400">{uc.desc}</p>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full flex justify-center lg:justify-end">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 pt-12">
                      <div className="bg-zinc-800 p-6 rounded-3xl border border-zinc-700 aspect-square flex flex-col items-center justify-center text-center">
                        <Store className="w-12 h-12 text-amber-500 mb-4" />
                        <h5 className="font-bold text-lg">Dine In</h5>
                      </div>
                      <div className="bg-zinc-800 p-6 rounded-3xl border border-zinc-700 aspect-square flex flex-col items-center justify-center text-center">
                        <ShoppingBag className="w-12 h-12 text-green-500 mb-4" />
                        <h5 className="font-bold text-lg">Takeaway</h5>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-amber-600 p-6 rounded-3xl shadow-2xl shadow-amber-600/20 aspect-video flex flex-col items-center justify-center text-center relative overflow-hidden h-full">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <Car className="w-16 h-16 text-white mb-4 relative z-10" />
                        <h5 className="font-black text-2xl text-white relative z-10">Drive-Thru Alternative</h5>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. DASHBOARD PREVIEW */}
        <section className="w-full py-24 bg-zinc-50">
          <div className="container px-6 lg:px-12 mx-auto text-center">
            <h2 className="text-4xl font-black text-zinc-900 mb-4">{t.dashboard.title}</h2>
            <p className="text-lg text-zinc-500 font-medium max-w-2xl mx-auto mb-16">{t.dashboard.desc}</p>
            
            <div className={`w-full max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl shadow-zinc-200 border border-zinc-200 overflow-hidden ${lang === 'ar' ? 'text-right' : 'text-left'} relative`}>
               <div className="h-12 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400" />
                 <div className="w-3 h-3 rounded-full bg-amber-400" />
                 <div className="w-3 h-3 rounded-full bg-green-400" />
                 <div className="ml-4 h-6 w-64 bg-white rounded-md border border-zinc-200 flex items-center px-2">
                   <div className="text-[10px] font-mono text-zinc-400">admin.cafeqr.com</div>
                 </div>
               </div>
               <div className="flex h-[400px] md:h-[600px] bg-zinc-50">
                 {/* Sidebar mock */}
                 <div className="w-16 md:w-64 bg-white border-r border-zinc-200 p-4 space-y-4">
                   <div className="h-8 w-8 md:w-full bg-zinc-100 rounded-lg mb-8" />
                   {[1,2,3,4,5].map((i: number) => <div key={i} className="h-8 w-8 md:w-full bg-zinc-100 rounded-lg" />)}
                 </div>
                 {/* Content mock */}
                 <div className="flex-1 p-6 md:p-8 space-y-6 overflow-hidden">
                   <div className="flex justify-between items-center">
                     <div className="h-8 w-32 bg-zinc-200 rounded-lg" />
                     <div className="h-8 w-24 bg-amber-500 rounded-lg" />
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[1,2,3,4].map((i: number) => <div key={i} className="h-24 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm" />)}
                   </div>
                   <div className="h-64 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm" />
                 </div>
               </div>
               
               {/* Floating Overlay Element */}
               <div className={`absolute bottom-8 ${lang === 'ar' ? 'left-8' : 'right-8'} bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl animate-bounce hidden md:flex items-center gap-4`}>
                 <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <p className="font-bold">{t.dashboard.alertTitle}</p>
                   <p className="text-sm text-zinc-400">{t.dashboard.alertDesc}</p>
                 </div>
               </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="w-full py-24 bg-white">
          <div className="container px-6 lg:px-12 mx-auto">
             <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-black text-zinc-900 mb-4">{t.pricing.title}</h2>
              <p className="text-lg text-zinc-500 font-medium">{t.pricing.desc}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {t.pricing.cards.map((c: any, i: number) => (
                <Card key={i} className={`rounded-[2rem] flex flex-col transition-colors shadow-none hover:shadow-xl ${
                    i === 1 ? 'border-amber-500 bg-amber-50 shadow-xl shadow-amber-500/10 relative scale-105 z-10' : 
                    i === 3 ? 'border-zinc-200 bg-zinc-900 text-white hover:border-amber-500' :
                    'border-zinc-200 bg-white hover:border-amber-500'
                }`}>
                    {c.tag && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white font-black text-xs px-4 py-1 rounded-full uppercase tracking-widest">
                        {c.tag}
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className={`text-2xl font-black ${i === 1 ? 'text-amber-900' : ''}`}>{c.name}</CardTitle>
                      <CardDescription className={`font-medium mt-2 ${i === 1 ? 'text-amber-700/80' : i === 3 ? 'text-zinc-400' : 'text-zinc-500'}`}>{c.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mt-4 mb-8">
                        <span className={`text-3xl font-black ${i === 1 ? 'text-amber-900' : i === 3 ? 'text-white' : 'text-zinc-900'}`}>{c.price}</span>
                      </div>
                      <ul className="space-y-3">
                        {c.features.map((feat: any, fi: number) => (
                           <li key={fi} className={`flex gap-3 font-medium ${i === 1 ? 'text-amber-900' : i === 3 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                             <CheckCircle2 className={`w-5 h-5 shrink-0 ${i === 1 ? 'text-amber-600' : 'text-amber-500'}`} /> {feat}
                           </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className={`w-full rounded-2xl h-12 font-bold ${
                          i === 1 ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30' : 
                          i === 3 ? 'bg-white text-black hover:bg-zinc-200' : ''
                      }`} variant={i !== 1 ? 'outline' : 'default'} asChild>
                         <Link href="/cafe-admin">{c.btn}</Link>
                      </Button>
                    </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 8. TESTIMONIALS */}
        <section className="w-full py-24 bg-zinc-50 border-t border-zinc-200">
          <div className="container px-6 lg:px-12 mx-auto">
             <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-black text-zinc-900 mb-4">{t.reviews.title}</h2>
            </div>
            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              {[
                { name: 'Ahmed', role: 'Owner, The Roastery', quote: 'CafeQR cut our table waiting times by 50%. The Car Ordering feature alone boosted our evening sales by thousands of OMR.' },
                { name: 'Sarah', role: 'Manager, Bean&Co', quote: 'The dashboard is incredibly intuitive. Updating the menu used to take days with prints, now it takes 2 minutes.' },
                { name: 'Khalid', role: 'Operations, Drip Connect', quote: 'Customers love the visual menu. We saw an immediate 20% increase in average ticket size just through smart upselling.' }
              ].map((tw: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] shadow-lg shadow-zinc-200/50 border border-zinc-100 flex flex-col gap-6 relative">
                  <div className="flex gap-1 justify-start">
                    {[1,2,3,4,5].map((s: number) => <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-lg text-zinc-700 font-medium italic">"{tw.quote}"</p>
                  <div className="mt-auto flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center font-black text-zinc-500">{tw.name[0]}</div>
                    <div>
                      <p className="font-bold text-zinc-900">{tw.name}</p>
                      <p className="text-sm text-zinc-500">{tw.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. FINAL CTA */}
        <section className="w-full py-24 bg-zinc-900 text-center px-6">
           <div className="max-w-4xl mx-auto bg-gradient-to-br from-amber-600 to-amber-800 rounded-[3rem] p-12 lg:p-20 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
             <div className="relative z-10 flex flex-col items-center">
               <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight">{t.finalCta.title}</h2>
               <p className="text-xl text-amber-100/90 font-medium mb-10 max-w-2xl mx-auto">
                 {t.finalCta.desc}
               </p>
               <Button asChild size="lg" className="rounded-full bg-white text-amber-900 hover:bg-zinc-100 h-16 w-full sm:w-auto px-12 text-xl font-black shadow-xl transition-transform hover:scale-105">
                 <Link href="/cafe-admin">{t.finalCta.btn}</Link>
               </Button>
             </div>
           </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 px-6 lg:px-12 border-t border-zinc-200 bg-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="bg-amber-600 p-1.5 rounded-lg">
                <Coffee className="h-4 w-4 text-white" />
             </div>
             <span className="font-black text-xl tracking-tight text-zinc-900">Cafe<span className="text-amber-600">QR</span></span>
          </div>
          <p className="text-sm font-medium text-zinc-500 text-center md:text-left">
            {t.footer.copy}
          </p>
          <div className="flex items-center gap-6">
            {t.footer.links.map((link: any, i: number) => (
              <Link key={i} href="#" className="text-sm font-medium text-zinc-500 hover:text-amber-600 transition-colors">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
