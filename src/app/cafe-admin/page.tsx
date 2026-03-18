"use client";

import { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Users, 
  Utensils, 
  Plus, 
  DollarSign,
  LayoutGrid,
  Settings,
  ShoppingBag,
  Activity,
} from "lucide-react";
import { useCollection, useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, where } from 'firebase/firestore';

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('en-OM', {
    style: 'currency',
    currency: 'OMR',
    minimumFractionDigits: 3,
  }).format(Number(value || 0));
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'preparing':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'ready':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'completed':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
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

  // 1. Get user profile to retrieve the associated cafeId
  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

  // 2. Fetch recent orders from Firestore using the cafeId from profile
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !userProfile?.cafeId) return null;
    return query(
      collection(db, 'cafes', userProfile.cafeId, 'orders'), 
      orderBy('createdAt', 'desc'), 
      limit(5)
    );
  }, [db, userProfile?.cafeId]);

  const { data: recentOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    return [
      {
        title: 'Orders Today',
        value: recentOrders?.length || 0,
        trend: '+12.4%',
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50"
      },
      {
        title: 'Revenue Today',
        value: formatCurrency(recentOrders?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) || 0),
        trend: '+8.1%',
        icon: <DollarSign className="h-5 w-5" />,
        color: "text-green-600",
        bg: "bg-green-50"
      },
      {
        title: 'Active Tables',
        value: '18',
        trend: `6 available`,
        icon: <Utensils className="h-5 w-5" />,
        color: "text-primary",
        bg: "bg-primary/5"
      },
      {
        title: 'Current Customers',
        value: '74',
        trend: '+5.2%',
        icon: <Users className="h-5 w-5" />,
        color: "text-accent",
        bg: "bg-accent/5"
      },
    ];
  }, [recentOrders]);

  if (isUserLoading || profileLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard Home</h1>
          <p className="text-muted-foreground mt-1">Monitor orders, sales, and tables in real time.</p>
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
          <div className="p-6 flex items-center justify-between border-b bg-muted/5">
            <div>
              <h3 className="text-lg font-black">Recent Orders</h3>
              <p className="text-sm text-muted-foreground">Live order feed for your cafe</p>
            </div>
            <Button size="sm" className="rounded-xl font-bold bg-primary" onClick={() => window.location.href = "/cafe-admin/orders"}>
              View All Orders
            </Button>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="px-6 py-3 font-bold">Order ID</th>
                    <th className="px-6 py-3 font-bold">Type</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders || []).map((order: any) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-primary">#{order.id.substring(0, 6)}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground capitalize">{order.orderType || 'dine_in'}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase ${getStatusClasses(order.status)}`}>
                          {order.status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-black">{formatCurrency(order.totalAmount || 0)}</td>
                    </tr>
                  ))}
                  {!ordersLoading && recentOrders?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No recent orders found.</td>
                    </tr>
                  )}
                  {ordersLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">Loading orders...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-black">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Shortcuts</p>
            </div>
            <CardContent className="mt-6 grid gap-3">
              {[
                { label: 'Add Product', icon: <Plus className="h-4 w-4" />, href: "/cafe-admin/products" },
                { label: 'View Orders', icon: <ShoppingBag className="h-4 w-4" />, href: "/cafe-admin/orders" },
                { label: 'Open Settings', icon: <Settings className="h-4 w-4" />, href: "/cafe-admin/settings" },
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
              <p className="text-sm font-bold uppercase tracking-wider opacity-80">Today’s Peak Hour</p>
              <p className="mt-2 text-2xl font-black">7:00 PM - 8:00 PM</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                <Activity className="h-3 w-3" />
                <span>Real-time tracking active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
