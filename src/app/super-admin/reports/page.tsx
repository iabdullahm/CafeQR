"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  Search,
  Filter,
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
  Shield
} from "lucide-react";

import {
  LineChart,
  Line,
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

// --- MOCK DATA ---
const REVENUE_TREND: any[] = [];
const SUBSCRIPTION_GROWTH: any[] = [];
const PLAN_DISTRIBUTION: any[] = [];
const ORDERS_ACROSS_CAFES: any[] = [];
const RECENT_REPORTS: any[] = [];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial");

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* HEADER DIV */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor real-time metrics, platform usage, and detailed financial reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="bg-background">
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" className="bg-background">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Settings className="mr-2 h-4 w-4" /> Custom Report
          </Button>
        </div>
      </div>

      {/* GLOBAL FILTERS */}
      <Card className="border-border/50 shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background shadow-sm w-full md:w-auto">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">This Year (YTD)</span>
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="active">Active Cafes</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="trial">In Trial</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="muscat">Muscat</SelectItem>
                <SelectItem value="salalah">Salalah</SelectItem>
                <SelectItem value="sohar">Sohar</SelectItem>
                <SelectItem value="nizwa">Nizwa</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button variant="ghost" className="h-9 px-4 text-muted-foreground hidden lg:flex">
              Reset
            </Button>
            <Button variant="secondary" className="h-9 px-6 hidden lg:flex">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: "Total Revenue", value: "0.000 OMR", desc: "No revenue records", icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
          { title: "Active Subs", value: "0", desc: "0 active subscriptions", icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "New Cafes", value: "0", desc: "No new signups", icon: Store, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Orders Processed", value: "0", desc: "No orders yet", icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Avg Rev / Cafe", value: "0.000 OMR", desc: "No data available", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { title: "Renewal Rate", value: "0%", desc: "No renewals yet", icon: RefreshCw, color: "text-teal-600", bg: "bg-teal-50" },
        ].map((kpi, idx) => (
          <Card key={idx} className="border-none shadow-sm overflow-hidden bg-white dark:bg-card">
            <CardContent className="p-5 flex flex-col justify-between gap-4">
               <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1 flex justify-between items-center">
                    {kpi.title}
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </p>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">{kpi.value}</h3>
               </div>
               <div className={`text-xs px-2 py-1 rounded inline-flex w-fit ${kpi.bg} ${kpi.color} font-medium`}>
                  {kpi.desc}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REVENUE CHART */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <CardDescription>Monthly platform gross revenue (OMR)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
               {REVENUE_TREND.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                    <Wallet className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No revenue data available</p>
                  </div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={REVENUE_TREND}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} tickMargin={10} fontSize={12} tickFormatter={(value) => `${value}`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
               )}
            </div>
          </CardContent>
        </Card>

        {/* SUB GROWTH CHART */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Subscription Growth</CardTitle>
            <CardDescription>Active vs New Subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
               {SUBSCRIPTION_GROWTH.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No subscription data available</p>
                  </div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SUBSCRIPTION_GROWTH}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} tickMargin={10} fontSize={12} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="active" fill="#3b82f6" name="Active Subs" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="newSubs" fill="#10b981" name="New Subs" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
          </CardContent>
        </Card>

        {/* PLAN DISTRIBUTION */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Plan Distribution</CardTitle>
            <CardDescription>Breakdown of cafe active plans</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full max-w-[400px]">
               {PLAN_DISTRIBUTION.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                    <PieChartIcon className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No distribution data available</p>
                  </div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PLAN_DISTRIBUTION}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {PLAN_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
               )}
            </div>
          </CardContent>
        </Card>

        {/* ORDER VOLUME */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Orders Volume Across Cafes</CardTitle>
            <CardDescription>Top 5 cafes by total orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
               {ORDERS_ACROSS_CAFES.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No order volume data available</p>
                  </div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ORDERS_ACROSS_CAFES} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                      <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={12} width={100} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="orders" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS SECTION */}
      <Tabs defaultValue="financial" value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
        <TabsList className="h-12 w-full justify-start overflow-x-auto bg-transparent border-b rounded-none p-0 inline-flex flex-nowrap shrink-0 max-w-full hide-scrollbar">
          <TabsTrigger value="financial" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 font-semibold text-sm">
            Financial Reports
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 font-semibold text-sm">
            Subscription
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 font-semibold text-sm">
            Usage & Traffic
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 font-semibold text-sm">
            Performance
          </TabsTrigger>
          <TabsTrigger value="custom" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-6 py-3 font-semibold text-sm text-primary">
            Custom Builder
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="financial" className="mt-0 focus-visible:outline-none">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="bg-muted/10 border-b pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Financial Summary</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search records..." className="pl-9 h-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="pl-6 font-semibold">Month</TableHead>
                      <TableHead className="font-semibold text-right">Gross Rev (OMR)</TableHead>
                      <TableHead className="font-semibold text-right">Net Rev (OMR)</TableHead>
                      <TableHead className="font-semibold text-right">Refunds (OMR)</TableHead>
                      <TableHead className="font-semibold text-center">Growth (%)</TableHead>
                      <TableHead className="pr-6 text-right font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[]?.length === 0 ? (
                      <TableRow>
                         <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                               <FileText className="h-8 w-8 text-muted-foreground/50" />
                               <p>No financial records found.</p>
                            </div>
                         </TableCell>
                      </TableRow>
                    ) : (
                      [{ month: "Mock", gross: 0, net: 0, refunds: 0, growth: "0%" }].map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="pl-6 font-medium">{row.month}</TableCell>
                          <TableCell className="text-right font-mono">{row.gross.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">{row.net.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{row.refunds.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                             <Badge variant="outline" className={row.growth.startsWith('+') ? "text-green-600 bg-green-50 shadow-none" : "text-red-600 bg-red-50 shadow-none"}>
                                {row.growth}
                             </Badge>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button variant="ghost" size="sm" className="h-8 shadow-none">
                               <Download className="h-4 w-4 mr-2" /> CSV
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CUSTOM REPORT BUILDER CONTENT */}
          <TabsContent value="custom" className="mt-0 focus-visible:outline-none">
            <Card className="border-2 border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                   <Settings className="h-5 w-5" />
                   Custom Report Builder
                </CardTitle>
                <CardDescription>
                   Compile tailored datasets by configuring the dimensions and filters below.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                       <div>
                          <label className="text-sm font-bold block mb-1.5">1. Report Category</label>
                          <Select defaultValue="billing">
                            <SelectTrigger>
                               <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="billing">Billing & Subscriptions</SelectItem>
                               <SelectItem value="usage">Platform Usage Metrics</SelectItem>
                               <SelectItem value="cafes">Cafe Performance</SelectItem>
                               <SelectItem value="audit">Admin Audit Logs</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                       
                       <div>
                          <label className="text-sm font-bold block mb-1.5">2. Date Range</label>
                          <Select defaultValue="last_90">
                            <SelectTrigger>
                               <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="last_30">Last 30 Days</SelectItem>
                               <SelectItem value="last_90">Last 90 Days</SelectItem>
                               <SelectItem value="ytd">Year to Date (YTD)</SelectItem>
                               <SelectItem value="custom">Custom Range...</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>

                       <div>
                          <label className="text-sm font-bold block mb-1.5">3. Filters (Optional)</label>
                          <div className="grid grid-cols-2 gap-3">
                             <Select defaultValue="all">
                               <SelectTrigger><SelectValue placeholder="Target Plan" /></SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Plans</SelectItem>
                                 <SelectItem value="growth">Growth</SelectItem>
                               </SelectContent>
                             </Select>
                             <Select defaultValue="all">
                               <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Statuses</SelectItem>
                                 <SelectItem value="active">Active Only</SelectItem>
                               </SelectContent>
                             </Select>
                          </div>
                       </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl border p-6 flex flex-col justify-between">
                       <div>
                         <h4 className="font-bold text-foreground mb-4">Export Configuration</h4>
                         <div className="space-y-3">
                           <label className="flex items-center gap-3 p-3 border rounded-lg bg-background cursor-pointer hover:border-primary">
                             <input type="radio" name="format" className="accent-primary" defaultChecked />
                             <FileSpreadsheet className="h-5 w-5 text-green-600" />
                             <div>
                               <p className="text-sm font-semibold">Excel Workbook (.xlsx)</p>
                               <p className="text-xs text-muted-foreground">Best for data analysis</p>
                             </div>
                           </label>
                           <label className="flex items-center gap-3 p-3 border rounded-lg bg-background cursor-pointer hover:border-primary">
                             <input type="radio" name="format" className="accent-primary" />
                             <FileText className="h-5 w-5 text-red-500" />
                             <div>
                               <p className="text-sm font-semibold">PDF Document (.pdf)</p>
                               <p className="text-xs text-muted-foreground">Best for sharing & printing</p>
                             </div>
                           </label>
                           <label className="flex items-center gap-3 p-3 border rounded-lg bg-background cursor-pointer hover:border-primary">
                             <input type="radio" name="format" className="accent-primary" />
                             <Activity className="h-5 w-5 text-blue-500" />
                             <div>
                               <p className="text-sm font-semibold">Raw Data (.csv)</p>
                               <p className="text-xs text-muted-foreground">Best for database import</p>
                             </div>
                           </label>
                         </div>
                       </div>
                       <Button className="w-full mt-6 h-11 text-base font-bold shadow-lg" size="lg">
                          Generate Report
                       </Button>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FALLBACK TABS */}
          <TabsContent value="subscription" className="mt-0">
             <Card className="border-dashed shadow-none p-12 flex flex-col items-center justify-center text-center">
                <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold">Subscription Metrics Ready</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                   Switching to live data connection... Detailed subscription matrices will populate here.
                </p>
             </Card>
          </TabsContent>
          <TabsContent value="usage" className="mt-0">
             <Card className="border-dashed shadow-none p-12 flex flex-col items-center justify-center text-center">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold">Usage Metrics Ready</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">No usage reports compiled for this period.</p>
             </Card>
          </TabsContent>
          <TabsContent value="performance" className="mt-0">
             <Card className="border-dashed shadow-none p-12 flex flex-col items-center justify-center text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold">Performance Logs Ready</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">Server-side latency and uptime scores will appear here.</p>
             </Card>
          </TabsContent>

        </div>
      </Tabs>

      {/* RECENT GENERATED REPORTS */}
      <Card className="mt-8 border-border/50 shadow-sm">
         <CardHeader>
            <CardTitle className="text-lg">Recent Generated Reports</CardTitle>
            <CardDescription>Archive of your recently created custom reports</CardDescription>
         </CardHeader>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-muted/10">
                   <TableRow>
                     <TableHead className="pl-6 w-[120px]">Report ID</TableHead>
                     <TableHead>Report Name</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>Date Generated</TableHead>
                     <TableHead>Format</TableHead>
                     <TableHead className="text-center">Status</TableHead>
                     <TableHead className="pr-6 text-right">Action</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {RECENT_REPORTS.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                           <div className="flex flex-col items-center justify-center gap-2">
                              <FileText className="h-8 w-8 text-muted-foreground/50" />
                              <p>No reports generated yet.</p>
                           </div>
                        </TableCell>
                     </TableRow>
                   ) : (
                     RECENT_REPORTS.map((report) => (
                       <TableRow key={report.id} className="hover:bg-muted/5">
                          <TableCell className="pl-6 font-medium text-muted-foreground">{report.id}</TableCell>
                          <TableCell className="font-semibold">{report.name}</TableCell>
                          <TableCell>
                             <Badge variant="secondary" className="font-normal shadow-none bg-secondary/50">{report.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-muted-foreground">
                             <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> {report.date}
                             </div>
                          </TableCell>
                          <TableCell>
                             <span className="text-sm font-medium">{report.format}</span>
                          </TableCell>
                          <TableCell className="text-center">
                             {report.status === "completed" ? (
                               <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-none">Ready</Badge>
                             ) : (
                               <Badge variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-50 shadow-none border-none">Failed</Badge>
                             )}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                             {report.status === "completed" ? (
                               <Button variant="ghost" size="sm" className="h-8">
                                  <Download className="h-4 w-4 text-primary" />
                               </Button>
                             ) : (
                               <Button variant="ghost" size="sm" className="h-8 opacity-50 cursor-not-allowed">
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                               </Button>
                             )}
                          </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
