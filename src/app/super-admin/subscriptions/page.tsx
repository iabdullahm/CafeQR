"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  Zap,
  Clock,
  Ban
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SUBSCRIPTIONS = [
  { id: "SUB-8402", cafe: "Coffee Haven", plan: "Premium", status: "active", billing: "Monthly", amount: "$99.00", startDate: "Jan 12, 2024", expiryDate: "Feb 12, 2025", paymentStatus: "paid", autoRenew: true },
  { id: "SUB-7291", cafe: "The Bean Sprout", plan: "Basic", status: "active", billing: "Yearly", amount: "$199.00", startDate: "Mar 05, 2024", expiryDate: "Mar 05, 2025", paymentStatus: "paid", autoRenew: true },
  { id: "SUB-1042", cafe: "Rustic Roast", plan: "Pro", status: "past_due", billing: "Monthly", amount: "$49.00", startDate: "Oct 20, 2023", expiryDate: "Nov 20, 2024", paymentStatus: "unpaid", autoRenew: false },
  { id: "SUB-3301", cafe: "Urban Brew", plan: "Enterprise", status: "active", billing: "Monthly", amount: "$249.00", startDate: "Jun 15, 2024", expiryDate: "Jul 15, 2025", paymentStatus: "paid", autoRenew: true },
  { id: "SUB-0052", cafe: "Zen Coffee", plan: "Pro", status: "canceled", billing: "Monthly", amount: "$49.00", startDate: "Apr 02, 2024", expiryDate: "May 02, 2024", paymentStatus: "refunded", autoRenew: false },
  { id: "SUB-9921", cafe: "Mountain Sips", plan: "Basic", status: "trial", billing: "Free", amount: "$0.00", startDate: "Oct 28, 2024", expiryDate: "Nov 11, 2024", paymentStatus: "n/a", autoRenew: false },
];

export default function SubscriptionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600 gap-1 font-bold"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
      case 'past_due': return <Badge variant="destructive" className="gap-1 font-bold bg-orange-600 hover:bg-orange-600"><AlertCircle className="h-3 w-3" /> Past Due</Badge>;
      case 'canceled': return <Badge variant="secondary" className="gap-1 font-bold"><Ban className="h-3 w-3" /> Canceled</Badge>;
      case 'trial': return <Badge variant="outline" className="gap-1 font-bold border-blue-500 text-blue-600 bg-blue-50"><Zap className="h-3 w-3" /> Trial</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-bold">Paid</Badge>;
      case 'unpaid': return <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-bold">Unpaid</Badge>;
      case 'refunded': return <Badge variant="outline" className="font-bold">Refunded</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">N/A</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform billing cycles, recurring revenue, and tenant plans.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <Button variant="outline" className="gap-2 bg-card">
              <RefreshCw className="h-4 w-4" /> Sync Gateway
           </Button>
           <Button variant="outline" className="gap-2 bg-card">
              <Download className="h-4 w-4" /> Export CSV
           </Button>
           <Button className="bg-primary hover:bg-primary/90">Billing Settings</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Monthly Revenue (MRR)
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-primary">$42,850.00</div>
               <p className="text-xs text-green-600 font-bold mt-1.5 flex items-center gap-1">
                  +4.2% <span className="text-muted-foreground font-medium text-[10px]">vs last month</span>
               </p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black">1,152</div>
               <p className="text-xs text-green-600 font-bold mt-1.5 flex items-center gap-1">
                  +18 <span className="text-muted-foreground font-medium text-[10px]">new today</span>
               </p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expired / Canceled</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-destructive">45</div>
               <p className="text-xs text-muted-foreground font-medium mt-1.5">3.8% Churn rate</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Free Trials</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-blue-600">84</div>
               <p className="text-xs text-blue-600 font-bold mt-1.5 flex items-center gap-1">
                  12% <span className="text-muted-foreground font-medium text-[10px]">conversion rate</span>
               </p>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/10">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search cafe name..." 
                      className="pl-10 h-10" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-10">
                       <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">All Status</SelectItem>
                       <SelectItem value="active">Active</SelectItem>
                       <SelectItem value="past_due">Past Due</SelectItem>
                       <SelectItem value="trial">Trial</SelectItem>
                       <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                 </Select>
                 <Select defaultValue="all">
                    <SelectTrigger className="w-[140px] h-10">
                       <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">All Plans</SelectItem>
                       <SelectItem value="basic">Basic</SelectItem>
                       <SelectItem value="pro">Pro</SelectItem>
                       <SelectItem value="premium">Premium</SelectItem>
                       <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                 </Select>
                 <Button variant="outline" size="icon" className="h-10 w-10">
                    <Filter className="h-4 w-4" />
                 </Button>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Sort by:</span>
                 <Select defaultValue="expiry">
                    <SelectTrigger className="w-[160px] h-10 bg-transparent border-none font-bold text-primary focus:ring-0">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="expiry">Expiry Date</SelectItem>
                       <SelectItem value="amount">Highest Amount</SelectItem>
                       <SelectItem value="newest">Newest First</SelectItem>
                       <SelectItem value="name">Cafe Name A-Z</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/30 hover:bg-muted/30">
                   <TableHead className="font-bold whitespace-nowrap px-6">Cafe & Subscription</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Plan Details</TableHead>
                   <TableHead className="font-bold whitespace-nowrap text-center">Amount</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Dates (Start/Expiry)</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Status</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Payment</TableHead>
                   <TableHead className="font-bold whitespace-nowrap text-center">Auto-Renew</TableHead>
                   <TableHead className="font-bold whitespace-nowrap text-right pr-6">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {SUBSCRIPTIONS.map((sub) => (
                   <TableRow key={sub.id} className="hover:bg-muted/10 group transition-colors">
                     <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                              <CreditCard className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-foreground leading-tight">{sub.cafe}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tight mt-0.5">{sub.id}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col">
                           <span className="font-bold text-sm">{sub.plan} Tier</span>
                           <span className="text-xs text-muted-foreground">{sub.billing} Billing</span>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <span className="font-black text-foreground">{sub.amount}</span>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col text-sm">
                           <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {sub.startDate}</span>
                           <span className="font-medium flex items-center gap-1.5 mt-1"><Clock className="h-3 w-3" /> {sub.expiryDate}</span>
                        </div>
                     </TableCell>
                     <TableCell>{getStatusBadge(sub.status)}</TableCell>
                     <TableCell>{getPaymentBadge(sub.paymentStatus)}</TableCell>
                     <TableCell className="text-center">
                        <div className="flex justify-center">
                           <Switch checked={sub.autoRenew} className="scale-75" />
                        </div>
                     </TableCell>
                     <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                           >
                              <ChevronRight className="h-5 w-5" />
                           </Button>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <MoreHorizontal className="h-4 w-4" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                 <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                                 <DropdownMenuItem className="gap-2">
                                    <Zap className="h-4 w-4" /> Change Plan
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2">
                                    <RefreshCw className="h-4 w-4" /> Manually Renew
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2">
                                    <Calendar className="h-4 w-4" /> Extend Expiry
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem className="gap-2">
                                    <CreditCard className="h-4 w-4" /> View Transactions
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2">
                                    <Download className="h-4 w-4" /> Download Latest Invoice
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem className="text-destructive gap-2 font-bold">
                                    <Ban className="h-4 w-4" /> Cancel Subscription
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
           
           <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Showing 6 of 1,152 active subscriptions</p>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" className="h-8 px-4 font-bold" disabled>Previous</Button>
                 <div className="flex items-center gap-1">
                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0 font-bold">1</Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 font-bold">2</Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 font-bold">3</Button>
                 </div>
                 <Button variant="outline" size="sm" className="h-8 px-4 font-bold">Next</Button>
              </div>
           </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="border-none shadow-sm bg-card">
            <CardHeader>
               <CardTitle className="text-lg">Subscription Churn Analysis</CardTitle>
               <CardDescription>Track subscription cancellations and reasons over time.</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] flex items-end justify-between gap-4 px-2">
               {[10, 15, 8, 12, 25, 18, 14, 20, 10, 5, 12, 8].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                     <div className="w-full bg-destructive/10 rounded-t-sm relative group" style={{ height: `${v * 4}%` }}>
                        <div className="absolute inset-x-0 bottom-0 bg-destructive/40 rounded-t-sm transition-all group-hover:bg-destructive" style={{ height: '30%' }} />
                     </div>
                     <span className="text-[10px] text-muted-foreground">M{i+1}</span>
                  </div>
               ))}
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardHeader>
               <CardTitle className="text-lg">Recent Failed Payments</CardTitle>
               <CardDescription>Accounts that require manual intervention or dunning.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {[
                    { name: "Rustic Roast", id: "SUB-1042", amount: "$49.00", reason: "Card Expired" },
                    { name: "Blue Sky Cafe", id: "SUB-2281", amount: "$99.00", reason: "Insufficient Funds" },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                       <div className="flex flex-col">
                          <span className="font-bold text-sm">{f.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">{f.id}</span>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-destructive">{f.amount}</p>
                          <p className="text-[10px] text-muted-foreground">{f.reason}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <Button variant="link" className="w-full mt-4 text-xs font-bold text-primary">View All Billing Alerts</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
