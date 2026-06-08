
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Users, 
  Utensils, 
  Plus, 
  DollarSign,
  Settings,
  ShoppingBag,
  Activity,
  Clock,
  Car,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { useUser } from '@/firebase';
import { useCallback } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('en-OM', {
    style: 'currency',
    currency: 'OMR',
    minimumFractionDigits: 3,
  }).format(Number(value || 0));
}

function getStatusClasses(status: string) {
  switch (status?.toUpperCase()) {
    case 'NEW':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'PREPARING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'READY':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-3xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-96 rounded-3xl border border-border bg-card xl:col-span-2" />
        <div className="h-96 rounded-3xl border border-border bg-card" />
      </div>
    </div>
  );
}

export default function CafeAdminDashboard() {
  const { user, isUserLoading } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // JWT migration: role + cafeId come from useUser() directly; no Firestore profile lookup.
  const userProfile = user as any;
  const profileLoading = isUserLoading;
  const cafeId = userProfile?.cafeId;

  // Redirect Cashier to Orders page, Kitchen to KDS
  useEffect(() => {
    const role = (userProfile?.roles?.[0] || userProfile?.role || '').toUpperCase();
    if (!profileLoading && role === 'CASHIER') {
      router.replace('/cafe-admin/orders');
    }
    if (!profileLoading && role === 'KITCHEN') {
      router.replace('/cafe-admin/kds');
    }
  }, [userProfile, profileLoading, router]);

  // Language flag — defaulting to English; no Firestore config lookup needed for dashboard.
  const isArabic = false;
  const t = (en: string, ar: string) => isArabic ? ar : en;

  // Postgres-backed dashboard data — polling refresh every 30s.
  // Variable names preserved (todayOrders, branches, allTables, allProducts,
  // ordersLoading) so the existing useMemo / render code below works unchanged.
  const [todayOrders, setTodayOrders] = useState<any[] | null>(null);
  const [branches, setBranches] = useState<any[] | null>(null);
  const [allTables, setAllTables] = useState<any[] | null>(null);
  const [allProducts, setAllProducts] = useState<any[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!cafeId) return;
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = jwt ? { Authorization: `Bearer ${jwt}` } : {};
    try {
      const [oRes, bRes, tRes, mRes] = await Promise.all([
        fetch(`/api/cafes/${cafeId}/orders?limit=200`, { headers, cache: "no-store" }),
        fetch(`/api/cafes/${cafeId}/branches`, { headers, cache: "no-store" }),
        fetch(`/api/cafes/${cafeId}/tables`, { headers, cache: "no-store" }),
        fetch(`/api/public/menu/${cafeId}`, { cache: "no-store" }),
      ]);
      const j = async (r: Response) => (r.ok ? r.json().catch(() => null) : null);
      const [oJ, bJ, tJ, mJ] = await Promise.all([j(oRes), j(bRes), j(tRes), j(mRes)]);
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const allO = Array.isArray(oJ?.data) ? oJ.data : Array.isArray(oJ) ? oJ : [];
      const todays = allO.filter((o: any) => {
        const d = new Date(o.createdAt || o.created_at || 0);
        return !isNaN(d.getTime()) && d >= startOfDay;
      });
      setTodayOrders(todays);
      setBranches(Array.isArray(bJ?.data) ? bJ.data : Array.isArray(bJ) ? bJ : []);
      setAllTables(Array.isArray(tJ?.data) ? tJ.data : Array.isArray(tJ) ? tJ : []);
      const products = Array.isArray(mJ?.data?.items)
        ? mJ.data.items
        : Array.isArray(mJ?.items)
        ? mJ.items
        : Array.isArray(mJ?.data)
        ? mJ.data
        : [];
      setAllProducts(products);
    } catch (e) {
      console.error("cafe-admin dashboard fetch failed", e);
      setTodayOrders([]); setBranches([]); setAllTables([]); setAllProducts([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [cafeId]);

  useEffect(() => {
    if (!cafeId) return;
    fetchDashboard();
    const handle = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(handle);
  }, [cafeId, fetchDashboard]);

  const hasAnyOrders = Array.isArray(todayOrders) && todayOrders.length > 0;
  
  const setupSteps = useMemo(() => {
    const hasProfile = !!cafeId;
    const hasBranches = (branches?.length || 0) > 0;
    const hasTables = (allTables?.length || 0) > 0;
    const hasProducts = (allProducts?.length || 0) > 0;
    return [
      { id: 'profile', label: t('Cafe profile completed', 'اكتمل ملف المقهى'), completed: hasProfile, href: '/cafe-admin/settings' },
      { id: 'branches', label: t('Branches added', 'الفروع مضافة'), completed: hasBranches, href: '/cafe-admin/branches' },
      { id: 'tables', label: t('Tables created', 'الطاولات مضافة'), completed: hasTables, href: '/cafe-admin/qr-builder' },
      { id: 'qr', label: t('QR codes generated', 'تم إنشاء أكواد الـ QR'), completed: hasTables, href: '/cafe-admin/qr-builder' },
      { id: 'products', label: t('Menu items added', 'تمت إضافة القائمة'), completed: hasProducts, href: '/cafe-admin/products' },
      { id: 'settings', label: t('Payment/settings configured', 'اكتملت الإعدادات'), completed: true, href: '/cafe-admin/settings' }
    ];
  }, [cafeId, branches, allTables, allProducts, isArabic]);

  const completedSteps = setupSteps.filter(s => s.completed).length;
  const totalSteps = setupSteps.length;

  const stats = useMemo(() => {
    const revenue = todayOrders?.reduce((acc, curr) => acc + (Number(curr.total || curr.totalAmount) || 0), 0) || 0;
    const itemsCount = todayOrders?.reduce((acc, curr) => {
        const orderItemsCount = curr.items?.reduce((iAcc: number, item: any) => iAcc + (item.qty || 1), 0) || Number(curr.guestCount) || 1;
        return acc + orderItemsCount;
    }, 0) || 0;
    const occupiedCount = allTables?.filter(t => t.status === 'OCCUPIED' || t.status === 'RESERVED').length || 0;
    const availableCount = allTables?.filter(t => t.status === 'AVAILABLE').length || 0;

    return [
      {
        title: t('Orders Today', 'طلبات اليوم'),
        value: todayOrders?.length || 0,
        trend: '',
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50"
      },
      {
        title: t('Revenue Today', 'أرباح اليوم'),
        value: formatCurrency(revenue),
        trend: '',
        icon: <DollarSign className="h-5 w-5" />,
        color: "text-green-600",
        bg: "bg-green-50"
      },
      {
        title: t('Active Tables', 'الطاولات النشطة'),
        value: occupiedCount,
        trend: t(`${availableCount} available`, `متاح ${availableCount}`),
        icon: <Utensils className="h-5 w-5" />,
        color: "text-primary",
        bg: "bg-primary/5"
      },
      {
        title: t('Items Sold', 'المنتجات المباعة'),
        value: itemsCount,
        trend: '',
        icon: <Users className="h-5 w-5" />,
        color: "text-accent",
        bg: "bg-accent/5"
      },
    ];
  }, [todayOrders, allTables]);

  const chartData = useMemo(() => {
    if (!todayOrders) return [];
    const buckets: Record<string, number> = {};
    const hours = [8, 10, 12, 14, 16, 18, 20, 22];
    hours.forEach(h => buckets[`${h}:00`] = 0);

    todayOrders.forEach(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const hour = date.getHours();
      const closest = hours.reduce((prev, curr) => Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev);
      buckets[`${closest}:00`] += (Number(order.total || order.totalAmount) || 0);
    });

    return Object.entries(buckets).map(([name, revenue]) => ({ name, revenue }));
  }, [todayOrders]);

  const peakHour = useMemo(() => {
    if (!todayOrders || todayOrders.length === 0) return t('Traffic insights will appear after customer activity begins.', 'التحليلات ستظهر بعد بدء الطلبات.');
    const buckets: Record<number, number> = {};
    todayOrders.forEach(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const hour = date.getHours();
      buckets[hour] = (buckets[hour] || 0) + 1;
    });
    
    let maxHour = -1;
    let maxOrders = -1;
    Object.entries(buckets).forEach(([hourStr, count]) => {
       const h = parseInt(hourStr);
       if (count > maxOrders) {
          maxOrders = count;
          maxHour = h;
       }
    });
    if (maxHour === -1) return t('Traffic insights will appear after customer activity begins.', 'تحليلات الزوار ستظهر بعد بدء النشاط.');
    const formatH = maxHour % 12 || 12;
    const formatNextH = (maxHour + 1) % 12 || 12;
    const ampm = maxHour >= 12 ? 'PM' : 'AM';
    const nextAmpm = (maxHour + 1) >= 12 && (maxHour + 1) < 24 ? 'PM' : 'AM';
    return `${formatH}:00 ${ampm} - ${formatNextH}:00 ${nextAmpm}`;
  }, [todayOrders]);

  if (isUserLoading || profileLoading || ordersLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">
             {hasAnyOrders ? t("Dashboard Home", "الرئيسية") : t("Complete your setup to start receiving live orders", "أكمل إعداد المقهى لبدء الطلبات")}
          </h1>
          <p className="text-muted-foreground mt-1">
             {hasAnyOrders ? t("Real-time pulse of your cafe operations.", "نبض عمليات المقهى الحي.") : t("أكمل إعداد الكافيه لبدء استقبال الطلبات المباشرة", "أكمل إعداد الكافيه لبدء استقبال الطلبات المباشرة")}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Badge variant="outline" className={`px-4 py-1.5 rounded-full border-primary/20 ${hasAnyOrders ? 'bg-primary/5 text-primary' : 'bg-amber-50 text-amber-600 border-amber-200'} flex items-center gap-2`}>
              {hasAnyOrders ? <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> : <Clock className="h-4 w-4" />}
              {hasAnyOrders ? t('Live Monitoring Active', 'المراقبة الحية مفعلة') : t('Waiting for first order', 'في انتظار الطلب الأول')}
           </Badge>
        </div>
      </div>

      {!hasAnyOrders && (
        <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <div className="p-6 bg-primary/5 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div>
                <h3 className="text-lg font-black text-primary">{t("Setup Progress", "نسبة الإعداد")}: {completedSteps}/{totalSteps} {t("completed", "مكتمل")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("Your cafe is almost ready to go live! Complete the checklist.", "المقهى شبه جاهز! أكمل القائمة للانطلاق.")}</p>
             </div>
             <div className="w-full md:w-48 bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${(completedSteps / totalSteps) * 100}%` }}></div>
             </div>
          </div>
          <CardContent className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {setupSteps.map(step => (
                <div key={step.id} className={`flex items-center justify-between p-4 rounded-xl border ${step.completed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-muted/10'} transition-all`}>
                   <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${step.completed ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                         <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className={`text-sm font-bold ${step.completed ? 'text-emerald-900' : 'text-foreground'}`}>{step.label}</span>
                   </div>
                   {!step.completed && (
                      <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/10" onClick={() => window.location.href = step.href}>
                         Go
                      </Button>
                   )}
                </div>
             ))}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-3xl border-none shadow-sm bg-card hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight">{stat.value}</h3>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-emerald-600">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>{t("Sales Overview", "نظرة على المبيعات")}</CardTitle>
                  <CardDescription>{t("Revenue distribution throughout today", "توزيع الأرباح على مدار اليوم")}</CardDescription>
               </div>
               <Badge variant="secondary" className="bg-muted text-muted-foreground">{t("Today", "اليوم")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
             {hasAnyOrders ? (
             <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(v) => `${v.toFixed(1)}`} />
                     <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     formatter={(v: any) => [formatCurrency(v), t('Revenue', 'الأرباح')]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                 </AreaChart>
             </ResponsiveContainer>
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-60">
                 <Activity className="h-10 w-10" />
                 <p className="text-sm font-medium">{t("Sales data will appear after your first order.", "ستظهر المبيعات بعد الطلب الأول.")}</p>
               </div>
             )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-black">{t("Quick Actions", "إجراءات سريعة")}</h3>
              <p className="text-sm text-muted-foreground">{t("Operational shortcuts", "اختصارات تشغيلية")}</p>
            </div>
            <CardContent className="mt-6 grid gap-3">
              {[
                { label: t('Add Product', 'إضافة منتج'), icon: <Plus className="h-4 w-4" />, href: "/cafe-admin/products" },
                { label: t('View Orders', 'عرض الطلبات'), icon: <ShoppingBag className="h-4 w-4" />, href: "/cafe-admin/orders" },
                { label: t('Settings', 'الإعدادات'), icon: <Settings className="h-4 w-4" />, href: "/cafe-admin/settings" },
              ].map((action) => (
                <Button 
                  key={action.label} 
                  variant="outline" 
                  className="h-14 justify-between rounded-2xl border-muted bg-muted/20 hover:bg-muted/40 font-bold px-6"
                  onClick={() => window.location.href = action.href}
                >
                  <span>{action.label}</span>
                  <span className="text-muted-foreground">{action.icon}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-emerald-50 text-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider opacity-80">{t("Today's Peak Hour", "ساعة الذروة اليوم")}</p>
                  <p className={`mt-2 ${hasAnyOrders ? 'text-2xl' : 'text-sm'} font-black`}>{peakHour}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                <Clock className="h-3 w-3" />
                <span>{t("Optimized staffing recommended", "يُنصح بتنظيم الموظفين")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b bg-muted/5">
            <div>
              <h3 className="text-lg font-black">{t("Recent Orders", "الطلبات الحديثة")}</h3>
              <p className="text-sm text-muted-foreground">{t("Live order feed across active branches", "سجل الطلبات المباشرة في الفروع")}</p>
            </div>
            <Button size="sm" className="rounded-xl font-bold bg-primary" onClick={() => window.location.href = "/cafe-admin/orders"}>
              {t("View All", "عرض الكل")}
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left" dir={isArabic ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="px-6 py-3 font-bold">{t("Order #", "طلب #")}</th>
                    <th className="px-6 py-3 font-bold">{t("Type", "النوع")}</th>
                    <th className="px-6 py-3 font-bold">{t("Location", "المكان")}</th>
                    <th className="px-6 py-3 font-bold">{t("Status", "الحالة")}</th>
                    <th className={`px-6 py-3 font-bold ${isArabic ? 'text-left' : 'text-right'}`}>{t("Total", "الإجمالي")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(todayOrders || []).slice(0, 6).map((order: any) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-primary">#{order.orderNo || order.orderNumber || order.id.substring(0, 6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {order.serviceType === 'CAR' ? <Car className="h-3 w-3" /> : <Utensils className="h-3 w-3" />}
                          <span className="capitalize">{order.serviceType?.replace('_', ' ').toLowerCase() || order.orderType?.replace('_', ' ').toLowerCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {order.tableName || order.branchName || 'Counter'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase ${getStatusClasses(order.status)}`}>
                          {order.status || 'NEW'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-right">{formatCurrency(order.total || order.totalAmount || 0)}</td>
                    </tr>
                  ))}
                  {(!todayOrders || todayOrders.length === 0) && !ordersLoading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                         <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                           <ShoppingBag className="h-8 w-8" />
                           <p className="font-medium">{t("No orders yet. Orders will appear here once customers start ordering.", "لا يوجد طلبات بعد. ستظهر عند بدء استقبال الطلبات.")}</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-card h-full">
          <CardHeader>
            <CardTitle>{t("Branch Activity", "نشاط الفروع")}</CardTitle>
            <CardDescription>{t("Live performance per location", "الأداء المباشر لكل موقع")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(branches || []).map((branch: any) => (
              <div key={branch.id} className="p-4 rounded-2xl border bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{branch.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{branch.status || 'Active'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{todayOrders?.filter(o => o.branchId === branch.id).length || 0} {t('Orders', 'طلبيات')}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">{t('Online', 'متصل')}</p>
                </div>
              </div>
            ))}
            {(!branches || branches.length === 0) && (
              <p className="text-center text-xs text-muted-foreground py-8">{t("No branches registered.", "لا توجد فروع مسجلة.")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
