"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";

import { SectionHeader } from "@/components/dashboard/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, Coffee, DollarSign, Clock, Download, Star, Car, Store, Package
} from "lucide-react";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function ReportsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const [impersonatedCafeId, setImpersonatedCafeId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("month"); // today, week, month, year

  // Get active Cafe ID
  useMemo(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.impersonatedBy && payload.cafeId) {
          setImpersonatedCafeId(payload.cafeId);
        }
      } catch (e) {}
    }
  }, []);

  // JWT migration: role + cafeId come from useUser() directly; no Firestore profile lookup.
  const userProfileRef = useMemoFirebase(() => null, []);
  const { data: profile } = useDoc(userProfileRef);
  const cafeId: string | null = impersonatedCafeId || (user as any)?.cafeId || profile?.cafeId || null;

    // Postgres polling for orders + customers reports.
  const [ordersData, setOrdersData] = useState<any[] | null>(null);
  const [customersData, setCustomersData] = useState<any[] | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(true);
  useEffect(() => {
    if (!cafeId) return;
    let alive = true;
    const tok = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = tok ? { Authorization: `Bearer ${tok}` } : undefined;
    const load = async () => {
      try {
        const [oRes, cRes] = await Promise.all([
          fetch(`/api/cafes/${cafeId}/orders?limit=500`, { headers, cache: 'no-store' }),
          fetch(`/api/cafes/${cafeId}/customers?limit=500`, { headers, cache: 'no-store' }),
        ]);
        if (!alive) return;
        if (oRes.ok) { const j = await oRes.json(); if (j.success) setOrdersData(j.data); }
        if (cRes.ok) { const j = await cRes.json(); if (j.success) setCustomersData(j.data); }
      } catch { /* ignore */ }
      finally { if (alive) { setIsLoadingOrders(false); setIsLoadingCustomers(false); } }
    };
    void load();
    const iv = setInterval(load, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, [cafeId])

  // Process Data
  const analytics = useMemo(() => {
    if (!ordersData || !customersData) return null;

    const now = new Date();
    const startDate = new Date();
    if (dateRange === 'today') startDate.setHours(0,0,0,0);
    else if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
    else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (dateRange === 'year') startDate.setFullYear(now.getFullYear() - 1);

    const filteredOrders = ordersData.filter(o => new Date(o.createdAt) >= startDate && o.status !== 'CANCELLED');
    
    // 1. Sales Overview
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = filteredOrders.length;
    const aov = totalOrders > 0 ? (totalSales / totalOrders) : 0;

    // 2. Customers
    const filteredCustomers = customersData.filter(c => new Date(c.createdAt) >= startDate);
    const newCustomers = filteredCustomers.length;
    const activeLoyalty = customersData.filter(c => !c.isGuest && c.phone).length;

    // 3. Loyalty Performance
    const rewardOrders = filteredOrders.filter(o => o.useReward === true).length;

    // 4. Order Types Breakdown
    const orderTypesCount = filteredOrders.reduce((acc, o) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = [
      { name: 'Dine In', value: orderTypesCount['DINE_IN'] || 0, color: '#10b981' },
      { name: 'Car Service', value: orderTypesCount['CAR_SERVICE'] || 0, color: '#3b82f6' },
      { name: 'Takeaway', value: orderTypesCount['TAKEAWAY'] || 0, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    // 5. Top Products
    const productCounts: Record<string, { count: number, revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items?.forEach((item: any) => {
        const name = item.productName || item.nameEn || 'Unknown Item';
        if (!productCounts[name]) productCounts[name] = { count: 0, revenue: 0 };
        productCounts[name].count += item.quantity || 1;
        productCounts[name].revenue += (item.unitPrice || 0) * (item.quantity || 1);
      });
    });

    const topProducts = Object.entries(productCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Peak Hours (Sales by hour)
    const hourCounts: Record<string, number> = {};
    for (let i = 8; i <= 23; i++) hourCounts[`${i}:00`] = 0; // Initialize hours 8 AM to 11 PM
    
    filteredOrders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      if (hour >= 8 && hour <= 23) {
        hourCounts[`${hour}:00`] = (hourCounts[`${hour}:00`] || 0) + 1;
      }
    });

    const peakHoursData = Object.entries(hourCounts).map(([time, orders]) => ({ time, orders }));

    // 7. Sales Trend
    const trendDataMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = dateRange === 'today' ? `${d.getHours()}:00` : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      trendDataMap[key] = (trendDataMap[key] || 0) + (o.totalAmount || 0);
    });

    // Sort dates properly if not 'today'
    const trendData = Object.entries(trendDataMap)
      .map(([date, sales]) => ({ date, sales: Number(sales.toFixed(3)) }));

    return {
      totalSales, totalOrders, aov, newCustomers, activeLoyalty, rewardOrders,
      pieData, topProducts, peakHoursData, trendData
    };
  }, [ordersData, customersData, dateRange]);

  const handleExport = () => {
    if (!ordersData) return;
    
    const now = new Date();
    const startDate = new Date();
    if (dateRange === 'today') startDate.setHours(0,0,0,0);
    else if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
    else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (dateRange === 'year') startDate.setFullYear(now.getFullYear() - 1);

    const filteredOrders = ordersData.filter(o => new Date(o.createdAt) >= startDate);
    
    if (filteredOrders.length === 0) {
      alert("No orders found for the selected period.");
      return;
    }

    const headers = ["Order ID", "Date", "Status", "Type", "Total (OMR)", "Customer Phone", "Payment Method", "Items"];
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map(o => {
        const date = new Date(o.createdAt).toLocaleString();
        const items = (o.items || []).map((i: any) => `${i.quantity || 1}x ${i.productName || i.nameEn || 'Item'}`).join("; ");
        return [
          o.id,
          `"${date}"`,
          o.status,
          o.type || o.orderType || "N/A",
          o.totalAmount || o.total || 0,
          o.customerPhone || "N/A",
          o.paymentMethod || "N/A",
          `"${items}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CafeQR_Report_${dateRange}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingOrders || isLoadingCustomers) return <div className="p-8 text-center animate-pulse text-muted-foreground font-bold">Loading Intelligence Data...</div>;
  if (!analytics) return null;

  return (
    <div className="space-y-6 animate-in fade-in max-w-[1400px] mx-auto pb-20">
      <SectionHeader 
        title="Reports & Analytics" 
        description="Actionable insights to grow your business, optimize menus, and track loyalty."
        actions={
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-white border-zinc-200 rounded-xl h-10 font-bold shadow-sm">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="bg-white rounded-xl shadow-sm h-10">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        }
      />

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center relative">
            <div className="absolute top-4 right-4 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Sales</p>
            <p className="text-3xl font-black text-zinc-900">{analytics.totalSales.toFixed(3)} <span className="text-sm font-bold text-zinc-400">OMR</span></p>
            <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12% from last period</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center relative">
            <div className="absolute top-4 right-4 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Orders</p>
            <p className="text-3xl font-black text-zinc-900">{analytics.totalOrders}</p>
            <p className="text-xs font-bold text-zinc-500 mt-2">Completed Orders</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center relative">
            <div className="absolute top-4 right-4 h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Avg Order Value</p>
            <p className="text-3xl font-black text-zinc-900">{analytics.aov.toFixed(3)} <span className="text-sm font-bold text-zinc-400">OMR</span></p>
            <p className="text-xs font-bold text-amber-600 mt-2">Healthy AOV</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center relative">
            <div className="absolute top-4 right-4 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">New Customers</p>
            <p className="text-3xl font-black text-zinc-900">{analytics.newCustomers}</p>
            <p className="text-xs font-bold text-purple-600 mt-2 flex items-center gap-1"><Users className="w-3 h-3" /> Growing audience</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* SALES TREND CHART */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#71717a'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#71717a'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value} OMR`, 'Sales']}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ORDER TYPES PIE CHART */}
        <Card className="border-border/50 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Package className="w-5 h-5 text-blue-500" /> Order Types</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full flex justify-center gap-4 mt-2">
              {analytics.pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP PRODUCTS BAR CHART */}
        <Card className="border-border/50 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Coffee className="w-5 h-5 text-amber-600" /> Top Products (Units Sold)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#3f3f46', fontWeight: 'bold'}} width={100} />
                  <Tooltip 
                    cursor={{fill: '#f4f4f5'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                    {analytics.topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PEAK HOURS BAR CHART */}
        <Card className="border-border/50 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-purple-500" /> Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#71717a'}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f4f4f5'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOYALTY SUMMARY */}
      <Card className="border-border/50 shadow-sm rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/30 overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 mb-3 text-xs font-bold px-3 py-1">Loyalty Insights</Badge>
            <h3 className="text-2xl font-black text-amber-950 mb-2">Your loyalty program is driving retention.</h3>
            <p className="text-amber-800/80 font-medium max-w-lg">
              You have <b className="text-amber-900">{analytics.activeLoyalty}</b> active customers tracking their loyalty cups. 
              During this period, <b className="text-amber-900">{analytics.rewardOrders}</b> free rewards were redeemed, proving the system is effectively encouraging repeat visits.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 text-center min-w-[200px]">
            <Star className="w-8 h-8 text-amber-500 mx-auto mb-2 fill-amber-500" />
            <p className="text-3xl font-black text-zinc-900">{analytics.rewardOrders}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase mt-1">Rewards Claimed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
