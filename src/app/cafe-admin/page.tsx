
"use client";

import { useMemo, useState, useEffect } from 'react';
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
  ArrowUpRight,
  Clock,
  Car,
  MapPin
} from "lucide-react";
import { useCollection, useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, where, collectionGroup, Timestamp } from 'firebase/firestore';
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
  const db = useFirestore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Get user profile to find cafeId
  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

  const cafeId = userProfile?.cafeId;

  // 2. Fetch today's orders
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayOrdersQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(
      collection(db, 'cafes', cafeId, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday)),
      orderBy('createdAt', 'desc')
    );
  }, [db, cafeId]);
  const { data: todayOrders, isLoading: ordersLoading } = useCollection(todayOrdersQuery);

  // 3. Fetch branches
  const branchesQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'branches'));
  }, [db, cafeId]);
  const { data: branches } = useCollection(branchesQuery);

  // 4. Fetch all tables using Collection Group (Requires cafeId field index)
  const tablesQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collectionGroup(db, 'tables'), where('cafeId', '==', cafeId));
  }, [db, cafeId]);
  const { data: allTables } = useCollection(tablesQuery);

  // 5. Aggregate metrics
  const stats = useMemo(() => {
    const revenue = todayOrders?.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0) || 0;
    const guests = todayOrders?.reduce((acc, curr) => acc + (Number(curr.guestCount) || 0), 0) || 0;
    const occupiedCount = allTables?.filter(t => t.status === 'OCCUPIED' || t.status === 'RESERVED').length || 0;
    const availableCount = allTables?.filter(t => t.status === 'AVAILABLE').length || 0;

    return [
      {
        title: 'Orders Today',
        value: todayOrders?.length || 0,
        trend: '+12.4%',
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50"
      },
      {
        title: 'Revenue Today',
        value: formatCurrency(revenue),
        trend: '+8.1%',
        icon: <DollarSign className="h-5 w-5" />,
        color: "text-green-600",
        bg: "bg-green-50"
      },
      {
        title: 'Active Tables',
        value: occupiedCount,
        trend: `${availableCount} available`,
        icon: <Utensils className="h-5 w-5" />,
        color: "text-primary",
        bg: "bg-primary/5"
      },
      {
        title: 'Total Guests',
        value: guests,
        trend: '+5.2%',
        icon: <Users className="h-5 w-5" />,
        color: "text-accent",
        bg: "bg-accent/5"
      },
    ];
  }, [todayOrders, allTables]);

  // 6. Chart data
  const chartData = useMemo(() => {
    if (!todayOrders) return [];
    const buckets: Record<string, number> = {};
    const hours = [8, 10, 12, 14, 16, 18, 20, 22];
    hours.forEach(h => buckets[`${h}:00`] = 0);

    todayOrders.forEach(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const hour = date.getHours();
      const closest = hours.reduce((prev, curr) => Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev);
      buckets[`${closest}:00`] += (Number(order.totalAmount) || 0);
    });

    return Object.entries(buckets).map(([name, revenue]) => ({ name, revenue }));
  }, [todayOrders]);

  if (isUserLoading || profileLoading || ordersLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard Home</h1>
          <p className="text-muted-foreground mt-1">Real-time pulse of your cafe operations.</p>
        </div>
        <div className="flex items-center gap-3">
           <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live Monitoring Active
           </Badge>
        </div>
      </div>

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
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>Revenue distribution throughout today</CardDescription>
               </div>
               <Badge variant="secondary" className="bg-muted text-muted-foreground">Today</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
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
                    formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                   />
                   <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-black">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Operational shortcuts</p>
            </div>
            <CardContent className="mt-6 grid gap-3">
              {[
                { label: 'Add Product', icon: <Plus className="h-4 w-4" />, href: "/cafe-admin/products" },
                { label: 'View Orders', icon: <ShoppingBag className="h-4 w-4" />, href: "/cafe-admin/orders" },
                { label: 'Settings', icon: <Settings className="h-4 w-4" />, href: "/cafe-admin/settings" },
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
                  <p className="text-sm font-bold uppercase tracking-wider opacity-80">Today’s Peak Hour</p>
                  <p className="mt-2 text-2xl font-black">7:00 PM - 8:00 PM</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                <Clock className="h-3 w-3" />
                <span>Optimized staffing recommended</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b bg-muted/5">
            <div>
              <h3 className="text-lg font-black">Recent Orders</h3>
              <p className="text-sm text-muted-foreground">Live order feed across active branches</p>
            </div>
            <Button size="sm" className="rounded-xl font-bold bg-primary" onClick={() => window.location.href = "/cafe-admin/orders"}>
              View All
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="px-6 py-3 font-bold">Order #</th>
                    <th className="px-6 py-3 font-bold">Type</th>
                    <th className="px-6 py-3 font-bold">Location</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(todayOrders || []).slice(0, 6).map((order: any) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-primary">#{order.orderNumber || order.id.substring(0, 6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {order.orderType === 'CAR_SERVICE' ? <Car className="h-3 w-3" /> : <Utensils className="h-3 w-3" />}
                          <span className="capitalize">{order.orderType?.replace('_', ' ').toLowerCase()}</span>
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
                      <td className="px-6 py-4 text-sm font-black text-right">{formatCurrency(order.totalAmount || 0)}</td>
                    </tr>
                  ))}
                  {(!todayOrders || todayOrders.length === 0) && !ordersLoading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">No orders recorded today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-card h-full">
          <CardHeader>
            <CardTitle>Branch Activity</CardTitle>
            <CardDescription>Live performance per location</CardDescription>
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
                  <p className="text-sm font-black">{todayOrders?.filter(o => o.branchId === branch.id).length || 0} Orders</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Online</p>
                </div>
              </div>
            ))}
            {(!branches || branches.length === 0) && (
              <p className="text-center text-xs text-muted-foreground py-8">No branches registered.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
