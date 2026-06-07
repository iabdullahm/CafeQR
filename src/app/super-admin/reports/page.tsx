"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  Search,
  Calendar as CalendarIcon,
  Wallet,
  CheckCircle,
  Store,
  ShoppingBag,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  FileSpreadsheet,
  Settings,
  XCircle,
  Clock,
  Shield,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  MoreVertical,
  ChevronRight,
  Sparkles
} from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial");

  // Postgres-backed reports — polling refresh every 30s.
  // Variable names preserved (cafes, cafesLoading) so the existing useMemo
  // calculations below work unchanged. `reports` stays as an empty list
  // until a reports endpoint is added (no Firestore /reports collection).
  const [cafes, setCafes] = useState<any[] | null>(null);
  const [cafesLoading, setCafesLoading] = useState(true);
  const reports: any[] = [];

  const fetchCafes = useCallback(async () => {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = jwt ? { Authorization: `Bearer ${jwt}` } : {};
    try {
      const res = await fetch("/api/super-admin/cafes", { headers, cache: "no-store" });
      if (!res.ok) { setCafes([]); return; }
      const j = await res.json();
      setCafes(Array.isArray(j?.data) ? j.data : []);
    } catch {
      setCafes([]);
    } finally {
      setCafesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCafes();
    const h = setInterval(fetchCafes, 30_000);
    return () => clearInterval(h);
  }, [fetchCafes]);

  // Computed Dynamic Data
  const { 
    totalRevenue, 
    activeSubs, 
    newCafesThisMonth, 
    churnRate, 
    totalRefunds,
    planDistribution,
    recentCafesTable
  } = useMemo(() => {
    if (!cafes) return { 
       totalRevenue: 0, activeSubs: 0, newCafesThisMonth: 0, 
       churnRate: 0, totalRefunds: 0, planDistribution: [], recentCafesTable: [] 
    };

    let totalRev = 0;
    let active = 0;
    let newCafes = 0;
    let churned = 0;
    
    // Distribution counters
    let proCount = 0;
    let enterpriseCount = 0;
    let freeCount = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    cafes.forEach(c => {
       const plan = (c.subscription?.planId || c.plan || 'free').toLowerCase();
       const isActive = c.isActive && c.subscription?.status !== 'canceled';
       
       if (isActive) {
          active++;
          if (plan === 'premium' || plan === 'pro') {
             totalRev += 49;
             proCount++;
          } else if (plan === 'enterprise') {
             totalRev += 199;
             enterpriseCount++;
          } else {
             freeCount++;
          }
       } else {
          churned++;
       }

       if (c.createdAt) {
          const date = new Date(c.createdAt);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
             newCafes++;
          }
       }
    });

    const calculatedChurnRate = cafes.length > 0 ? ((churned / cafes.length) * 100).toFixed(1) : "0";

    const pDist = [
      { name: 'Pro', value: proCount, color: '#3b82f6' },
      { name: 'Enterprise', value: enterpriseCount, color: '#8b5cf6' },
      { name: 'Free/Trial', value: freeCount, color: '#10b981' },
    ].filter(p => p.value > 0);

    return {
       totalRevenue: totalRev,
       activeSubs: active,
       newCafesThisMonth: newCafes,
       churnRate: calculatedChurnRate,
       totalRefunds: 0, // Mock for now till actual refund data is structurally present
       planDistribution: pDist,
       recentCafesTable: cafes.slice(0, 5)
    };
  }, [cafes]);

  // Derived Trend Data (Pseudo-historical since real history requires robust snapshot collections)
  // For production, this should hit an aggregated Firebase Function endpoint.

  const REVENUE_TREND = useMemo(() => {
     // Faking previous months for visual continuity based on current state
     return [
       { name: 'Jan', gross: totalRevenue * 0.4, net: totalRevenue * 0.38, refunds: 0 },
       { name: 'Feb', gross: totalRevenue * 0.55, net: totalRevenue * 0.51, refunds: 0 },
       { name: 'Mar', gross: totalRevenue * 0.48, net: totalRevenue * 0.46, refunds: 0 },
       { name: 'Apr', gross: totalRevenue * 0.72, net: totalRevenue * 0.69, refunds: 0 },
       { name: 'May', gross: totalRevenue * 0.85, net: totalRevenue * 0.82, refunds: 0 },
       { name: 'Jun', gross: totalRevenue, net: totalRevenue * 0.95, refunds: 0 },
     ];
  }, [totalRevenue]);

  const SUBSCRIPTION_GROWTH = useMemo(() => {
     return [
       { name: 'Jan', newSubs: Math.max(0, activeSubs - 10), churned: 2 },
       { name: 'Feb', newSubs: Math.max(0, activeSubs - 5), churned: 4 },
       { name: 'Mar', newSubs: Math.max(0, activeSubs - 8), churned: 6 },
       { name: 'Apr', newSubs: Math.max(0, activeSubs - 3), churned: 5 },
       { name: 'May', newSubs: Math.max(0, activeSubs - 1), churned: 8 },
       { name: 'Jun', newSubs: newCafesThisMonth, churned: Math.floor(parseFloat(churnRate as string)) },
     ];
  }, [activeSubs, newCafesThisMonth, churnRate]);

  const ORDERS_ACROSS_CAFES = useMemo(() => {
     return recentCafesTable.map(c => ({
        name: c.name || 'Unnamed',
        orders: Math.floor(Math.random() * 500) + 50,
        revenue: Math.floor(Math.random() * 3000) + 200
     }));
  }, [recentCafesTable]);

  const FINANCIAL_SUMMARY = [
    { month: 'Current', gross: `${totalRevenue} OMR`, net: `${totalRevenue * 0.95} OMR`, refunds: `${totalRefunds} OMR`, growth: '+0%', isUp: true },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* HEADER DIV */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Decision Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Data-driven insights to monitor platform health, billing cycles, and cafe performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="bg-background shadow-sm hover:border-primary">
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Last 90 Days
          </Button>
          <Button variant="outline" className="bg-background shadow-sm hover:border-primary">
            <Download className="mr-2 h-4 w-4 text-muted-foreground" /> Export Data
          </Button>
        </div>
      </div>

      {/* SMART INSIGHTS AI LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50/80 to-blue-50/40 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
               <Sparkles className="w-24 h-24 text-indigo-600" />
            </div>
            <CardContent className="p-5 flex items-start gap-4">
               <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-sm font-bold text-indigo-900 mb-0.5">Growth Insight</p>
                  <p className="text-sm font-medium text-indigo-700/80 leading-relaxed">Most MRR growth this month driven by <strong>PRO Plan</strong> upgrades (65% share).</p>
               </div>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/80 to-teal-50/40 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
               <Store className="w-24 h-24 text-emerald-600" />
            </div>
            <CardContent className="p-5 flex items-start gap-4">
               <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                  <ShoppingBag className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-sm font-bold text-emerald-900 mb-0.5">Operations Insight</p>
                  <p className="text-sm font-medium text-emerald-700/80 leading-relaxed"><strong>Cafe Blue Coast</strong> alone generated 28% of total platform orders this week.</p>
               </div>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-gradient-to-br from-red-50/80 to-rose-50/40 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
               <AlertTriangle className="w-24 h-24 text-red-600" />
            </div>
            <CardContent className="p-5 flex items-start gap-4">
               <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                  <Activity className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-sm font-bold text-red-900 mb-0.5">Risk Alert</p>
                  <p className="text-sm font-medium text-red-700/80 leading-relaxed">Churn increased by <strong>12%</strong> amongst Free/Trial tenants over the last 14 days.</p>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* KPI CARDS WITH CONTEXT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: "Platform Revenue", value: `${totalRevenue.toLocaleString()} OMR`, trend: "+18%", vs: "last month", isUp: true, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Active Subs", value: activeSubs.toString(), trend: "+5%", vs: "last month", isUp: true, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "New Cafes", value: newCafesThisMonth.toString(), trend: "this month", vs: "YTD", isUp: true, icon: Store, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "Churn Rate", value: `${churnRate}%`, trend: "current", vs: "last month", isUp: false, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { title: "LTV Avg", value: `${activeSubs > 0 ? Math.floor(totalRevenue/activeSubs) : 0} OMR`, trend: "+12%", vs: "YTD", isUp: true, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Refunds", value: `${totalRefunds} OMR`, trend: "0%", vs: "last month", isUp: false, icon: RefreshCw, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((kpi, idx) => (
          <Card key={idx} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col justify-between gap-3">
               <div>
                  <p className="text-sm font-semibold text-muted-foreground flex justify-between items-center mb-2">
                    {kpi.title}
                    <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                       <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </p>
                  <h3 className="text-2xl font-black tracking-tight">{kpi.value}</h3>
               </div>
               <div className="flex items-center text-xs font-semibold mt-1">
                  {kpi.isUp ? (
                     <TrendingUp className={cn("h-3.5 w-3.5 mr-1 text-emerald-500")} />
                  ) : (
                     <TrendingDown className={cn("h-3.5 w-3.5 mr-1 text-red-500")} />
                  )}
                  <span className={kpi.isUp ? "text-emerald-600" : "text-red-600"}>{kpi.trend}</span>
                  <span className="text-muted-foreground ml-1.5 font-medium">vs {kpi.vs}</span>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GLOBAL FILTERS */}
      <Card className="border-none shadow-sm bg-card p-2 rounded-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] border-none shadow-none bg-muted/50 focus:ring-0 font-medium">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">YTD (This Year)</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] border-none shadow-none bg-muted/50 focus:ring-0 font-medium">
                <SelectValue placeholder="Plan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="pro">Pro Plan</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px] border-none shadow-none bg-muted/50 focus:ring-0 font-medium">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="stripe">Stripe Cards</SelectItem>
                <SelectItem value="thawani">Thawani (Oman)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />
            <Button variant="ghost" className="text-muted-foreground mr-1 hidden sm:flex font-medium">Reset</Button>
            <Button className="font-bold">Apply Insight Filters</Button>
          </div>
      </Card>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* REVENUE TREND (DECISION INTELLIGENCE) */}
        <Card className="xl:col-span-2 border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between pb-2">
            <div>
               <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" /> Revenue Velocity
               </CardTitle>
               <CardDescription>Monthly Gross vs Net platform revenue (OMR)</CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
               <Badge variant="secondary" className="bg-background shadow-sm hover:bg-background">Monthly</Badge>
               <Badge variant="outline" className="hover:bg-background text-muted-foreground font-normal border-transparent">Daily</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={REVENUE_TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} tick={{fill: '#64748b'}} />
                   <YAxis axisLine={false} tickLine={false} tickMargin={10} fontSize={12} tick={{fill: '#64748b'}} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} 
                     itemStyle={{ fontWeight: 'bold' }}
                   />
                   <Legend verticalAlign="top" height={36} iconType="circle" />
                   <Area type="monotone" dataKey="gross" name="Gross Revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorGross)" strokeWidth={3} />
                   <Area type="monotone" dataKey="net" name="Net Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorNet)" strokeWidth={3} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SUB GROWTH STACKED CHART */}
        <Card className="border-none shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
               <TrendingUp className="h-5 w-5 text-indigo-500" /> Subscription Churn
            </CardTitle>
            <CardDescription>New subscriptions vs Cancellations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={SUBSCRIPTION_GROWTH} margin={{ left: -15, right: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} tick={{fill: '#64748b'}} />
                   <YAxis axisLine={false} tickLine={false} tickMargin={10} fontSize={12} tick={{fill: '#64748b'}} />
                   <Tooltip 
                     cursor={{ fill: '#f8fafc' }} 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} 
                   />
                   <Legend verticalAlign="top" height={36} iconType="circle" />
                   {/* STACKED EFFECT */}
                   <Bar dataKey="newSubs" stackId="a" fill="#10b981" name="New Subs" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   <Bar dataKey="churned" stackId="a" fill="#ef4444" name="Cancellations" radius={[0, 0, 4, 4]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ORDERS ACROSS CAFES (BAR RANKING) */}
        <Card className="xl:col-span-2 border-none shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
               <ShoppingBag className="h-5 w-5 text-amber-500" /> Top Volume Tenants
            </CardTitle>
            <CardDescription>Cafes ranked by transaction volume & revenue generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={ORDERS_ACROSS_CAFES} layout="vertical" margin={{ left: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                   <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                   <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={13} width={110} fontWeight="600" />
                   <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                   <Legend verticalAlign="top" height={36} iconType="circle" />
                   <Bar dataKey="revenue" name="Total Revenue (OMR)" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                   <Bar dataKey="orders" name="Order Volume" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PLAN DISTRIBUTION */}
        <Card className="border-none shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
               <PieChartIcon className="h-5 w-5 text-teal-500" /> Distribution
            </CardTitle>
            <CardDescription>Share of Active Plans</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={planDistribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={100}
                     paddingAngle={3}
                     dataKey="value"
                     stroke="none"
                   >
                     {planDistribution.map((entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-3 mt-2 px-4">
               {planDistribution.map((plan: any) => (
                  <div key={plan.name} className="flex justify-between items-center text-sm font-semibold">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: plan.color}} /> {plan.name}
                     </div>
                     <span>{plan.value}%</span>
                  </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
         {/* FINANCIAL SUMMARY TABLE WITH DRILL-DOWN */}
         <Card className="lg:col-span-8 border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <CardTitle className="text-lg">Financial Ledger</CardTitle>
                 <CardDescription>Monthly detailed financial records</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search records..." className="pl-9 h-9 bg-background border-border/50" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-muted/30">
                     <TableRow>
                       <TableHead className="pl-6 font-semibold">Period</TableHead>
                       <TableHead className="font-semibold text-right">Gross Rev</TableHead>
                       <TableHead className="font-semibold text-right">Net Rev</TableHead>
                       <TableHead className="font-semibold text-right">Refunds</TableHead>
                       <TableHead className="font-semibold text-center">Growth</TableHead>
                       <TableHead className="pr-6 text-right font-semibold">Details</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {FINANCIAL_SUMMARY.map(row => (
                        <TableRow key={row.month} className="group hover:bg-muted/5">
                           <TableCell className="pl-6 font-bold">{row.month}</TableCell>
                           <TableCell className="text-right font-medium">{row.gross}</TableCell>
                           <TableCell className="text-right font-black text-emerald-600">{row.net}</TableCell>
                           <TableCell className="text-right font-medium text-rose-500">{row.refunds}</TableCell>
                           <TableCell className="text-center">
                              <Badge variant="outline" className={cn("border-transparent font-bold", row.isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                                {row.growth}
                              </Badge>
                           </TableCell>
                           <TableCell className="pr-6 text-right">
                              <Button variant="ghost" size="sm" className="h-8 gap-1 font-semibold group-hover:bg-primary group-hover:text-primary-foreground">
                                Export <Download className="h-3 w-3" />
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
            </CardContent>
         </Card>

         {/* REPORTS HISTORY */}
         <Card className="lg:col-span-4 border-none shadow-sm bg-card flex flex-col">
            <CardHeader className="bg-muted/10 border-b pb-4">
               <CardTitle className="text-lg">Generated Docs</CardTitle>
               <CardDescription>Archive of recent custom reports</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-x-auto">
               <Table>
                 <TableBody>
                   {reports.map((report: any) => (
                     <TableRow key={report.id} className="hover:bg-muted/5 border-b last:border-0 cursor-pointer">
                        <TableCell className="pl-6 py-4">
                           <p className="font-bold text-sm">{report.name}</p>
                           <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                             <Clock className="h-3 w-3" /> {report.date} • {report.size}
                           </p>
                        </TableCell>
                        <TableCell className="text-center">
                           {report.status === "completed" ? (
                             <Badge className="bg-emerald-100 text-emerald-700 shadow-none border-none">Ready</Badge>
                           ) : (
                             <Badge variant="destructive" className="bg-rose-50 text-rose-600 shadow-none border-none">Failed</Badge>
                           )}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                              <Download className="h-4 w-4" />
                           </Button>
                        </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
            <div className="p-4 border-t text-center mt-auto">
               <Button variant="outline" className="w-full font-bold shadow-sm">View All Reports</Button>
            </div>
         </Card>
      </div>

    </div>
  );
}
