"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coffee, QrCode, Smartphone, Car, LayoutDashboard, MapPin, Zap, TrendingUp, Heart, Star, CheckCircle2, Store, CreditCard, Globe, ArrowRight, Utensils, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { translations } from './locales';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  const db = useFirestore();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [mounted, setMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    cafeName: '', ownerName: '', phone: '', city: 'Muscat', branches: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "en" | "ar";
    if (savedLang && (savedLang === "en" || savedLang === "ar")) {
      setLang(savedLang);
    } else if (navigator.language.includes("ar")) {
      setLang("ar");
    }
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'register') {
        setIsRegisterOpen(true);
        // Clean up the URL
        window.history.replaceState({}, '', '/');
      }
    }
    
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang]);

  if (!mounted) return <div className="min-h-screen bg-[#fafaf9]" />;

  const t = translations[lang] as any;

  return (
    <div className={`flex flex-col min-h-screen bg-[#fafaf9] overflow-x-hidden ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 sm:h-20 flex items-center px-6 lg:px-12 backdrop-blur-xl bg-white/80 border-b border-zinc-100">
        <Link className="flex items-center gap-2 group" href="#">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://storage.googleapis.com/ard3/CafeQR/erasebg-transformed.png" alt="CafeQR Logo" className="h-[130px] md:h-[160px] w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
        </Link>
        <nav className={`ml-auto hidden md:flex items-center gap-8 ${lang === 'ar' ? 'mx-auto' : ''}`}>
          <Link className="text-sm font-bold text-zinc-600 hover:text-amber-600 transition-colors" href="#how-it-works">{t.nav.works}</Link>
          <Link className="text-sm font-bold text-zinc-600 hover:text-amber-600 transition-colors" href="#features">{t.nav.features}</Link>
          <Link className="text-sm font-bold text-zinc-600 hover:text-amber-600 transition-colors" href="#pricing">{t.nav.pricing}</Link>
        </nav>
        <div className={`flex items-center gap-4 ml-auto lg:mr-0 lg:ml-auto ${lang === 'ar' ? 'mr-auto ml-0' : ''}`}>
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-full px-3 cursor-pointer hover:bg-zinc-200 transition-colors" 
               onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <span className="text-xs font-bold text-zinc-700">{lang === 'ar' ? 'English' : 'العربية'}</span>
            <Globe className="w-4 h-4 text-zinc-600" />
          </div>
          <Link href="/cafe-admin" className="text-sm font-bold text-zinc-700 hover:text-amber-600 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200">
            <Store className="w-4 h-4" />
            {t.nav.login}
          </Link>
          <Button onClick={() => { setSelectedPlan(null); setIsRegisterOpen(true); setIsSuccess(false); }} className="rounded-full bg-zinc-900 hover:bg-black text-white px-6 font-bold shadow-xl shadow-zinc-900/20">
            {t.nav.start}
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
              <p className="text-xl text-zinc-600 leading-relaxed font-medium mb-8 max-w-2xl mx-auto lg:mx-0">
                {t.hero.desc}
              </p>
              
              <ul className="flex flex-col gap-3 mb-10 max-w-2xl mx-auto lg:mx-0 text-left">
                {t.hero.bullets?.map((bullet: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-800 font-bold text-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                <Button onClick={() => { setSelectedPlan(null); setIsRegisterOpen(true); setIsSuccess(false); }} className="h-16 px-10 rounded-full font-black text-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-2xl shadow-amber-600/30 w-full sm:w-auto hover:scale-105 transition-transform group relative overflow-hidden border border-amber-500">
                  <span className="relative z-10">{t.hero.cta}</span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </Button>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <Button asChild className="h-16 px-8 rounded-full font-bold text-lg bg-white border-2 border-zinc-200 text-zinc-700 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 shadow-sm w-full sm:w-auto transition-all">
                    <Link href="/demo/menu">{t.hero.demo}</Link>
                  </Button>
                  <p className="text-xs text-zinc-400 font-medium px-4 opacity-80 mt-1">{t.hero.noCard}</p>
                </div>
              </div>
            </div>
            {/* Visuals - Phone and Dashboard Realistic Mockup */}
            <div className="flex-1 w-full relative h-[500px] lg:h-[600px] flex items-center justify-center -rotate-2 hover:rotate-0 transition-transform duration-700">
               <div className="absolute right-0 lg:-right-10 top-10 w-4/5 h-4/5 bg-white rounded-3xl shadow-2xl shadow-zinc-200/50 border border-zinc-100 p-4 transform translate-x-10 -z-10 flex flex-col">
                  {/* Browser Mac dots */}
                  <div className="h-8 border-b border-zinc-100 flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  {/* Dashboard Content */}
                  <div className="flex-1 rounded-xl bg-zinc-50 border border-zinc-100 p-4 flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                       <div className="w-1/3 h-6 bg-zinc-200 rounded-md" />
                       <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">SYSTEM LIVE</div>
                     </div>
                     <div className="flex gap-4">
                       <div className="w-1/4 h-24 bg-white border border-zinc-200 shadow-sm rounded-xl p-3 flex flex-col justify-center">
                         <span className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Live Revenue</span>
                         <span className="text-xl font-black text-zinc-900 font-mono">1,024<span className="text-sm font-medium text-zinc-400"> OMR</span></span>
                       </div>
                       <div className="w-1/4 h-24 bg-white border border-zinc-200 shadow-sm rounded-xl p-3 flex flex-col justify-center">
                         <span className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Active Tables</span>
                         <span className="text-xl font-black text-amber-600 font-mono">8</span>
                       </div>
                       <div className="w-1/4 h-24 bg-white border border-zinc-200 shadow-sm rounded-xl p-3 flex flex-col justify-center relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-8 h-8 bg-blue-100 rounded-bl-xl flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-blue-500" />
                         </div>
                         <span className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Kitchen Queue</span>
                         <span className="text-xl font-black text-zinc-900 font-mono">3 Orders</span>
                       </div>
                       <div className="flex-1 h-24 bg-zinc-200 rounded-xl" />
                     </div>
                     <div className="flex-1 bg-white rounded-xl border border-zinc-100 shadow-sm p-4 overflow-hidden">
                       <div className="text-xs font-bold text-zinc-400 uppercase mb-3 border-b pb-2 flex items-center justify-between">
                         Recent Activity
                         <span className="ext-xs font-normal text-amber-600">Refresh</span>
                       </div>
                       {[
                         {id: "#4901", table: "T-04", stat: "Preparing", col: "text-amber-500 bg-amber-50"},
                         {id: "#4902", table: "Car-861", stat: "New", col: "text-blue-500 bg-blue-50"},
                         {id: "#4899", table: "T-12", stat: "Served", col: "text-green-500 bg-green-50"}
                       ].map((item, i) => (
                         <div key={i} className="h-12 w-full bg-zinc-50 border border-zinc-100 rounded-lg mb-2 flex items-center px-4 justify-between">
                           <div className="font-mono text-sm font-bold text-zinc-800">{item.id}</div>
                           <div className="text-xs font-bold text-zinc-600">{item.table}</div>
                           <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${item.col}`}>{item.stat}</div>
                         </div>
                       ))}
                     </div>
                  </div>
               </div>
               
               <div className="relative w-[280px] h-[580px] bg-zinc-900 rounded-[3rem] shadow-2xl border-[8px] border-zinc-900 overflow-hidden transform -translate-x-10 lg:-translate-x-20 rotate-6 hover:rotate-2 transition-transform duration-500 flex flex-col">
                 <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                   <div className="w-1/3 h-4 bg-black rounded-b-xl" />
                 </div>
                 {/* Mobile screen */}
                 <div className="flex-1 bg-zinc-50 flex flex-col">
                   <div className="h-56 bg-amber-600 w-full relative flex flex-col items-center justify-center p-6 text-center text-white">
                     <span className="bg-black/20 px-3 py-1 rounded-full text-xs font-bold mb-4">Table 04</span>
                     <h3 className="font-black text-2xl mb-1">Your Menu</h3>
                     <p className="text-sm text-amber-100">Scan. Choose. Enjoy.</p>
                   </div>
                   <div className="flex-1 p-4 -mt-6 space-y-3 z-10 overflow-hidden">
                     {/* Menu items */}
                     {[
                       {n: "Spanish Latte", p: "2.500", c: "Cold Drink"},
                       {n: "V60 Drip", p: "3.200", c: "Manual Brew"},
                       {n: "Avocado Toast", p: "4.000", c: "Breakfast"}
                     ].map((item, i) => (
                       <div key={i} className="w-full bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center p-3 gap-3">
                         <div className="w-14 h-14 bg-zinc-100 rounded-xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-black/5" />
                            <Coffee className="w-6 h-6 text-zinc-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                         </div>
                         <div className="flex-1 flex flex-col">
                           <span className="text-[10px] text-zinc-400 font-bold uppercase">{item.c}</span>
                           <span className="text-sm font-bold text-zinc-900">{item.n}</span>
                           <span className="text-xs font-black text-amber-600 font-mono mt-1">{item.p} OMR</span>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 font-bold">+</div>
                       </div>
                     ))}
                   </div>
                   
                   {/* Bottom CTA */}
                   <div className="bg-white p-4 pb-8 border-t border-zinc-100 flex justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                      <div>
                         <p className="text-[10px] text-zinc-400 font-bold">Total (2 items)</p>
                         <p className="font-black text-lg font-mono">5.700 <span className="text-xs text-zinc-400">OMR</span></p>
                      </div>
                      <div className="bg-zinc-900 text-white px-5 py-3 rounded-full text-sm font-bold shadow-lg shadow-zinc-900/20">
                         View Cart
                      </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* 2. TRUST / LOGOS */}
        {/* 2. TRUST / LOGOS */}
        <section className="w-full py-12 border-y border-zinc-100 bg-white">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-zinc-200 pb-8 md:pb-0 md:pr-16">
              <p className="font-bold text-zinc-900 text-lg">{t.trusted}</p>
              <div className="flex items-center gap-2 mt-2">
                {[1,2,3,4,5].map((s: number) => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
            </div>
            <div className="flex items-center gap-3 text-zinc-500 font-medium">
               <Smartphone className="w-6 h-6 text-zinc-400" />
               {t.noAppNeeded}
            </div>
            <div className="hidden lg:flex items-center gap-3 text-zinc-500 font-medium border-l border-zinc-200 pl-16">
               <TrendingUp className="w-6 h-6 text-zinc-400" />
               <span dir="ltr">+120 orders processed daily</span>
            </div>
          </div>
        </section>

        {/* 2.5 PAIN POINTS */}
        <section className="w-full py-24 bg-white border-b border-zinc-100">
          <div className="container px-6 lg:px-12 mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-6 leading-tight">{t.pain.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
               {t.pain.list.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-red-50/50 p-5 rounded-2xl border border-red-100 shadow-sm">
                     <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                     <span className="font-bold text-red-900 text-lg">{item}</span>
                  </div>
               ))}
            </div>
            <div className="text-center">
               <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 font-black px-8 py-4 rounded-full text-lg shadow-sm border border-green-200 animate-fade-in shadow-green-500/10 hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                  {t.pain.transition}
               </div>
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
            
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 relative">
               <div className="hidden lg:block absolute top-[2.5rem] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-amber-200 to-transparent z-0" />
               
               {t.works.steps.map((s: any, i: number) => {
                 const icons = [QrCode, Smartphone, CreditCard, LayoutDashboard, Utensils];
                 const Icon = icons[i];
                 return (
                  <div key={i} className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-zinc-200/50 border border-zinc-100 mb-6">
                      <Icon className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 mb-2">{s.title}</h3>
                    <p className="text-sm text-zinc-600 font-medium max-w-[200px]">{s.desc}</p>
                  </div>
                 );
               })}
             </div>
          </div>
        </section>

        {/* 4. FEATURES */}
        <section id="features" className="w-full py-24 bg-white border-y border-zinc-100">
          <div className="container px-6 lg:px-12 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-black text-zinc-900 mb-4">{t.features.title}</h2>
              <p className="text-lg text-zinc-500 font-medium">{t.features.desc}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {t.features.list.map((f: any, i: number) => {
                 return (
                  <div key={i} className="flex flex-col p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                    <h3 className="text-xl font-black text-zinc-900 mb-3">{f.title}</h3>
                    <p className="text-zinc-600 font-medium leading-relaxed">{f.desc}</p>
                  </div>
                 );
               })}
            </div>
          </div>
        </section>

        {/* 4. UNIQUE SELLING POINT (CAR ORDERING) */}
        <section className="w-full py-24 bg-zinc-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15),transparent_60%)]" />
          <div className="container px-6 lg:px-12 mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <h2 className="text-4xl lg:text-5xl font-black">{t.usecases.title}</h2>
                <div className="inline-block bg-amber-500 text-amber-950 font-black px-4 py-2 rounded-lg text-sm mb-4">
                  {t.usecases.subtitle}
                </div>
                <div className="space-y-6 pt-4 text-left">
                  {t.usecases.list.map((uc: any, i: number) => (
                     <div key={i} className="flex gap-4 items-center">
                       <div className="w-8 h-8 rounded-full bg-zinc-800 text-amber-500 font-black flex items-center justify-center shrink-0 border border-zinc-700">
                         {i + 1}
                       </div>
                       <p className="text-xl font-bold text-zinc-200">{uc}</p>
                     </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full flex justify-center lg:justify-end">
                  <div className="w-full max-w-md bg-zinc-800 rounded-3xl p-8 border border-zinc-700 shadow-2xl relative">
                     <div className="absolute top-4 right-4 animate-pulse">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                     </div>
                     <Car className="w-20 h-20 text-amber-500 mb-6 mx-auto" />
                     <h3 className="text-2xl font-black text-center mb-6">Plate: <span className="text-amber-500">ABC 1234</span></h3>
                     <div className="space-y-3">
                        <div className="h-12 bg-zinc-700/50 rounded-xl flex items-center px-4 justify-between">
                           <span className="font-bold text-zinc-300">Order #4992</span>
                           <span className="text-amber-400 font-bold">12.500 OMR</span>
                        </div>
                        <div className="h-12 bg-zinc-700/50 rounded-xl flex items-center px-4 justify-between">
                           <span className="font-bold text-zinc-300">Status</span>
                           <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">Ready inside</span>
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. ROI SECTION */}
        <section className="w-full py-24 bg-zinc-900 text-white border-y border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
          <div className="container px-6 lg:px-12 mx-auto relative z-10 text-center">
             <div className="inline-block bg-emerald-500/20 text-emerald-400 font-black px-4 py-1.5 rounded-full text-sm mb-6 border border-emerald-500/30">
               {t.roi.title}
             </div>
             <h2 className="text-4xl lg:text-5xl font-black mb-16">{t.roi.subtitle}</h2>
             
             <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
               {t.roi.list.map((item: any, i: number) => (
                  <div key={i} className="bg-zinc-800/50 p-8 rounded-3xl border border-zinc-700 backdrop-blur-sm flex flex-col items-center justify-center text-center shadow-2xl hover:-translate-y-2 transition-transform">
                     <span className="text-5xl md:text-6xl font-black text-emerald-400 mb-4">{item.stat}</span>
                     <span className="text-xl font-bold text-zinc-300">{item.text}</span>
                  </div>
               ))}
             </div>
          </div>
        </section>

        {/* 6. DASHBOARD PREVIEW */}
        <section className="w-full py-24 bg-zinc-50">
          <div className="container px-6 lg:px-12 mx-auto text-center">
            <h2 className="text-4xl font-black text-zinc-900 mb-4">{t.dashboard.title}</h2>
            <p className="text-lg text-zinc-500 font-medium max-w-2xl mx-auto mb-16">{t.dashboard.desc}</p>
            
            <div className={`w-full max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl shadow-zinc-200 border border-zinc-200 overflow-hidden ${lang === 'ar' ? 'text-right' : 'text-left'} relative`}>
               {/* Browser Window Header */}
               <div className="h-12 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500" />
                 <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
                 <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500" />
                 <div className="ml-4 h-6 w-64 bg-white rounded-md border border-zinc-200 flex items-center px-2 shadow-inner">
                   <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2"><LayoutDashboard className="w-3 h-3" /> admin.cafeqr.com</div>
                 </div>
               </div>

               <div className="flex h-[400px] md:h-[600px] bg-zinc-50/50">
                 {/* Sidebar mock */}
                 <div className="w-16 md:w-64 bg-white border-r border-zinc-100 p-4 space-y-4 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
                   <div className="h-8 w-8 md:w-full rounded-lg mb-8 flex items-center gap-2 px-2">
                      <Coffee className="min-w-6 min-h-6 text-amber-600" />
                      <span className="font-black text-lg hidden md:block">CafeHQ</span>
                   </div>
                   {[
                      {i: LayoutDashboard, c: "bg-amber-50 text-amber-600"},
                      {i: Utensils, c: "text-zinc-400 hover:bg-zinc-50"},
                      {i: QrCode, c: "text-zinc-400 hover:bg-zinc-50"},
                      {i: TrendingUp, c: "text-zinc-400 hover:bg-zinc-50"},
                      {i: Heart, c: "text-zinc-400 hover:bg-zinc-50"}
                   ].map((item, i) => (
                      <div key={i} className={`h-10 w-10 md:w-full rounded-lg flex items-center gap-3 px-2 ${item.c} cursor-pointer transition-colors`}>
                        <item.i className="w-5 h-5 shrink-0" />
                        <span className="hidden md:block font-bold text-sm">Menu Item {i+1}</span>
                      </div>
                   ))}
                 </div>
                 {/* Content mock */}
                 <div className="flex-1 p-6 md:p-8 space-y-6 overflow-hidden flex flex-col items-center sm:items-start">
                   <div className="flex justify-between items-center w-full">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-zinc-200 rounded-full overflow-hidden border-2 border-white shadow-sm" />
                        <div className="hidden sm:block">
                           <h4 className="font-black text-lg text-zinc-800 leading-tight">Welcome back</h4>
                           <p className="text-xs text-zinc-400 font-bold">Today&apos;s Overview</p>
                        </div>
                     </div>
                     <div className="h-10 px-4 bg-zinc-900 text-white rounded-lg font-bold flex items-center gap-2 shadow-md">
                        <MapPin className="w-4 h-4" /> Main Branch
                     </div>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                     {[
                        {l: "Total Sales", v: "1,240 OMR", c: "text-green-600", hint: "Revenue 💰"},
                        {l: "Live Orders", v: "8", c: "text-amber-600", hint: "Orders 🔥"},
                        {l: "Active Tables", v: "14", c: "text-blue-600"},
                        {l: "Avg Prep Time", v: "4.5 min", c: "text-zinc-900"}
                     ].map((item, i) => (
                        <div key={i} className={`relative h-24 bg-white border border-zinc-100 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-center gap-1 ${item.hint ? 'ring-2 ring-amber-400 ring-offset-2 scale-105 z-10 transition-transform' : ''}`}>
                           {item.hint && (
                              <div className="absolute -top-3 -right-2 bg-zinc-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg xl:-right-6">
                                 {item.hint}
                                 <div className="absolute -bottom-1 right-3 w-2 h-2 bg-zinc-900 rotate-45" />
                              </div>
                           )}
                           <span className="text-[10px] uppercase font-bold text-zinc-400">{item.l}</span>
                           <span className={`text-xl md:text-2xl font-black font-mono tracking-tight ${item.c}`}>{item.v}</span>
                        </div>
                     ))}
                   </div>
                   <div className="flex-1 w-full bg-white border border-zinc-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
                      <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-4 relative">
                         <div className="flex items-center gap-2">
                           <h4 className="font-bold text-zinc-800">Kitchen Display Queue</h4>
                           <div className="relative ml-2">
                             <div className="absolute -top-6 -left-2 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap animate-bounce">
                               Live Status 🚦
                               <div className="absolute -bottom-1 left-4 w-2 h-2 bg-green-500 rotate-45" />
                             </div>
                           </div>
                         </div>
                         <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Live</span>
                      </div>
                      <div className="flex gap-4 overflow-hidden h-full">
                         {[1,2,3].map(i => (
                            <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-xl w-64 h-full p-4 flex flex-col gap-3 shrink-0">
                               <div className="flex justify-between items-center">
                                  <span className="bg-zinc-900 text-white px-2 py-0.5 rounded text-xs font-black">#4{900+i}</span>
                                  <span className="text-xs font-bold text-amber-600">3m ago</span>
                               </div>
                               <div className="font-bold text-sm border-b border-zinc-200 pb-2">Table: <span className="font-black text-amber-600">{12-i}</span></div>
                               <ul className="text-sm font-medium text-zinc-700 space-y-2 flex-1">
                                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" /> 2x Spanish Latte</li>
                                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" /> 1x Avocado Toast</li>
                               </ul>
                               <div className="border border-zinc-300 rounded-lg h-10 flex items-center justify-center font-bold text-zinc-600 text-sm mt-auto bg-white hover:bg-green-500 hover:text-white transition-colors cursor-pointer hover:border-green-500">
                                  Mark Ready
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                 </div>
               </div>
               
               {/* Floating Overlay Element */}
               <div className={`absolute bottom-8 ${lang === 'ar' ? 'left-8' : 'right-8'} bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl animate-bounce hidden md:flex items-center gap-4 border border-zinc-700`}>
                 <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
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

        {/* PRE-PRICING HOOK (Value/Loss Frame) */}
        <section className="w-full py-16 bg-zinc-50 border-t border-zinc-100 text-center">
           <div className="container px-6 lg:px-12 mx-auto max-w-4xl">
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-6 leading-tight">{t.pricing.preTitle}</h2>
              <p className="text-lg md:text-xl font-bold text-amber-700 bg-amber-50 inline-block px-6 py-3 rounded-2xl border border-amber-200">{t.pricing.preDesc}</p>
           </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="w-full py-24 bg-white relative">
          <div className="absolute top-0 inset-x-0 h-96 bg-zinc-50 rounded-b-[4rem] z-0" />
          <div className="container px-6 lg:px-12 mx-auto relative z-10">
             <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4">{t.pricing.title}</h2>
              <p className="text-lg text-zinc-500 font-bold">{t.pricing.desc}</p>
            </div>
            
            {/* CARDS */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
              {t.pricing.cards.map((c: any, i: number) => (
                <Card key={i} className={`rounded-[2rem] flex flex-col transition-all duration-300 shadow-none hover:shadow-xl ${
                    i === 2 ? 'border-2 border-amber-500 bg-white shadow-2xl shadow-amber-500/10 relative lg:-translate-y-4 lg:scale-105 z-10' : 
                    i === 3 ? 'border-zinc-200 bg-zinc-900 text-white hover:border-amber-500' :
                    'border-zinc-200 bg-white hover:border-amber-500 hover:-translate-y-2'
                }`}>
                    {c.tag && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white font-black text-sm px-5 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20 w-max whitespace-nowrap animate-bounce">
                        {c.tag}
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className={`text-2xl font-black ${i === 2 ? 'text-amber-600' : ''}`}>{c.name}</CardTitle>
                      <CardDescription className={`font-medium mt-2 min-h-10 ${i === 2 ? 'text-zinc-600 font-bold' : i === 3 ? 'text-zinc-400' : 'text-zinc-500'}`}>{c.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mt-2 mb-2 flex items-baseline gap-1">
                        <span className={`text-4xl lg:text-5xl font-black ${i === 2 ? 'text-zinc-900' : i === 3 ? 'text-white' : 'text-zinc-900'}`}>{c.price}</span>
                        {c.price !== "Custom" && c.price !== "مخصص" && <span className={`text-sm font-bold ${i === 2 ? 'text-zinc-500' : i === 3 ? 'text-zinc-500' : 'text-zinc-400'}`}>/ mo</span>}
                      </div>
                      <div className={`text-xs lg:text-sm font-bold mb-8 inline-block px-3 py-1.5 rounded-lg ${i===2?'bg-amber-100 text-amber-800':i===3?'bg-zinc-800 text-zinc-300':'bg-zinc-100 text-zinc-600'}`}>{c.priceSub}</div>
                      <ul className="space-y-4">
                        {c.features.map((feat: any, fi: number) => (
                           <li key={fi} className={`flex items-start gap-3 font-bold text-sm leading-tight ${i === 2 ? 'text-zinc-800' : i === 3 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                             <CheckCircle2 className={`w-5 h-5 shrink-0 -mt-0.5 ${i === 2 ? 'text-amber-500' : i===3 ? 'text-white' : 'text-amber-500'}`} /> {feat}
                           </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex-col gap-3">
                      <Button className={`w-full rounded-2xl h-14 font-black transition-transform active:scale-95 ${
                          i === 2 ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 text-lg' : 
                          i === 3 ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-none'
                      }`} variant={i !== 2 ? 'outline' : 'default'} onClick={() => { setSelectedPlan(c); setIsRegisterOpen(true); setIsSuccess(false); }}>
                         {c.btn}
                      </Button>
                      <div className="flex items-center gap-3 justify-center w-full mt-1 opacity-80">
                         <span className={`text-[11px] font-bold flex items-center gap-1 ${i === 3 ? 'text-zinc-400' : 'text-zinc-500'}`}>
                           <CreditCard className="w-3.5 h-3.5"/> {t.pricing.microcopy1}
                         </span>
                         <span className={`text-[11px] font-bold flex items-center gap-1 ${i === 3 ? 'text-zinc-400' : 'text-zinc-500'}`}>
                           <Zap className="w-3.5 h-3.5"/> {t.pricing.microcopy2}
                         </span>
                      </div>
                    </CardFooter>
                </Card>
              ))}
            </div>

            {/* LAUNCH OFFER */}
            <div className="max-w-4xl mx-auto bg-amber-50 border-2 border-amber-300 rounded-[2rem] p-8 md:p-12 text-center mb-24 relative overflow-hidden shadow-2xl shadow-amber-500/10">
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
               <div className="relative z-10">
                 <div className="inline-block bg-amber-500 text-white font-black px-5 py-2 rounded-full text-sm mb-6 animate-pulse shadow-md">
                   {t.pricing.offerTitle}
                 </div>
                 <h3 className="text-3xl md:text-5xl font-black text-amber-900 mb-6 leading-tight">{t.pricing.offerDesc}</h3>
                 <p className="text-xl md:text-2xl font-black text-amber-700 bg-amber-100/80 inline-block px-8 py-3 rounded-2xl mb-10 border border-amber-200 shadow-inner">
                   {t.pricing.offerExample}
                 </p>
                 <br/>
                 <Button onClick={() => { setSelectedPlan(t.pricing.cards[2]); setIsRegisterOpen(true); setIsSuccess(false); }} size="lg" className="rounded-full bg-amber-600 hover:bg-amber-700 text-white h-16 px-12 md:px-16 text-xl font-black shadow-xl shadow-amber-600/30 transition-transform hover:scale-105 active:scale-95">
                   {t.pricing.offerBtn}
                 </Button>
                 <p className="mt-4 text-amber-700 font-bold text-sm flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" /> {t.pricing.spotsLeft}
                 </p>
               </div>
            </div>

            {/* FEATURE COMPARISON */}
            <div className="max-w-4xl mx-auto text-center mb-8">
               <h3 className="text-3xl font-black text-zinc-900 mb-10">{t.pricing.compareTitle}</h3>
               <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                 <div className="grid grid-cols-5 bg-zinc-50 border-b border-zinc-200 p-4 lg:p-6">
                   {t.pricing.compareHeaders.map((h: string, i: number) => (
                     <div key={i} className={`font-black text-sm md:text-base ${i===0 ? (lang==='ar'?'text-right':'text-left') : 'text-center'} ${i===3 ? 'text-amber-600' : 'text-zinc-600'}`}>{h}</div>
                   ))}
                 </div>
                 {t.pricing.compareRows.map((row: any, i: number) => (
                   <div key={i} className="grid grid-cols-5 p-4 lg:p-6 border-b border-zinc-100 hover:bg-zinc-50 transition-colors items-center">
                     <div className={`font-bold text-zinc-800 text-sm md:text-base ${lang==='ar'?'text-right':'text-left'}`}>{row.name}</div>
                     {row.values.map((v: string, vi: number) => (
                       <div key={vi} className="text-center font-bold text-lg md:text-xl">{v}</div>
                     ))}
                   </div>
                 ))}
               </div>
               <p className="text-zinc-500 font-bold mt-10 text-lg bg-zinc-50 inline-block px-6 py-3 rounded-2xl border border-zinc-200">{t.pricing.footerNote}</p>
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
              {t.reviews.list.map((tw: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] shadow-lg shadow-zinc-200/50 border border-zinc-100 flex flex-col gap-6 relative hover:-translate-y-1 transition-transform cursor-default">
                  <div className="flex gap-1 justify-start">
                    {[1,2,3,4,5].map((s: number) => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-lg text-zinc-700 font-medium italic">&quot;{tw.quote}&quot;</p>
                  <div className="mt-auto flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tw.img} alt={tw.name} className="w-14 h-14 bg-zinc-200 rounded-full object-cover border-2 border-zinc-100" />
                    <div>
                      <p className="font-bold text-zinc-900">{tw.name}</p>
                      <p className="text-xs text-zinc-500 font-bold mt-0.5">{tw.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. BONUS */}
        <section className="w-full py-16 bg-white border-t border-zinc-100">
          <div className="container px-6 lg:px-12 mx-auto">
             <div className="text-center max-w-3xl mx-auto mb-10">
               <h2 className="text-2xl font-black text-zinc-900">{t.bonus.title}</h2>
             </div>
             <div className="flex flex-wrap justify-center gap-4">
               {t.bonus.list.map((item: string, i: number) => (
                  <div key={i} className="px-6 py-3 bg-amber-50 text-amber-900 rounded-full font-bold text-sm border border-amber-200 flex items-center gap-2 shadow-sm">
                     <CheckCircle2 className="w-4 h-4 text-amber-600" />
                     {item}
                  </div>
               ))}
             </div>
          </div>
        </section>

        {/* 8.5 FAST SETUP */}
        <section className="w-full py-24 bg-zinc-50 border-t border-zinc-200">
           <div className="container px-6 lg:px-12 mx-auto text-center max-w-5xl">
              <h2 className="text-4xl font-black mb-16 text-zinc-900">{t.setup.title}</h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 relative">
                 <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-zinc-200 -translate-y-1/2 z-0" />
                 {t.setup.steps.map((step: string, i: number) => (
                    <div key={i} className="relative z-10 flex flex-col items-center flex-1">
                       <div className="w-16 h-16 rounded-full bg-white border-4 border-zinc-50 flex items-center justify-center text-amber-600 font-black text-2xl shadow-xl shadow-zinc-200 mb-4 z-10">
                          {i + 1}
                       </div>
                       <p className="font-bold text-lg text-zinc-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-100">{step}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 9. FINAL CTA */}
        <section className="w-full py-24 bg-zinc-900 text-center px-6">
           <div className="max-w-4xl mx-auto bg-gradient-to-br from-amber-600 to-amber-800 rounded-[3rem] p-12 lg:p-20 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
             <div className="relative z-10 flex flex-col items-center">
               <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight max-w-2xl">{t.finalCta.title}</h2>
               <p className="text-xl text-amber-100/90 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                 {t.finalCta.desc}
               </p>
               <Button onClick={() => { setSelectedPlan(null); setIsRegisterOpen(true); setIsSuccess(false); }} size="lg" className="rounded-full bg-white text-amber-900 hover:bg-zinc-100 h-16 w-full sm:w-auto px-12 text-xl font-black shadow-xl transition-transform hover:scale-105 active:scale-95 group">
                 <div className="flex items-center gap-2">
                    {t.finalCta.btn} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </div>
               </Button>
               <p className="text-amber-100/60 font-bold text-xs mt-6 uppercase tracking-widest">{t.hero.noCard}</p>
             </div>
           </div>
        </section>

        {/* REGISTRATION MODAL */}
        {isRegisterOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsRegisterOpen(false)}>
            <div className={`bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ${lang === 'ar' ? 'text-right' : 'text-left'}`} onClick={e => e.stopPropagation()}>
              <div className="bg-zinc-50 border-b border-zinc-100 p-6 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-zinc-900">{lang === 'ar' ? 'طلب اشتراك جديد' : 'New Subscription'}</h3>
                    {selectedPlan && <p className="text-sm font-bold text-amber-600 mt-1">{lang === 'ar' ? 'لقد اخترت:' : 'You selected:'} {selectedPlan.name} Plan</p>}
                 </div>
                 <button onClick={() => setIsRegisterOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 transition-colors">
                    <XCircle className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6">
                {isSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-black text-zinc-900 mb-2">{lang === 'ar' ? 'تم استلام طلبك!' : 'Request Received!'}</h4>
                    <p className="text-zinc-500 font-medium mb-6">{lang === 'ar' ? 'سنتواصل معك عبر واتساب قريباً جداً لإكمال إعداد مقهاك.' : 'We will contact you via WhatsApp shortly to finish setting up.'}</p>
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 rounded-xl text-lg shadow-lg shadow-green-500/30" onClick={() => {
                      window.open(`https://wa.me/96892975614?text=${encodeURIComponent(`Hello CafeQR! I want to subscribe to the ${selectedPlan?.name} plan. My cafe is ${registerForm.cafeName}.`)}`, '_blank');
                    }}>
                      {lang === 'ar' ? 'تواصل معنا مباشرة عبر واتساب' : 'Contact us directly on WhatsApp'}
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    try {
                      if (db) {
                        await addDoc(collection(db, 'leads'), {
                          cafeName: registerForm.cafeName,
                          ownerName: registerForm.ownerName,
                          phone: registerForm.phone,
                          city: registerForm.city,
                          branches: registerForm.branches || '1',
                          plan: selectedPlan?.name || 'Unknown',
                          planId: selectedPlan?.planId || 'unknown',
                          status: 'new',
                          source: 'landing_page_modal',
                          createdAt: serverTimestamp()
                        });
                      }
                    } catch (err) {
                      console.error('Error saving lead:', err);
                    } finally {
                       setIsSubmitting(false);
                       setIsSuccess(true);
                    }
                  }}>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{lang === 'ar' ? 'اسم الكافيه' : 'Cafe Name'} <span className="text-red-500">*</span></label>
                      <input required type="text" className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={registerForm.cafeName} onChange={e => setRegisterForm({...registerForm, cafeName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{lang === 'ar' ? 'اسم المالك' : 'Owner Name'} <span className="text-red-500">*</span></label>
                      <input required type="text" className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={registerForm.ownerName} onChange={e => setRegisterForm({...registerForm, ownerName: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'} <span className="text-red-500">*</span></label>
                       <input required type="tel" placeholder="WhatsApp number" className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                        <select className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none" value={registerForm.city} onChange={e => setRegisterForm({...registerForm, city: e.target.value})}>
                          <option value="Muscat">{lang === 'ar' ? 'مسقط' : 'Muscat'}</option>
                          <option value="Salalah">{lang === 'ar' ? 'صلالة' : 'Salalah'}</option>
                          <option value="Sohar">{lang === 'ar' ? 'صحار' : 'Sohar'}</option>
                          <option value="Nizwa">{lang === 'ar' ? 'نزوى' : 'Nizwa'}</option>
                          <option value="Other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
                        </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{lang === 'ar' ? 'عدد الفروع' : 'Branches'}</label>
                         <input type="number" min="1" placeholder={lang === 'ar' ? 'اختياري' : 'Optional'} className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={registerForm.branches} onChange={e => setRegisterForm({...registerForm, branches: e.target.value})} />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-black text-lg rounded-xl shadow-lg shadow-amber-600/30">
                        {isSubmitting ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'ابدأ الآن' : 'Start Now')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 px-6 lg:px-12 border-t border-zinc-200 bg-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100 cursor-pointer">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src="https://storage.googleapis.com/ard3/CafeQR/erasebg-transformed.png" alt="CafeQR Logo" className="h-[90px] md:h-[120px] w-auto object-contain drop-shadow-sm" />
          </div>
          <p className="text-sm font-medium text-zinc-500 text-center md:text-left">
            {t.footer.copy}
          </p>
          <div className="flex items-center gap-6">
            {t.footer.links.map((link: any, i: number) => (
              <Link key={i} href="#" className="text-sm font-bold text-zinc-400 hover:text-amber-600 transition-colors">
                {link}
              </Link>
            ))}
            <Link href="/super-admin" className="text-sm font-bold text-zinc-300 hover:text-zinc-600 transition-colors flex items-center gap-1 before:content-['•'] before:mr-4 before:rtl:ml-4 before:text-zinc-200">
               {t.footer.devLogin}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
