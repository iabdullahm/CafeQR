
"use client";

import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Store, 
  User, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  QrCode, 
  ShoppingBag, 
  Coffee, 
  MessageSquare, 
  History, 
  Wallet, 
  LogIn, 
  Edit, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Bell,
  MoreVertical,
  ChevronLeft,
  ArrowUpRight,
  ClipboardList,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// Mock data for a single cafe
const CAFE_DATA = {
  id: "CAF-001",
  name: "The Roast Coffee",
  owner: "John Doe",
  email: "john@roast.com",
  phone: "+1 234 567 890",
  city: "New York",
  location: "Manhattan, NY",
  plan: "Premium",
  status: "active",
  joinedDate: "Jan 12, 2024",
  logo: "https://picsum.photos/seed/roast-logo/100/100",
  metrics: {
    branches: 3,
    tables: 24,
    products: 48,
    orders: 1240,
    scans: 8402,
    customers: 452,
    revenue: 52430,
    tickets: 2
  }
};

export default function CafeDetailsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href="/super-admin/cafes">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Cafes
          </Link>
        </Button>
        <span>/</span>
        <span className="font-medium text-foreground">{CAFE_DATA.name}</span>
      </div>

      {/* Header Section */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                <img src={CAFE_DATA.logo} alt={CAFE_DATA.name} className="object-cover w-full h-full" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-primary">{CAFE_DATA.name}</h1>
                  <Badge className="bg-green-600 font-bold">Active</Badge>
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 uppercase font-mono text-[10px]">
                    {CAFE_DATA.id}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {CAFE_DATA.owner}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {CAFE_DATA.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {CAFE_DATA.joinedDate}</span>
                </div>
                <div className="pt-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1.5" /> {CAFE_DATA.plan} Plan
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button size="sm" variant="outline" className="gap-2 bg-card">
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="gap-2 bg-card">
                <RefreshCw className="h-4 w-4" /> Renew Sub
              </Button>
              <Button size="sm" variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 bg-card border-destructive/20">
                <AlertCircle className="h-4 w-4" /> Suspend
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                <LogIn className="h-4 w-4" /> Login as Admin
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <Bell className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {[
          { title: "Branches", value: CAFE_DATA.metrics.branches, icon: Store, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Tables", value: CAFE_DATA.metrics.tables, icon: LayoutGrid, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "Products", value: CAFE_DATA.metrics.products, icon: Coffee, color: "text-orange-600", bg: "bg-orange-50" },
          { title: "Orders", value: CAFE_DATA.metrics.orders.toLocaleString(), icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
          { title: "QR Scans", value: CAFE_DATA.metrics.scans.toLocaleString(), icon: QrCode, color: "text-accent", bg: "bg-accent/5" },
          { title: "Customers", value: CAFE_DATA.metrics.customers.toLocaleString(), icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
          { title: "Revenue", value: `$${(CAFE_DATA.metrics.revenue / 1000).toFixed(1)}k`, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
          { title: "Tickets", value: CAFE_DATA.metrics.tickets, icon: MessageSquare, color: "text-yellow-600", bg: "bg-yellow-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm flex flex-col items-center justify-center p-4 text-center">
            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} mb-2`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
            <p className="text-lg font-black mt-1 leading-none">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="bg-card border p-1 h-auto inline-flex mb-6">
            <TabsTrigger value="overview" className="gap-2"><LayoutGrid className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2"><CreditCard className="h-4 w-4" /> Subscription</TabsTrigger>
            <TabsTrigger value="branches" className="gap-2"><Store className="h-4 w-4" /> Branches</TabsTrigger>
            <TabsTrigger value="tables" className="gap-2"><LayoutGrid className="h-4 w-4" /> Tables</TabsTrigger>
            <TabsTrigger value="menu" className="gap-2"><Coffee className="h-4 w-4" /> Menu Items</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2"><ClipboardList className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="qr" className="gap-2"><QrCode className="h-4 w-4" /> QR Codes</TabsTrigger>
            <TabsTrigger value="loyalty" className="gap-2"><Users className="h-4 w-4" /> Loyalty</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><Wallet className="h-4 w-4" /> Payments</TabsTrigger>
            <TabsTrigger value="support" className="gap-2"><MessageSquare className="h-4 w-4" /> Support</TabsTrigger>
            <TabsTrigger value="logs" className="gap-2"><History className="h-4 w-4" /> Logs</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Business Snapshot</CardTitle>
                  <CardDescription>Performance metrics for the current billing cycle.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-muted-foreground uppercase">Revenue Goal</p>
                       <div className="flex items-center justify-between text-sm font-bold">
                          <span>$12,430 / $20,000</span>
                          <span className="text-primary">62%</span>
                       </div>
                       <Progress value={62} className="h-2" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-muted-foreground uppercase">Orders Target</p>
                       <div className="flex items-center justify-between text-sm font-bold">
                          <span>452 / 600</span>
                          <span className="text-green-600">75%</span>
                       </div>
                       <Progress value={75} className="h-2" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-muted-foreground uppercase">Customer Growth</p>
                       <div className="flex items-center justify-between text-sm font-bold">
                          <span>+24 New</span>
                          <span className="text-blue-600 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> 12%</span>
                       </div>
                       <Progress value={45} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card">
                 <CardHeader>
                    <CardTitle className="text-lg">General Information</CardTitle>
                 </CardHeader>
                 <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground uppercase">Business Name</span>
                          <span className="font-bold">{CAFE_DATA.name}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground uppercase">Owner</span>
                          <span className="font-bold">{CAFE_DATA.owner}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground uppercase">Email Address</span>
                          <span className="font-bold text-primary">{CAFE_DATA.email}</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground uppercase">Phone Number</span>
                          <span className="font-bold">{CAFE_DATA.phone}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground uppercase">Headquarters</span>
                          <span className="font-bold">{CAFE_DATA.location}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground uppercase">Member Since</span>
                          <span className="font-bold">{CAFE_DATA.joinedDate}</span>
                       </div>
                    </div>
                 </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <Card className="border-none shadow-sm bg-card border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Account Status</span>
                        <Badge className="bg-green-600">Active</Badge>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Billing Cycle</span>
                        <Badge variant="outline">Monthly</Badge>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Auto-Renew</span>
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Enabled</Badge>
                     </div>
                  </CardContent>
               </Card>

               <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground italic">No administrative notes found for this cafe. Use the notes section to keep track of support calls or special requests.</p>
                     <Button variant="link" size="sm" className="px-0 mt-4 text-primary font-bold">+ Add Note</Button>
                  </CardContent>
               </Card>
            </div>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-none shadow-sm bg-primary text-primary-foreground relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="h-24 w-24" />
                 </div>
                 <CardHeader>
                    <CardTitle className="text-lg">Current Plan</CardTitle>
                    <CardDescription className="text-primary-foreground/70">Renewing on Dec 12, 2024</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <h2 className="text-4xl font-black mb-1">{CAFE_DATA.plan}</h2>
                    <p className="text-xl font-bold opacity-90">$99.00 / month</p>
                 </CardContent>
                 <CardFooter className="pt-0">
                    <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 font-bold">Upgrade Plan</Button>
                 </CardFooter>
              </Card>

              <Card className="border-none shadow-sm bg-card">
                 <CardHeader>
                    <CardTitle className="text-lg">Feature Access</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                    {[
                      { name: "QR Ordering", status: true },
                      { name: "Inventory Management", status: true },
                      { name: "Loyalty Program", status: true },
                      { name: "Analytics Dashboard", status: true },
                      { name: "Multi-branch Management", status: true },
                      { name: "White Labeling", status: false },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                         <span className="font-medium">{f.name}</span>
                         {f.status ? (
                           <CheckCircle2 className="h-4 w-4 text-green-600" />
                         ) : (
                           <AlertCircle className="h-4 w-4 text-muted-foreground/30" />
                         )}
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card">
                 <CardHeader>
                    <CardTitle className="text-lg">Subscription Timeline</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-bold uppercase">Started</span>
                          <span className="text-sm font-bold">Jan 12, 2024</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-bold uppercase">Last Renewal</span>
                          <span className="text-sm font-bold">Oct 12, 2024</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-orange-600" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-bold uppercase">Next Billing</span>
                          <span className="text-sm font-bold">Dec 12, 2024</span>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Orders Tab Placeholder */}
        <TabsContent value="orders" className="space-y-6">
           <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Card className="p-4 border-none shadow-sm">
                 <p className="text-xs font-bold text-muted-foreground uppercase">Today's Orders</p>
                 <p className="text-2xl font-black mt-1">42</p>
              </Card>
              <Card className="p-4 border-none shadow-sm">
                 <p className="text-xs font-bold text-muted-foreground uppercase">Pending</p>
                 <p className="text-2xl font-black mt-1 text-orange-600">8</p>
              </Card>
              <Card className="p-4 border-none shadow-sm">
                 <p className="text-xs font-bold text-muted-foreground uppercase">Ready</p>
                 <p className="text-2xl font-black mt-1 text-green-600">3</p>
              </Card>
              <Card className="p-4 border-none shadow-sm">
                 <p className="text-xs font-bold text-muted-foreground uppercase">Avg. Time</p>
                 <p className="text-2xl font-black mt-1">12m</p>
              </Card>
           </div>
           <Card className="border-none shadow-sm bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="text-lg">Recent Orders</CardTitle>
                 <Button variant="outline" size="sm">View Detailed Log</Button>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader>
                       <TableRow className="bg-muted/50">
                          <TableHead className="font-bold">Order ID</TableHead>
                          <TableHead className="font-bold">Branch</TableHead>
                          <TableHead className="font-bold">Amount</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold text-right">Time</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {[
                         { id: "ORD-1240", branch: "Manhattan", amount: "$24.50", status: "completed", time: "2m ago" },
                         { id: "ORD-1239", branch: "Manhattan", amount: "$12.00", status: "preparing", time: "8m ago" },
                         { id: "ORD-1238", branch: "Manhattan", amount: "$31.20", status: "completed", time: "15m ago" },
                         { id: "ORD-1237", branch: "Manhattan", amount: "$8.50", status: "cancelled", time: "25m ago" },
                       ].map((order) => (
                         <TableRow key={order.id}>
                            <TableCell className="font-bold">{order.id}</TableCell>
                            <TableCell>{order.branch}</TableCell>
                            <TableCell className="font-bold">{order.amount}</TableCell>
                            <TableCell>
                               <Badge variant={order.status === 'completed' ? 'default' : order.status === 'preparing' ? 'secondary' : 'destructive'} className="capitalize h-5 text-[10px]">
                                  {order.status}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">{order.time}</TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

        {/* Payments Tab Placeholder */}
        <TabsContent value="payments" className="space-y-6">
           <Card className="border-none shadow-sm bg-card">
              <CardHeader>
                 <CardTitle className="text-lg">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                 <Table>
                    <TableHeader>
                       <TableRow className="bg-muted/50">
                          <TableHead className="font-bold">Invoice</TableHead>
                          <TableHead className="font-bold">Description</TableHead>
                          <TableHead className="font-bold">Amount</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold text-right">Date</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {[
                         { id: "INV-1024", desc: "Premium Plan - Oct 2024", amount: "$99.00", status: "paid", date: "Oct 12, 2024" },
                         { id: "INV-0985", desc: "Premium Plan - Sep 2024", amount: "$99.00", status: "paid", date: "Sep 12, 2024" },
                         { id: "INV-0842", desc: "Premium Plan - Aug 2024", amount: "$99.00", status: "paid", date: "Aug 12, 2024" },
                       ].map((inv) => (
                         <TableRow key={inv.id}>
                            <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                            <TableCell className="font-medium">{inv.desc}</TableCell>
                            <TableCell className="font-bold">{inv.amount}</TableCell>
                            <TableCell>
                               <Badge className="bg-green-600 h-5 text-[10px] font-bold">PAID</Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">{inv.date}</TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

        {/* Logs Tab Placeholder */}
        <TabsContent value="logs" className="space-y-6">
           <Card className="border-none shadow-sm bg-card">
              <CardHeader>
                 <CardTitle className="text-lg">Audit Trail</CardTitle>
                 <CardDescription>Comprehensive history of administrative actions.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-6">
                    {[
                      { user: "Super Admin", action: "Updated subscription plan to Premium", time: "Oct 12, 2024 10:45 AM" },
                      { user: "Super Admin", action: "Logged in as Cafe Admin", time: "Oct 10, 2024 02:22 PM" },
                      { user: "System", action: "Automatic invoice generated (INV-1024)", time: "Oct 12, 2024 00:00 AM" },
                      { user: "Cafe Admin", action: "Added new branch: Manhattan North", time: "Sep 28, 2024 11:15 AM" },
                    ].map((log, i) => (
                      <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                         <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <History className="h-4 w-4 text-muted-foreground" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold">{log.action}</span>
                            <span className="text-xs text-muted-foreground">by <span className="font-medium text-foreground">{log.user}</span> • {log.time}</span>
                         </div>
                      </div>
                    ))}
                 </div>
                 <Button variant="outline" className="w-full mt-6">Load Older Activity</Button>
              </CardContent>
           </Card>
        </TabsContent>

        {/* Other Tab Placeholders */}
        {["branches", "tables", "menu", "qr", "loyalty", "support"].map(tab => (
           <TabsContent key={tab} value={tab} className="p-20 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                 <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="max-w-xs mx-auto">
                 <h3 className="text-lg font-bold capitalize">{tab.replace('_', ' ')} Management</h3>
                 <p className="text-sm text-muted-foreground">This section will display detailed {tab} data specifically for {CAFE_DATA.name}.</p>
              </div>
           </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
