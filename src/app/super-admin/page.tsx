
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Store, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag, 
  QrCode, 
  UserPlus,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { useAuthStore } from "@/store/auth-store";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentCafes, setRecentCafes] = useState<any[]>([]);
  const [expiringSubs, setExpiringSubs] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
    const fetchData = async () => {
      try {
        const [statsRes, recentRes, expiringRes, revenueRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-cafes'),
          api.get('/dashboard/expiring-subscriptions'),
          api.get('/dashboard/revenue-chart?period=monthly')
        ]);

        setStats(statsRes.data.data);
        setRecentCafes(recentRes.data.data);
        setExpiringSubs(expiringRes.data.data);
        setRevenueData(revenueRes.data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hydrate]);

  if (isLoading) return <div className="p-8 text-center font-bold text-muted-foreground">Loading dashboard...</div>;

  const dashboardStats = [
    { title: "Total Cafes", value: stats?.totalCafes || 0, icon: Store, trend: "+12%", trendUp: true, color: "text-blue-600" },
    { title: "Active Subs", value: stats?.activeSubscriptions || 0, icon: CheckCircle2, trend: "+8%", trendUp: true, color: "text-green-600" },
    { title: "Expired Subs", value: stats?.expiredSubscriptions || 0, icon: AlertCircle, trend: "-2%", trendUp: false, color: "text-destructive" },
    { title: "Monthly Revenue", value: `${stats?.monthlyRevenue?.toFixed(3) || "0.000"} OMR`, icon: CreditCard, trend: "+15%", trendUp: true, color: "text-primary" },
    { title: "Total Orders", value: stats?.ordersThisMonth || 0, icon: ShoppingBag, trend: "+22%", trendUp: true, color: "text-orange-600" },
    { title: "Total Customers", value: "125k", icon: Users, trend: "+5%", trendUp: true, color: "text-indigo-600" },
    { title: "QR Scans Today", value: "12,402", icon: QrCode, trend: "+18%", trendUp: true, color: "text-accent" },
    { title: "New Registrations", value: stats?.newRegistrations || 0, icon: UserPlus, trend: "Stable", trendUp: true, color: "text-pink-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1 text-lg">Platform performance and system health at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Report</Button>
          <Button className="bg-primary hover:bg-primary/90">System Health: Good</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className={`text-xs font-bold ${stat.trendUp ? 'text-green-600' : 'text-destructive'}`}>
                  {stat.trend}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-none shadow-sm bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Monthly revenue trends across all tenants.</CardDescription>
               </div>
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Live Data</Badge>
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
                   <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                   />
                   <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                    tickFormatter={(value) => `${(value/1000).toFixed(1)}k`}
                   />
                   <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                   />
                   <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={3}
                   />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Expiring Subscriptions</CardTitle>
              <CardDescription>Accounts requiring attention soon.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expiringSubs.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{sub.cafe?.name || "Unknown Cafe"}</span>
                      <span className="text-xs text-muted-foreground">{sub.plan?.name || "Free"} • {sub.total_amount?.toFixed(3)} OMR</span>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent text-[10px]">Expiring soon</Badge>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4 text-xs font-bold text-primary">View All Subscriptions</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="h-24 w-24" />
             </div>
             <CardHeader>
                <CardTitle className="text-lg">Growth Goal</CardTitle>
                <CardDescription className="text-primary-foreground/70">Target: 1,500 Cafes by Q4</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-2">
                   <div className="flex justify-between text-sm font-bold">
                      <span>82.6% Complete</span>
                      <span>1,240 / 1,500</span>
                   </div>
                   <div className="h-3 w-full bg-white/20 rounded-full">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: '82.6%' }} />
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Cafe Signups</CardTitle>
              <CardDescription>Newest tenants onboarded to the platform.</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-bold">Cafe Details</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Join Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCafes.map((cafe) => (
                  <TableRow key={cafe.id} className="hover:bg-muted/20">
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="font-bold">{cafe.name}</span>
                          <span className="text-xs text-muted-foreground">{cafe.email}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={cafe.status === 'active' ? 'default' : 'destructive'}
                        className={`capitalize font-bold ${cafe.status === 'active' ? 'bg-green-600' : ''}`}
                      >
                        {cafe.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-medium">
                      {new Date(cafe.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
