"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  MoreVertical,
  Download,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  ArrowRightLeft,
  CalendarDays,
  Shield,
  Briefcase,
  Store,
  Wallet
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// --- MOCK DATA ---
const SUMMARY_STATS = [
  { title: "Total Revenue", value: "0.000 OMR", desc: "No revenue yet", icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
  { title: "Monthly Reccurring", value: "0.000 OMR", desc: "No subscriptions yet", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Pending Payments", value: "0", desc: "0.000 OMR pending", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  { title: "Failed Payments", value: "0", desc: "No failed payments", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  { title: "Active Subs", value: "0", desc: "No active subscriptions", icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
  { title: "Expired Subs", value: "0", desc: "No expired subscriptions", icon: Shield, color: "text-muted-foreground", bg: "bg-secondary" },
];

const MOCK_PAYMENTS: any[] = [];

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">Paid</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200 shadow-none">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 shadow-none">Failed</Badge>;
    default:
      return <Badge variant="secondary" className="shadow-none">{status}</Badge>;
  }
};

const getPlanBadge = (plan: string) => {
  switch (plan.toLowerCase()) {
    case "starter":
      return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50 shadow-none">Starter</Badge>;
    case "growth":
      return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 shadow-none">Growth</Badge>;
    case "pro":
      return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50/50 shadow-none">Pro</Badge>;
    case "enterprise":
      return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50/50 shadow-none">Enterprise</Badge>;
    default:
      return <Badge variant="outline" className="shadow-none">{plan}</Badge>;
  }
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const viewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Payment Management</h1>
        <p className="text-muted-foreground mt-1">Supervise billing, subscriptions, and transactions across the platform.</p>
      </div>

      {/* SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {SUMMARY_STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card overflow-hidden">
             <CardContent className="p-5 flex flex-col gap-3">
               <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                 <h3 className="text-2xl font-black text-foreground mt-1 tracking-tight">{stat.value}</h3>
               </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* MAIN DATA TABLE CARD */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Platform Transactions</CardTitle>
              <CardDescription className="mt-1 pb-1">All invoices and payments processed by CafeQR.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="h-9">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cafe or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background focus-visible:ring-primary/20"
              />
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" className="h-9 px-3">
              <Filter className="mr-2 h-4 w-4" /> Advanced
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold px-6 w-[120px]">Invoice No.</TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Cafe / Sub</TableHead>
                  <TableHead className="font-semibold text-right">Amount (OMR)</TableHead>
                  <TableHead className="font-semibold">Method</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-right flex-1 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PAYMENTS.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                           <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                           <p>No payments found.</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : (
                  MOCK_PAYMENTS.map((payment) => (
                    <TableRow key={payment.id} className="cursor-pointer group hover:bg-muted/10">
                      <TableCell className="px-6 font-medium text-muted-foreground">{payment.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{payment.cafeName}</span>
                          <div className="flex items-center gap-2">
                             {getPlanBadge(payment.plan)}
                             {payment.autoRenew && <RefreshCw className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-black tabular-nums">{payment.amount.toFixed(3)}</TableCell>
                      <TableCell>
                         <span className="text-sm font-medium text-muted-foreground">{payment.method}</span>
                      </TableCell>
                      <TableCell className="text-center">
                         {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                            <span className="text-sm">{payment.paymentDate !== "-" ? payment.paymentDate : "Not Paid"}</span>
                            <span className="text-xs text-muted-foreground">Expires {payment.expiryDate}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-80 group-hover:opacity-100">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => viewDetails(payment)} className="cursor-pointer">
                               <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                               <Download className="mr-2 h-4 w-4" /> Download Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {payment.status === "pending" && (
                              <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-50">
                                 <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {payment.status === "failed" && (
                              <DropdownMenuItem className="cursor-pointer">
                                 <RefreshCw className="mr-2 h-4 w-4" /> Resend Payment Link
                              </DropdownMenuItem>
                            )}
                            {payment.status === "paid" && (
                               <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                  <ArrowRightLeft className="mr-2 h-4 w-4" /> Refund Payment
                               </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                               <CalendarDays className="mr-2 h-4 w-4" /> Extend Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PAYMENT DETAILS DRAWER */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg border-l overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="h-10 w-10 flex border rounded-xl items-center justify-center bg-muted/30">
                  <CreditCard className="h-5 w-5 text-primary" />
               </div>
               <div>
                  <SheetTitle className="text-xl">{selectedPayment?.id}</SheetTitle>
                  <SheetDescription>Transaction Details</SheetDescription>
               </div>
            </div>
          </SheetHeader>

          {selectedPayment && (
            <div className="space-y-8">
               
              {/* STATUS BANNER */}
              <div className="rounded-xl border bg-muted/20 p-4">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    {getStatusBadge(selectedPayment.status)}
                 </div>
                 <div className="flex items-end justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Amount</span>
                    <span className="text-3xl font-black">{selectedPayment.amount.toFixed(3)} OMR</span>
                 </div>
                 {selectedPayment.status === "pending" && (
                   <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button className="w-full bg-green-600 hover:bg-green-700">Approve Payment</Button>
                      <Button variant="outline" className="w-full">Send Link</Button>
                   </div>
                 )}
              </div>

               {/* CAFE & SUB INFO */}
               <div className="space-y-4">
                 <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Customer Information</h4>
                 <Card className="border-none bg-muted/20 shadow-none">
                    <CardContent className="p-4 space-y-3">
                       <div className="flex items-center gap-3">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{selectedPayment.cafeName}</span>
                       </div>
                       <Separator />
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Plan</p>
                            {getPlanBadge(selectedPayment.plan)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Auto Renew</p>
                            <span className="text-sm font-medium">{selectedPayment.autoRenew ? "Enabled" : "Disabled"}</span>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
               </div>

               {/* BILLING TIMELINE */}
               <div className="space-y-4">
                 <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Billing Cycle</h4>
                 <div className="space-y-4 pl-2">
                    <div className="relative border-l-2 border-primary/30 pl-6 pb-4">
                       <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                       <p className="text-sm font-bold leading-none mb-1">Coverage Start</p>
                       <p className="text-xs text-muted-foreground">{selectedPayment.period.split(" - ")[0]}</p>
                    </div>
                    <div className="relative border-l-2 border-transparent pl-6">
                       <div className={`absolute -left-[5px] top-0 h-2 w-2 rounded-full ${selectedPayment.status === 'paid' ? 'bg-muted-foreground' : 'bg-orange-500'}`} />
                       <p className="text-sm font-bold leading-none mb-1">Exipry Date</p>
                       <p className="text-xs text-muted-foreground">{selectedPayment.expiryDate}</p>
                    </div>
                 </div>
               </div>

               {/* GATEWAY RESP */}
               <div className="space-y-4">
                 <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Gateway Details</h4>
                 <div className="rounded-lg border bg-card text-sm">
                    <div className="grid grid-cols-2 p-3 border-b">
                       <span className="text-muted-foreground">Provider</span>
                       <span className="font-medium text-right font-mono">Thawani</span>
                    </div>
                    <div className="grid grid-cols-2 p-3 border-b">
                       <span className="text-muted-foreground">Method</span>
                       <span className="font-medium text-right">{selectedPayment.method}</span>
                    </div>
                    <div className="grid grid-cols-2 p-3">
                       <span className="text-muted-foreground">Transaction ID</span>
                       <span className="font-medium text-right font-mono text-xs">tx_98f82a9b1c2</span>
                    </div>
                 </div>
               </div>
               
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
