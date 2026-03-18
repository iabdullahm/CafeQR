"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ClipboardList, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Coffee, 
  QrCode, 
  Star, 
  Utensils, 
  Car, 
  Plus, 
  DollarSign,
  ArrowUpRight,
  Clock,
  LayoutGrid,
  Settings,
  Activity,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatCard } from "@/components/dashboard/stat-card";
import Link from "next/link";
import { DataTableReusable } from "@/components/tables/data-table-reusable";

const STATS = [
  { title: 'Orders Today', value: '128', trend: '+12.4%', icon: <ClipboardList className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50" },
  { title: 'Revenue Today', value: 'OMR 486', trend: '+8.1%', icon: <DollarSign className="h-5 w-5" />, color: "text-green-600", bg: "bg-green-50" },
  { title: 'Active Tables', value: '18', trend: '6 available', icon: <Utensils className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/5" },
  { title: 'Current Customers', value: '74', trend: '+5.2%', icon: <Users className="h-5 w-5" />, color: "text-accent", bg: "bg-accent/5" },
];

const RECENT_ORDERS = [
  { id: '#ORD-1042', table: 'Table 07', type: 'Dine-in', status: 'New', time: '2m ago', total: 'OMR 8.500' },
  { id: '#ORD-1041', table: 'Car Slot 03', type: 'Car Service', status: 'Preparing', time: '5m ago', total: 'OMR 12.000' },
  { id: '#ORD-1040', table: 'Table 12', type: 'Dine-in', status: 'Ready', time: '9m ago', total: 'OMR 6.750' },
  { id: '#ORD-1039', table: 'Table 02', type: 'Dine-in', status: 'Completed', time: '14m ago', total: 'OMR 15.250' },
];

const TOP_PRODUCTS = [
  { name: 'Spanish Latte', orders: 34 },
  { name: 'Iced Americano', orders: 28 },
  { name: 'Classic Mojito', orders: 21 },
  { name: 'Cheesecake', orders: 18 },
];

const BRANCHES = [
  { name: 'Muscat Branch', orders: 74, revenue: 'OMR 286', status: 'Active' },
  { name: 'Azaiba Branch', orders: 36, revenue: 'OMR 124', status: 'Active' },
  { name: 'Al Khuwair Branch', orders: 18, revenue: 'OMR 76', status: 'Busy' },
];

const CHART_DATA = [55, 82, 68, 95, 74, 88, 64];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CafeAdminDashboard() {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'New': return 'bg-red-50 text-red-700 border-red-200';
      case 'Preparing': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ready': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader 
        title="Dashboard Home" 
        description="Monitor orders, sales, tables, and branch activity in real time."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2 bg-card">
              <Activity className="h-4 w-4" /> Live Analytics
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" /> New Report
            </Button>
          </div>
        }
      />

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
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
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Sales Chart */}
        <Card className="lg:col-span-8 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black">Sales Overview</CardTitle>
              <CardDescription>Orders and revenue performance across the week.</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
               <Button variant="ghost" size="sm" className="h-8 text-xs font-bold px-4">Today</Button>
               <Button variant="ghost" size="sm" className="h-8 text-xs font-bold px-4 bg-background shadow-sm">Week</Button>
               <Button variant="ghost" size="sm" className="h-8 text-xs font-bold px-4">Month</Button>
            </div>
          </CardHeader>
          <CardContent>
             <div className="mt-2 flex h-72 items-end justify-between gap-4 rounded-2xl bg-muted/30 p-6">
                {CHART_DATA.map((bar, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center justify-end gap-3 h-full">
                    <div
                      className="w-full rounded-t-xl bg-primary transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${(bar / Math.max(...CHART_DATA)) * 100}%` }}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      {DAYS[index]}
                    </span>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Peak Hour */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Frequently used shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { label: 'Add Product', icon: <Plus className="h-4 w-4" />, href: "/cafe-admin/products" },
                { label: 'Add Table', icon: <LayoutGrid className="h-4 w-4" />, href: "/cafe-admin/tables" },
                { label: 'View Orders', icon: <ClipboardList className="h-4 w-4" />, href: "/cafe-admin/orders" },
                { label: 'Open Settings', icon: <Settings className="h-4 w-4" />, href: "/cafe-admin/settings" },
              ].map((action) => (
                <Button 
                  key={action.label} 
                  variant="outline" 
                  className="h-14 justify-between rounded-2xl border-muted bg-muted/20 hover:bg-muted/40 font-bold px-6"
                  asChild
                >
                  <Link href={action.href}>
                    <span>{action.label}</span>
                    <span className="text-muted-foreground">{action.icon}</span>
                  </Link>
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
                   <span>Predicted high volume</span>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Live Orders Feed */}
        <Card className="lg:col-span-7 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black">Recent Orders</CardTitle>
              <CardDescription>Live order feed from all active branches</CardDescription>
            </div>
            <Button size="sm" className="rounded-xl font-bold bg-primary" asChild>
              <Link href="/cafe-admin/orders">View All Orders</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <DataTableReusable 
              columns={[
                { key: "id", label: "Order ID", render: (row) => <span className="font-bold text-primary">{row.id}</span> },
                { key: "table", label: "Location", render: (row) => <span className="font-medium">{row.table}</span> },
                { key: "type", label: "Type", render: (row) => <span className="text-muted-foreground text-xs">{row.type}</span> },
                { 
                  key: "status", 
                  label: "Status",
                  render: (row) => (
                    <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase ${getStatusClasses(row.status)}`}>
                      {row.status}
                    </Badge>
                  )
                },
                { key: "total", label: "Total", className: "font-black" },
                { key: "time", label: "Time", className: "text-right pr-6 text-muted-foreground text-xs" },
              ]}
              data={RECENT_ORDERS}
             />
          </CardContent>
        </Card>

        {/* Tables Status & Top Products */}
        <div className="lg:col-span-5 grid gap-6">
          <Card className="rounded-3xl border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Tables Status</CardTitle>
              <CardDescription>Current floor occupancy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Available', value: 6, color: "text-emerald-600" },
                  { label: 'Occupied', value: 18, color: "text-orange-600" },
                  { label: 'Disabled', value: 2, color: "text-muted-foreground" },
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
            <CardHeader>
              <CardTitle className="text-lg">Top Products</CardTitle>
              <CardDescription>Most ordered items today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {TOP_PRODUCTS.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between rounded-2xl bg-muted/20 px-4 py-3 border border-transparent hover:border-border transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold">{product.name}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{product.orders} orders</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Branch Overview */}
        <Card className="lg:col-span-12 rounded-3xl border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Branch Overview</CardTitle>
            <CardDescription>Performance summary for all branches</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {BRANCHES.map((branch) => (
              <div key={branch.name} className="rounded-2xl border bg-muted/10 p-6 group hover:bg-muted/20 transition-all">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-lg">{branch.name}</h4>
                  <Badge className="bg-primary text-[10px] font-bold uppercase">{branch.status}</Badge>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Orders</p>
                    <p className="mt-1 text-2xl font-black">{branch.orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</p>
                    <p className="mt-1 text-2xl font-black text-primary">{branch.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}