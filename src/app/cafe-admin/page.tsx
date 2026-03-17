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
  Search,
  MoreVertical,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import Link from "next/link";
import { DataTableReusable } from "@/components/tables/data-table-reusable";

const SALES_DATA = [
  { time: "08:00", sales: 120, orders: 12 },
  { time: "10:00", sales: 450, orders: 35 },
  { time: "12:00", sales: 890, orders: 68 },
  { time: "14:00", sales: 520, orders: 42 },
  { time: "16:00", sales: 610, orders: 48 },
  { time: "18:00", sales: 940, orders: 75 },
  { time: "20:00", sales: 780, orders: 62 },
];

const RECENT_ORDERS = [
  { id: "105", table: "T-04", type: "dine-in", status: "preparing", total: "$24.50", time: "2m ago" },
  { id: "104", table: "Car-01", type: "car-order", status: "confirmed", total: "$12.00", time: "5m ago" },
  { id: "103", table: "T-02", type: "dine-in", status: "ready", total: "$31.20", time: "12m ago" },
  { id: "102", table: "T-09", type: "dine-in", status: "completed", total: "$15.00", time: "20m ago" },
];

const TOP_PRODUCTS = [
  { name: "House Blend Coffee", count: 124, revenue: "$558.00", trend: "+12%" },
  { name: "Caramel Macchiato", count: 98, revenue: "$539.00", trend: "+5%" },
  { name: "Avocado Toast", count: 45, revenue: "$540.00", trend: "+18%" },
  { name: "Berry Muffin", count: 32, revenue: "$112.00", trend: "-2%" },
];

const BRANCH_PERFORMANCE = [
  { name: "Main Downtown", orders: 156, revenue: "$1,840", status: "online" },
  { name: "Manhattan North", orders: 92, revenue: "$1,120", status: "online" },
  { name: "Brooklyn Heights", orders: 45, revenue: "$580", status: "offline" },
];

export default function CafeAdminDashboard() {
  const chartConfig = {
    sales: {
      label: "Sales ($)",
      color: "hsl(var(--primary))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader 
        title="Operations Command" 
        description="Real-time monitoring and branch performance analytics."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2 bg-card" asChild>
              <Link href="/cafe-admin/qr-codes"><QrCode className="h-4 w-4" /> Management QRs</Link>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
              <Activity className="h-4 w-4" /> View Live Analytics
            </Button>
          </div>
        }
      />

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Orders Today" 
          value="142" 
          icon={<ClipboardList className="h-4 w-4" />} 
          iconColor="text-blue-600"
          trend={{ value: "+18%", isUp: true }}
          description="vs. yesterday"
        />
        <StatCard 
          title="Total Revenue" 
          value="$2,482.50" 
          icon={<DollarSign className="h-4 w-4" />} 
          iconColor="text-green-600"
          trend={{ value: "+12.5%", isUp: true }}
          description="since 8:00 AM"
        />
        <StatCard 
          title="Active Tables" 
          value="18 / 24" 
          icon={<Utensils className="h-4 w-4" />} 
          iconColor="text-primary"
          description="75% Occupancy"
        />
        <StatCard 
          title="Current Customers" 
          value="34" 
          icon={<Users className="h-4 w-4" />} 
          iconColor="text-accent"
          trend={{ value: "+3", isUp: true }}
          description="just arrived"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Sales Chart */}
        <Card className="lg:col-span-8 border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black">Sales Performance</CardTitle>
              <CardDescription>Intraday revenue and volume analytics.</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
               <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold px-2 bg-background shadow-sm">Today</Button>
               <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold px-2">Week</Button>
               <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold px-2">Month</Button>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
             <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SALES_DATA}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '600'}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: '600'}}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </ChartContainer>
          </CardContent>
        </Card>

        {/* Quick Actions & Status */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Rapid management shortcuts.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20 flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5 group" asChild>
                <Link href="/cafe-admin/products">
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span className="text-xs font-bold">Add Product</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5 group" asChild>
                <Link href="/cafe-admin/tables">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span className="text-xs font-bold">Add Table</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5 group" asChild>
                <Link href="/cafe-admin/orders">
                  <ClipboardList className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span className="text-xs font-bold">View Orders</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5 group" asChild>
                <Link href="/cafe-admin/settings">
                  <Settings className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span className="text-xs font-bold">Settings</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
             <CardHeader className="pb-2">
                <CardTitle className="text-lg">Table Status Summary</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                   <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-bold text-green-700">Available</span>
                   </div>
                   <span className="text-sm font-black text-green-700">12</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                   <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-sm font-bold text-orange-700">Occupied</span>
                   </div>
                   <span className="text-sm font-black text-orange-700">6</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-muted">
                   <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span className="text-sm font-bold text-muted-foreground">Disabled</span>
                   </div>
                   <span className="text-sm font-black text-muted-foreground">2</span>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Live Orders Feed */}
        <Card className="lg:col-span-7 border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Live Order Stream</CardTitle>
              <CardDescription>Real-time updates from floor activity.</CardDescription>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href="/cafe-admin/orders" className="text-primary font-bold">Manage All Orders</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <DataTableReusable 
              columns={[
                { 
                  key: "id", 
                  label: "Order", 
                  render: (row) => <span className="font-bold text-primary">#{row.id}</span> 
                },
                { 
                  key: "table", 
                  label: "Location",
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.table}</span>
                      {row.type === 'dine-in' ? <Utensils className="h-3 w-3 text-muted-foreground" /> : <Car className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  )
                },
                { 
                  key: "status", 
                  label: "Status",
                  render: (row) => (
                    <Badge variant={row.status === 'ready' ? 'default' : 'secondary'} className="capitalize text-[10px] h-5">
                      {row.status}
                    </Badge>
                  )
                },
                { 
                  key: "total", 
                  label: "Amount", 
                  className: "font-black" 
                },
                { 
                  key: "time", 
                  label: "Last Activity", 
                  className: "text-right pr-6 text-muted-foreground text-xs" 
                },
              ]}
              data={RECENT_ORDERS}
             />
          </CardContent>
        </Card>

        {/* Top Products & Branch Overview */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg">Product Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-5">
                {TOP_PRODUCTS.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-black text-primary">{i+1}</div>
                      <div>
                         <p className="text-sm font-bold leading-tight">{item.name}</p>
                         <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{item.revenue} Revenue</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black">{item.count}</p>
                       <span className={`text-[10px] font-bold ${item.trend.startsWith('+') ? 'text-green-600' : 'text-destructive'}`}>
                          {item.trend}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
             <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg">Branch Performance</CardTitle>
             </CardHeader>
             <CardContent className="pt-4">
                <div className="space-y-4">
                   {BRANCH_PERFORMANCE.map((branch, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                           <div className={`h-2 w-2 rounded-full ${branch.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                           <div>
                              <p className="text-sm font-bold">{branch.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{branch.orders} Orders Today</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-primary">{branch.revenue}</p>
                           <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                        </div>
                     </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}