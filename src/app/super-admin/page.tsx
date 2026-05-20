"use client";

import { useMemo, useState } from 'react';
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  CreditCard, 
  CheckCircle2, 
  ShoppingBag, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Globe,
  Database,
  Activity,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Ban,
  UploadCloud,
  PieChart as PieIcon,
  ChevronDown,
  ArrowUpRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function SuperAdminDashboard() {
  const db = useFirestore();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isAr = lang === 'ar';
  
  const t = (en: string, ar: string) => isAr ? ar : en;

  // Real-time Cafes
  const cafesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'cafes'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: cafes, isLoading: cafesLoading } = useCollection(cafesQuery);

  // Real-time Plans
  const plansQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'plans'));
  }, [db]);
  const { data: plansData } = useCollection(plansQuery);

  // Derived Stats
  const stats = useMemo(() => {
    const totalCafes = cafes?.length || 0;
    const activeSubs = cafes?.filter(c => c.isActive && c.subscription?.status !== 'canceled').length || 0;
    
    // Compute Platform MRR from live plans based on active subscriptions
    const mrr = cafes?.reduce((acc, c) => {
       if (!c.isActive || c.subscription?.status === 'canceled') return acc;
       const cPlanId = (c.subscription?.planId || c.plan || 'free').toLowerCase();
       
       if (plansData) {
         const foundPlan = plansData.find((p: any) => 
           p.id === cPlanId || 
           p.slug === cPlanId || 
           (p.name && p.name.toLowerCase() === cPlanId)
         );
         if (foundPlan) {
            return acc + Number(foundPlan.monthlyPrice || 0);
         }
       }
       return acc;
    }, 0) || 0;
    
    return [
      { title: t("Total Cafes", "إجمالي المقاهي"), value: totalCafes, icon: <Store className="h-4 w-4" />, color: "text-blue-600", trend: "0% vs last month", isUp: true },
      { title: t("Active Subs", "اشتراكات فعّالة"), value: activeSubs, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600", trend: "0% vs last month", isUp: true },
      { title: t("Platform MRR", "الإيرادات الشهرية"), value: `${mrr.toLocaleString()} OMR`, icon: <CreditCard className="h-4 w-4" />, color: "text-primary", trend: "0% vs last month", isUp: true },
      { title: t("Conversion", "معدل التحويل"), value: `${totalCafes > 0 ? ((activeSubs / totalCafes) * 100).toFixed(1) : 0}%`, icon: <Activity className="h-4 w-4" />, color: "text-orange-600", trend: "0% vs last month", isUp: true },
    ];
  }, [cafes, plansData, isAr]);

  const signupData = useMemo(() => {
    if (!cafes) return [];
    const months = isAr ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Get last 6 months
    const last6Months: Array<{ name: string, new: number, churned: number, year: number, month: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonth - i);
      last6Months.push({ name: months[d.getMonth()], new: 0, churned: 0, year: d.getFullYear(), month: d.getMonth() });
    }

    cafes.forEach(c => {
      if (!c.createdAt) return;
      const d = new Date(c.createdAt);
      const match = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (match) {
        match.new += 1;
        if (!c.isActive) match.churned += 1;
      }
    });

    return last6Months;
  }, [cafes, isAr]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
  const pieData = useMemo(() => {
     if (!cafes || cafes.length === 0) return [];
     
     const distribution: Record<string, number> = {};
     cafes.forEach(c => {
       const rawPlan = (c.subscription?.planId || c.plan || 'Free').toLowerCase();
       // Try to resolve nicely via live plans if possible
       let planName = rawPlan;
       if (plansData) {
         const fp = plansData.find((p: any) => p.id === rawPlan || p.slug === rawPlan || (p.name && p.name.toLowerCase() === rawPlan));
         if (fp && fp.name) planName = fp.name;
       }
       // capitalize nicely
       planName = planName.charAt(0).toUpperCase() + planName.slice(1);
       distribution[planName] = (distribution[planName] || 0) + 1;
     });

     return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [cafes, plansData, isAr]);

  const revenueData = useMemo(() => {
     // Replace exact hardcoded array with a flat chart for MTD. 
     // We do not have granular chronological revenue logic set up without historical snapshot documents yet.
     return [];
  }, []);

  return (
    <div className={cn("space-y-8 animate-in fade-in duration-500 pb-10", isAr && "rtl")} dir={isAr ? "rtl" : "ltr"}>
      <SectionHeader 
        title={t("Dashboard Overview", "نظرة عامة على النظام")}
        description={t("Platform performance, revenue, and system health at a glance.", "أداء المنصة، الإيرادات، وصحة النظام بلمحة سريعة.")}
        actions={
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')} className="gap-2 font-bold shadow-sm">
                <Globe className="h-4 w-4" /> {isAr ? "English" : "عربي"}
             </Button>
            <Button variant="outline" className="gap-2 bg-card cursor-default shadow-sm group">
              <RefreshCw className={cn("h-4 w-4 transition-all group-hover:rotate-180", cafesLoading && "animate-spin")} /> 
              {t("Live Focus", "تحديث مباشر")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all">
             <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                       <p className="text-3xl font-black">{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg bg-opacity-10 dark:bg-opacity-20", stat.color.replace('text-', 'bg-'))}>
                       <div className={stat.color}>{stat.icon}</div>
                    </div>
                 </div>
                 <div className="mt-4 flex items-center text-xs">
                    {stat.isUp ? (
                       <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                    ) : (
                       <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    )}
                    <span className={cn("font-medium", stat.isUp ? "text-emerald-500" : "text-red-500")}>
                       {stat.trend}
                    </span>
                 </div>
             </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Signup Analytics Area */}
        <Card className="lg:col-span-8 border-none shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>{t("Tenant Growth", "نمو العملاء")}</CardTitle>
                  <CardDescription>{t("Active vs Churned tenants over the last 6 months.", "المقارنة بين العملاء النشطين والمغادرين في آخر 6 أشهر.")}</CardDescription>
               </div>
               <div className="flex gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{t("Monthly", "شهري")}</Badge>
               </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} allowDecimals={false} />
                   <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                   <Legend verticalAlign="top" height={36} iconType="circle" />
                   <Area type="monotone" name={t("New Signups", "تسجيل جديد")} dataKey="new" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNew)" strokeWidth={3} />
                   <Area type="monotone" name={t("Churned", "مغادرين")} dataKey="churned" stroke="#ef4444" fillOpacity={1} fill="url(#colorChurn)" strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column Details */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("Revenue Overview", "تحليل الإيرادات")}</CardTitle>
              <CardDescription>{t("Monthly revenue trends", "اتجاه الإيرادات الشهري")}</CardDescription>
            </CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" name={t("Revenue ($)", "الإيرادات ($)")} dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                 </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("Subscription Distribution", "توزيع الاشتراكات")}</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center gap-6">
                  <div className="h-32 w-32 relative shrink-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                     {pieData.map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                              <span className="font-medium text-muted-foreground">{d.name}</span>
                           </div>
                           <span className="font-bold">{d.value}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-12">
          {/* Alerts System */}
          <Card className="lg:col-span-4 border-none shadow-sm bg-card">
             <CardHeader>
                <CardTitle className="text-lg text-amber-600 flex gap-2 items-center"><AlertTriangle className="h-5 w-5" /> {t("Platform Alerts", "تنبيهات النظام")}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="p-3 border rounded-xl bg-red-50/50 border-red-100 flex items-start gap-3">
                   <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0 mt-0.5"><Ban className="h-4 w-4" /></div>
                   <div>
                      <p className="text-sm font-bold text-red-800">{t("Payment Failed", "فشل الدفع")}</p>
                      <p className="text-xs text-red-600/80 mt-0.5">{t("Coffee House subscription renewal failed.", "تعذر تجديد اشتراك كوفي هاوس.")}</p>
                   </div>
                </div>
                <div className="p-3 border rounded-xl bg-amber-50/50 border-amber-100 flex items-start gap-3">
                   <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0 mt-0.5"><Activity className="h-4 w-4" /></div>
                   <div>
                      <p className="text-sm font-bold text-amber-800">{t("Cafe Inactive", "مقهى غير نشط")}</p>
                      <p className="text-xs text-amber-600/80 mt-0.5">{t("3 cafes have 0 orders in the last 7 days.", "3 مقاهي لم تتلقَ طلبات في آخر 7 أيام.")}</p>
                   </div>
                </div>
             </CardContent>
          </Card>
          
          {/* System Health Detailed */}
          <Card className="lg:col-span-8 border-none shadow-sm bg-card">
             <CardHeader>
                <CardTitle className="text-lg">{t("System Health", "صحة النظام")}</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-2xl border flex flex-col justify-center items-center text-center space-y-2">
                   <div className="relative">
                      <Database className="h-8 w-8 text-blue-500" />
                      <div className="absolute top-0 right-[-4px] h-2.5 w-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                   </div>
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("Database", "قاعدة البيانات")}</p>
                   <p className="text-lg font-black">{db ? '18ms' : 'Error'}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border flex flex-col justify-center items-center text-center space-y-2">
                   <div className="relative">
                      <Activity className="h-8 w-8 text-indigo-500" />
                      <div className="absolute top-0 right-[-4px] h-2.5 w-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                   </div>
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("API Servers", "سيرفرات API")}</p>
                   <p className="text-lg font-black">99.9%</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border flex flex-col justify-center items-center text-center space-y-2">
                   <div className="relative">
                      <UploadCloud className="h-8 w-8 text-cyan-500" />
                      <div className="absolute top-0 right-[-4px] h-2.5 w-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                   </div>
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("Storage", "التخزين")}</p>
                   <p className="text-lg font-black">12%</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border flex flex-col justify-center items-center text-center space-y-2">
                   <div className="relative">
                      <RefreshCw className="h-8 w-8 text-violet-500" />
                      <div className="absolute top-0 right-[-4px] h-2.5 w-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                   </div>
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("Queue", "المهام المنتظرة")}</p>
                   <p className="text-lg font-black">0</p>
                </div>
             </CardContent>
          </Card>
      </div>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
          <div>
            <CardTitle>{t("Recent Cafe Signups", "أحدث المقاهي المسجلة")}</CardTitle>
            <CardDescription>{t("Active directories and tenant management.", "إدارة أدلة العملاء النشطين.")}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href='/super-admin/cafes'}>{t("View Directory", "عرض كل المقاهي")}</Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTableReusable 
            isLoading={cafesLoading}
            data={(cafes || []).slice(0, 5)}
            columns={[
              { 
                key: "name", 
                label: t("Cafe Details", "تفاصيل المقهى"),
                render: (row) => (
                  <div className="flex flex-col py-1">
                    <span className="font-bold text-sm">{row.name}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{row.email || row.slug}</span>
                  </div>
                )
              },
              { 
                key: "status", 
                label: t("Status", "الحالة"),
                render: (row) => (
                  <Badge 
                    variant="outline"
                    className={cn("capitalize font-bold border-transparent", row.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}
                  >
                    {row.isActive ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                  </Badge>
                )
              },
              { 
                key: "plan", 
                label: t("Plan", "الباقة"),
                render: (row) => {
                   const plan = (row.subscription?.planId || row.plan || 'Free').toUpperCase();
                   return <Badge variant="secondary" className="font-bold text-[10px]">{plan}</Badge>;
                }
              },
              { 
                key: "createdAt", 
                label: t("Join Date", "تاريخ الانضمام"),
                render: (row) => (
                  <span className="text-muted-foreground font-medium text-xs">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                )
              },
              {
                key: "actions",
                label: "",
                className: "text-right pr-4",
                render: (row) => (
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                         <DropdownMenuItem className="gap-2 font-medium cursor-pointer">
                            <Eye className="h-4 w-4 text-muted-foreground" /> {t("View Details", "عرض التفاصيل")}
                         </DropdownMenuItem>
                         <DropdownMenuItem className="gap-2 font-medium cursor-pointer">
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" /> {t("Change Plan", "تغيير الباقة")}
                         </DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem className="gap-2 font-medium text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                            <Ban className="h-4 w-4 hover:bg-black" /> {t("Suspend Account", "إيقاف الحساب")}
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                )
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
