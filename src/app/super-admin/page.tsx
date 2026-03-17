"use client";

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
  ArrowDownRight,
  MoreVertical
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 32000, subscriptions: 850 },
  { name: 'Feb', revenue: 35000, subscriptions: 920 },
  { name: 'Mar', revenue: 42000, subscriptions: 1050 },
  { name: 'Apr', revenue: 45000, subscriptions: 1120 },
  { name: 'May', revenue: 48000, subscriptions: 1180 },
  { name: 'Jun', revenue: 52430, subscriptions: 1240 },
];

export default function SuperAdminDashboard() {
  const stats = [
    { title: "Total Cafes", value: "1,240", icon: Store, trend: "+12%", trendUp: true, color: "text-blue-600" },
    { title: "Active Subs", value: "1,150", icon: CheckCircle2, trend: "+8%", trendUp: true, color: "text-green-600" },
    { title: "Expired Subs", value: "45", icon: AlertCircle, trend: "-2%", trendUp: false, color: "text-destructive" },
    { title: "Monthly Revenue", value: "$52,430", icon: CreditCard, trend: "+15%", trendUp: true, color: "text-primary" },
    { title: "Total Orders", value: "84.2k", icon: ShoppingBag, trend: "+22%", trendUp: true, color: "text-orange-600" },
    { title: "Total Customers", value: "125k", icon: Users, trend: "+5%", trendUp: true, color: "text-indigo-600" },
    { title: "QR Scans Today", value: "12,402", icon: QrCode, trend: "+18%", trendUp: true, color: "text-accent" },
    { title: "New Registrations", value: "24", icon: UserPlus, trend: "Stable", trendUp: true, color: "text-pink-600" },
  ];

  const recentCafes = [
    { name: "Coffee Haven", status: "active", plan: "Premium", joinDate: "2024-03-10", email: "contact@coffeehaven.com" },
    { name: "The Bean Sprout", status: "active", plan: "Basic", joinDate: "2024-03-09", email: "hello@beansprout.cafe" },
    { name: "Rustic Roast", status: "suspended", plan: "Pro", joinDate: "2024-03-08", email: "admin@rusticroast.co" },
    { name: "Urban Brew", status: "active", plan: "Enterprise", joinDate: "2024-03-07", email: "hq@urbanbrew.net" },
  ];

  const expiringSubs = [
    { cafe: "Green Leaf Cafe", plan: "Pro", expiry: "In 2 days", amount: "$49.00" },
    { cafe: "Mocha Magic", plan: "Premium", expiry: "In 5 days", amount: "$99.00" },
    { cafe: "Sunset Sips", plan: "Basic", expiry: "In 1 week", amount: "$19.00" },
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
        {stats.map((stat) => (
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
                  <CardDescription>Monthly revenue and subscription growth trends.</CardDescription>
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
                    tickFormatter={(value) => `$${value/1000}k`}
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
                      <span className="font-bold text-sm">{sub.cafe}</span>
                      <span className="text-xs text-muted-foreground">{sub.plan} • {sub.amount}</span>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent text-[10px]">{sub.expiry}</Badge>
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
                  <TableHead className="font-bold">Plan</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Join Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCafes.map((cafe) => (
                  <TableRow key={cafe.name} className="hover:bg-muted/20">
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="font-bold">{cafe.name}</span>
                          <span className="text-xs text-muted-foreground">{cafe.email}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="font-medium">{cafe.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={cafe.status === 'active' ? 'default' : 'destructive'}
                        className={`capitalize font-bold ${cafe.status === 'active' ? 'bg-green-600' : ''}`}
                      >
                        {cafe.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-medium">{cafe.joinDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card">
          <CardHeader>
             <CardTitle>System Alerts</CardTitle>
             <CardDescription>Real-time platform notifications.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex gap-3 items-start p-3 rounded-lg border-l-4 border-l-accent bg-accent/5">
                   <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                   <div>
                      <p className="text-sm font-bold">Payout Error</p>
                      <p className="text-xs text-muted-foreground">3 payouts failed for Stripe Connect users.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">2 hours ago</p>
                   </div>
                </div>
                <div className="flex gap-3 items-start p-3 rounded-lg border-l-4 border-l-primary bg-primary/5">
                   <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                   <div>
                      <p className="text-sm font-bold">Security Scan Complete</p>
                      <p className="text-xs text-muted-foreground">0 vulnerabilities found across all instances.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">5 hours ago</p>
                   </div>
                </div>
                <div className="flex gap-3 items-start p-3 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                   <MoreVertical className="h-5 w-5 text-blue-500 shrink-0 mt-0.5 rotate-90" />
                   <div>
                      <p className="text-sm font-bold">System Update Scheduled</p>
                      <p className="text-xs text-muted-foreground">Version 2.4.0 rollout scheduled for tonight.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">10 hours ago</p>
                   </div>
                </div>
             </div>
             <Button variant="outline" className="w-full mt-6 text-xs font-bold">View Activity Logs</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
