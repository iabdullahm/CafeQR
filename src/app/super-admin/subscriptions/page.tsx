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
import { Search, Filter, Calendar, CreditCard, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

const SUBSCRIPTIONS = [
  { id: "sub_01", cafe: "Coffee Haven", plan: "Premium", status: "active", billing: "Monthly", amount: "$99.00", nextBilling: "May 12, 2024", autoRenew: true },
  { id: "sub_02", cafe: "The Bean Sprout", plan: "Basic", status: "active", billing: "Yearly", amount: "$199.00", nextBilling: "Jan 05, 2025", autoRenew: true },
  { id: "sub_03", cafe: "Rustic Roast", plan: "Pro", status: "past_due", billing: "Monthly", amount: "$49.00", nextBilling: "Apr 01, 2024", autoRenew: false },
  { id: "sub_04", cafe: "Urban Brew", plan: "Enterprise", status: "active", billing: "Monthly", amount: "$249.00", nextBilling: "May 15, 2024", autoRenew: true },
  { id: "sub_05", cafe: "Zen Coffee", plan: "Pro", status: "canceled", billing: "Monthly", amount: "$49.00", nextBilling: "-", autoRenew: false },
];

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600 gap-1 font-bold"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
      case 'past_due': return <Badge variant="destructive" className="gap-1 font-bold"><AlertCircle className="h-3 w-3" /> Past Due</Badge>;
      case 'canceled': return <Badge variant="secondary" className="gap-1 font-bold">Canceled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground mt-1">Monitor billing cycles, recurring revenue, and churn.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Sync Stripe
           </Button>
           <Button className="bg-primary hover:bg-primary/90">Billing Reports</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">MRR (Monthly Recurring Revenue)</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">$42,850.00</div>
               <p className="text-xs text-green-600 font-bold mt-1">+4.2% from last month</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">1,150</div>
               <p className="text-xs text-green-600 font-bold mt-1">+12 new today</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Average Revenue Per User</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">$37.26</div>
               <p className="text-xs text-muted-foreground font-medium mt-1">Across all tiers</p>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                 {["all", "active", "past_due", "canceled"].map((tab) => (
                   <Button 
                    key={tab}
                    variant={activeTab === tab ? "default" : "ghost"}
                    size="sm"
                    className="capitalize text-xs font-bold px-4"
                    onClick={() => setActiveTab(tab)}
                   >
                     {tab.replace('_', ' ')}
                   </Button>
                 ))}
              </div>
              <div className="relative w-full md:w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search subscription ID or cafe..." className="pl-10" />
              </div>
           </div>
        </CardHeader>
        <CardContent>
           <Table>
             <TableHeader>
               <TableRow className="bg-muted/50">
                 <TableHead className="font-bold">ID & Cafe</TableHead>
                 <TableHead className="font-bold">Plan Details</TableHead>
                 <TableHead className="font-bold">Status</TableHead>
                 <TableHead className="font-bold">Amount</TableHead>
                 <TableHead className="font-bold">Next Billing</TableHead>
                 <TableHead className="font-bold text-right">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {SUBSCRIPTIONS.map((sub) => (
                 <TableRow key={sub.id} className="hover:bg-muted/20">
                   <TableCell>
                      <div className="flex flex-col">
                         <span className="font-bold">{sub.cafe}</span>
                         <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tight">{sub.id}</span>
                      </div>
                   </TableCell>
                   <TableCell>
                      <div className="flex flex-col">
                         <span className="font-medium text-sm">{sub.plan}</span>
                         <span className="text-xs text-muted-foreground">{sub.billing} Billing</span>
                      </div>
                   </TableCell>
                   <TableCell>{getStatusBadge(sub.status)}</TableCell>
                   <TableCell>
                      <span className="font-bold text-foreground">{sub.amount}</span>
                   </TableCell>
                   <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                         <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                         <span className="font-medium">{sub.nextBilling}</span>
                      </div>
                   </TableCell>
                   <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                         <ChevronRight className="h-4 w-4" />
                      </Button>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
