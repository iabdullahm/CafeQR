
"use client";

import { useEffect, useMemo, useState } from 'react';
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
  AlertCircle
} from "lucide-react";

const API_BASE_URL = '/api'; // Adjusted to use relative path for Next.js API routes

async function fetchJson(url: string, options: any = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch data');
  }

  return response.json();
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('en-OM', {
    style: 'currency',
    currency: 'OMR',
    minimumFractionDigits: 3,
  }).format(Number(value || 0));
}

function formatTrend(value: number | string | null | undefined) {
  if (value === null || value === undefined) return '0%';
  const numeric = Number(value);
  const prefix = numeric > 0 ? '+' : '';
  return `${prefix}${numeric.toFixed(1)}%`;
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'New':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Preparing':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Ready':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Completed':
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
      <div className="h-96 rounded-3xl border border-border bg-card" />
    </div>
  );
}

export default function CafeAdminDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [branchFilter, setBranchFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setError('');
        // Note: For MVP we use the stats endpoint or mock until specific cafe dashboard API is ready
        const data = await fetchJson(`${API_BASE_URL}/dashboard/stats`);
        
        // Simulating the dashboard structure expected by the UI for the prototype
        const mockDashboardData = {
          kpis: {
            ordersToday: data.data.ordersThisMonth || 128,
            ordersTrend: 12.4,
            revenueToday: data.data.monthlyRevenue || 486.000,
            revenueTrend: 8.1,
            activeTables: 18,
            availableTables: 6,
            currentCustomers: 74,
            customersTrend: 5.2
          },
          salesOverview: [
            { label: 'Mon', value: 55 },
            { label: 'Tue', value: 82 },
            { label: 'Wed', value: 68 },
            { label: 'Thu', value: 95 },
            { label: 'Fri', value: 74 },
            { label: 'Sat', value: 88 },
            { label: 'Sun', value: 64 },
          ],
          recentOrders: [
            { id: '1', orderNumber: '1042', tableName: 'Table 07', orderType: 'Dine-in', status: 'New', createdAgo: '2m ago', totalAmount: 8.500 },
            { id: '2', orderNumber: '1041', tableName: 'Slot 03', orderType: 'Car', status: 'Preparing', createdAgo: '5m ago', totalAmount: 12.000 },
            { id: '3', orderNumber: '1040', tableName: 'Table 12', orderType: 'Dine-in', status: 'Ready', createdAgo: '9m ago', totalAmount: 6.750 },
            { id: '4', orderNumber: '1039', tableName: 'Table 02', orderType: 'Dine-in', status: 'Completed', createdAgo: '14m ago', totalAmount: 15.250 },
          ],
          topProducts: [
            { id: '1', name: 'Spanish Latte', orderCount: 34 },
            { id: '2', name: 'Iced Americano', orderCount: 28 },
            { id: '3', name: 'Classic Mojito', orderCount: 21 },
            { id: '4', name: 'Cheesecake', orderCount: 18 },
          ],
          branches: [
            { id: '1', name: 'Muscat Branch', ordersCount: 74, revenue: 286.000, status: 'Active' },
            { id: '2', name: 'Azaiba Branch', ordersCount: 36, revenue: 124.000, status: 'Active' },
            { id: '3', name: 'Al Khuwair Branch', ordersCount: 18, revenue: 76.000, status: 'Busy' },
          ],
          tables: { available: 6, occupied: 18, outOfService: 2 },
          peakHour: '7:00 PM - 8:00 PM'
        };

        if (isMounted) {
          setDashboard(mockDashboardData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    const intervalId = setInterval(loadDashboard, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [branchFilter, rangeFilter]);

  const stats = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        title: 'Orders Today',
        value: dashboard.kpis.ordersToday,
        trend: formatTrend(dashboard.kpis.ordersTrend),
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50"
      },
      {
        title: 'Revenue Today',
        value: formatCurrency(dashboard.kpis.revenueToday),
        trend: formatTrend(dashboard.kpis.revenueTrend),
        icon: <DollarSign className="h-5 w-5" />,
        color: "text-green-600",
        bg: "bg-green-50"
      },
      {
        title: 'Active Tables',
        value: dashboard.kpis.activeTables,
        trend: `${dashboard.kpis.availableTables} available`,
        icon: <Utensils className="h-5 w-5" />,
        color: "text-primary",
        bg: "bg-primary/5"
      },
      {
        title: 'Current Customers',
        value: dashboard.kpis.currentCustomers,
        trend: formatTrend(dashboard.kpis.customersTrend),
        icon: <Users className="h-5 w-5" />,
        color: "text-accent",
        bg: "bg-accent/5"
      },
    ];
  }, [dashboard]);

  if (loading && !dashboard) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-destructive shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
        </div>
        <p className="text-sm">{error}</p>
        <Button variant="outline" className="mt-4 bg-background" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const chartBars = dashboard?.salesOverview ?? [];
  const recentOrders = dashboard?.recentOrders ?? [];
  const topProducts = dashboard?.topProducts ?? [];
  const branches = dashboard?.branches ?? [];
  const maxBarValue = Math.max(...chartBars.map((item: any) => item.value), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard Home</h1>
          <p className="text-muted-foreground mt-1">Monitor orders, sales, tables, and branch activity in real time.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2 bg-card p-1 rounded-xl border">
            {['today', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setRangeFilter(range)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${
                  rangeFilter === range
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            className="rounded-xl border bg-card px-4 py-2 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Branches</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
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
        <Card className="xl:col-span-2 rounded-3xl border-none shadow-sm bg-card">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-black">Sales Overview</h3>
            <p className="text-sm text-muted-foreground">Orders and revenue performance across the selected range.</p>
          </div>
          <CardContent className="mt-8">
            <div className="flex h-72 items-end justify-between gap-4 rounded-2xl bg-muted/30 p-6">
              {chartBars.map((bar: any) => (
                <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-3 h-full">
                  <div
                    className="w-full rounded-t-xl bg-primary transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: `${Math.max((bar.value / maxBarValue) * 100, 5)}%` }}
                  />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-black">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Frequently used shortcuts</p>
            </div>
            <CardContent className="mt-6 grid gap-3">
              {[
                { label: 'Add Product', icon: <Plus className="h-4 w-4" />, href: "/cafe-admin/products" },
                { label: 'Add Table', icon: <LayoutGrid className="h-4 w-4" />, href: "/cafe-admin/tables" },
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
              <p className="mt-2 text-2xl font-black">{dashboard?.peakHour || '7:00 PM - 8:00 PM'}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                <Activity className="h-3 w-3" />
                <span>Predicted high volume</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-12">
        <Card className="2xl:col-span-7 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b bg-muted/5">
            <div>
              <h3 className="text-lg font-black">Recent Orders</h3>
              <p className="text-sm text-muted-foreground">Live order feed from all active branches</p>
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
                    <th className="px-6 py-3 font-bold">Location</th>
                    <th className="px-6 py-3 font-bold">Type</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold">Time</th>
                    <th className="px-6 py-3 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-primary">#{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium">{order.tableName || order.branchName}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{order.orderType}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase ${getStatusClasses(order.status)}`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{order.createdAgo}</td>
                      <td className="px-6 py-4 text-sm font-black">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="2xl:col-span-5 grid gap-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <div className="p-6">
              <h3 className="text-lg font-black">Tables Status</h3>
              <p className="text-sm text-muted-foreground">Current floor occupancy</p>
            </div>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Available', value: dashboard?.tables?.available || 0, color: "text-emerald-600" },
                  { label: 'Occupied', value: dashboard?.tables?.occupied || 0, color: "text-orange-600" },
                  { label: 'Disabled', value: dashboard?.tables?.outOfService || 0, color: "text-muted-foreground" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-muted/30 p-4 text-center border">
                    <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                    <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <div className="p-6">
              <h3 className="text-lg font-black">Top Products</h3>
              <p className="text-sm text-muted-foreground">Most ordered items today</p>
            </div>
            <CardContent className="space-y-4">
              {topProducts.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-muted/20 px-4 py-3 border border-transparent hover:border-border transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold">{product.name}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{product.orderCount} orders</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
        <div className="p-6 border-b bg-muted/5">
          <h3 className="text-lg font-black">Branch Overview</h3>
          <p className="text-sm text-muted-foreground">Performance summary for all branches</p>
        </div>
        <CardContent className="p-6 grid gap-4 lg:grid-cols-3">
          {branches.map((branch: any) => (
            <div key={branch.id} className="rounded-2xl border bg-muted/10 p-6 group hover:bg-muted/20 transition-all">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-lg">{branch.name}</h4>
                <Badge className="bg-primary text-[10px] font-bold uppercase">{branch.status}</Badge>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Orders</p>
                  <p className="mt-1 text-2xl font-black">{branch.ordersCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</p>
                  <p className="mt-1 text-2xl font-black text-primary">{formatCurrency(branch.revenue)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </section>
    </div>
  );
}
