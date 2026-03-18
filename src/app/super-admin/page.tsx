
"use client";

import { useMemo } from 'react';
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
  TrendingUp
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from "@/lib/utils";

export default function SuperAdminDashboard() {
  const db = useFirestore();

  // Real-time Cafes
  const cafesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'cafes'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: cafes, isLoading: cafesLoading } = useCollection(cafesQuery);

  // Derived Stats
  const stats = useMemo(() => {
    const totalCafes = cafes?.length || 0;
    const activeSubs = cafes?.filter(c => c.isActive && c.subscription?.status === 'ACTIVE').length || 0;
    
    // In a real app, revenue would come from a payments collection, using mock for demo
    return [
      { title: "Total Cafes", value: totalCafes, icon: <Store className="h-4 w-4" />, color: "text-blue-600", trend: "+12%" },
      { title: "Active Subs", value: activeSubs, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600", trend: "+8%" },
      { title: "Monthly Revenue", value: `1,240.500 OMR`, icon: <CreditCard className="h-4 w-4" />, color: "text-primary", trend: "+15%" },
      { title: "Total Orders", value: "8,420", icon: <ShoppingBag className="h-4 w-4" />, color: "text-orange-600", trend: "+22%" },
    ];
  }, [cafes]);

  const revenueData = [
    { name: 'Jan', revenue: 12000 },
    { name: 'Feb', revenue: 15000 },
    { name: 'Mar', revenue: 18000 },
    { name: 'Apr', revenue: 22000 },
    { name: 'May', revenue: 25000 },
    { name: 'Jun', revenue: 39000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Dashboard Overview" 
        description="Platform performance and system health at a glance."
        actions={
          <>
            <Button variant="outline" className="gap-2 bg-card">
              <RefreshCw className={cn("h-4 w-4", cafesLoading && "animate-spin")} /> Refresh
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              Download Report
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard 
            key={stat.title} 
            title={stat.title} 
            value={stat.value} 
            icon={stat.icon} 
            iconColor={stat.color}
            trend={{ value: stat.trend, isUp: true }}
            description="vs last month"
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-none shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Monthly revenue trends across all tenants (OMR).</CardDescription>
               </div>
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Global View</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                   <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                   <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                   <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Platform Growth</CardTitle>
              <CardDescription>Target: 1,500 Cafes by Q4</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 py-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                       <span>Market Reach</span>
                       <span>82.6%</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full">
                       <div className="h-full bg-primary rounded-full transition-all" style={{ width: '82.6%' }} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-muted/50 border">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Retention</p>
                       <p className="text-lg font-black mt-1">98.2%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Scans/Hr</p>
                       <p className="text-lg font-black mt-1">1.2k</p>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-accent text-accent-foreground overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="h-24 w-24 text-white" />
             </div>
             <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                   <span className="font-bold">All services operational</span>
                </div>
                <p className="text-xs opacity-70 mt-2">Uptime: 99.99% (Last 30 days)</p>
             </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Cafe Signups</CardTitle>
            <CardDescription>Newest tenants onboarded to the platform.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href='/super-admin/cafes'}>View All Directory</Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTableReusable 
            isLoading={cafesLoading}
            data={(cafes || []).slice(0, 5)}
            columns={[
              { 
                key: "name", 
                label: "Cafe Details",
                render: (row) => (
                  <div className="flex flex-col">
                    <span className="font-bold">{row.name}</span>
                    <span className="text-xs text-muted-foreground">{row.email || row.slug}</span>
                  </div>
                )
              },
              { 
                key: "status", 
                label: "Status",
                render: (row) => (
                  <Badge 
                    className={cn("capitalize font-bold", row.isActive ? "bg-green-600" : "bg-destructive")}
                  >
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )
              },
              { 
                key: "createdAt", 
                label: "Join Date",
                className: "text-right pr-6",
                render: (row) => (
                  <span className="text-muted-foreground font-medium">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                )
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
