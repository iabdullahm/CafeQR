"use client";

import { useState, useMemo, useEffect } from "react";
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
  Ban,
  TrendingDown,
  ArrowDownRight,
  PauseCircle,
  PlayCircle,
  Undo2,
  RefreshCcw,
  CloudLightning
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function SubscriptionManagement() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedCafeForPlan, setSelectedCafeForPlan] = useState<any>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [newPlanSelection, setNewPlanSelection] = useState("free");

  // Postgres polling for subscriptions (the page calls them 'cafes' in vars).
  const [cafes, setCafes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {
    let alive = true;
    const tok = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = tok ? { Authorization: `Bearer ${tok}` } : undefined;
    const load = async () => {
      try {
        const res = await fetch('/api/super-admin/subscriptions', { headers, cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (alive && json.success && Array.isArray(json.data)) setCafes(json.data);
      } catch { /* ignore */ }
      finally { if (alive) setIsLoading(false); }
    };
    void load();
    const iv = setInterval(load, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, [])

  // Computed KPIs & Aggregations
  const { 
     totalMRR, 
     arr, 
     activeSubs, 
     trialCount, 
     canceledCount, 
     failedCount,
     avgARPU,
     chartData 
  } = useMemo(() => {
    if (!cafes) return { totalMRR: 0, arr: 0, activeSubs: 0, trialCount: 0, canceledCount: 0, failedCount: 0, avgARPU: 0, chartData: [] };
    
    let mrr = 0;
    let active = 0;
    let trial = 0;
    let canceled = 0;
    let failed = 0;

    // Build trend based on createdAt month for MRR logic
    const monthMap: Record<string, number> = {};

    cafes.forEach(c => {
      const plan = (c.subscription?.planId || c.plan || 'free').toLowerCase();
      const status = c.subscription?.status || 'active';
      const autoRenew = c.subscription?.autoRenew !== false;

      let subPrice = 0;
      if (plan === 'starter' || plan === 'basic') subPrice = 5;
      else if (plan === 'growth' || plan === 'popular') subPrice = 9;
      else if (plan === 'pro' || plan === 'business') subPrice = 15;

      if (c.isActive && status !== 'canceled') {
        if (subPrice > 0) {
          mrr += subPrice;
          active++;
        } else {
          trial++;
        }
      }

      if (status === 'canceled' || !c.isActive) canceled++;
      if (status === 'past_due' || status === 'unpaid') failed++;

      // Chart building logic (Simulate MRR trajectory)
      if (c.createdAt && subPrice > 0) {
         const d = new Date(c.createdAt);
         const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
         monthMap[key] = (monthMap[key] || 0) + subPrice;
      }
    });

    // Populate missing months up to current
    const sortedMonths = Object.keys(monthMap).sort();
    let cumulative = 0;
    const finalChartData = sortedMonths.map(m => {
       cumulative += monthMap[m];
       return { name: m, MRR: cumulative, New: monthMap[m] };
    });

    const arrVal = mrr * 12;
    const arpu = active > 0 ? (mrr / active).toFixed(1) : 0;

    return { 
       totalMRR: mrr, 
       arr: arrVal, 
       activeSubs: active, 
       trialCount: trial, 
       canceledCount: canceled, 
       failedCount: failed,
       avgARPU: Number(arpu),
       chartData: finalChartData.length ? finalChartData : [{name: 'Initial', MRR: 0, New: 0}]
    };
  }, [cafes]);

  // Filtering
  const filteredCafes = useMemo(() => {
    if (!cafes) return [];
    return cafes.filter(cafe => {
      const st = searchTerm.toLowerCase();
      const matchesSearch = cafe.name?.toLowerCase().includes(st) || cafe.email?.toLowerCase().includes(st);
      
      const subStatus = cafe.subscription?.status || (cafe.isActive ? 'active' : 'canceled');
      const matchesStatus = statusFilter === 'all' || subStatus === statusFilter;
      
      const cycle = cafe.subscription?.cycle || 'month';
      const matchesCycle = cycleFilter === 'all' || cycle === cycleFilter;

      const pStatus = cafe.subscription?.paymentStatus || (cafe.isActive ? 'paid' : 'failed');
      const matchesPayment = paymentFilter === 'all' || pStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesCycle && matchesPayment;
    });
  }, [cafes, searchTerm, statusFilter, cycleFilter, paymentFilter]);

  // Actions
  const handleToggleAutoRenew = async (id: string, current: boolean) => {
    if (!db) return;
    try {
      /* TODO: PATCH /api/super-admin/subscriptions/[id] endpoint */
      toast({ title: `Auto-renew turned ${!current ? 'on' : 'off'} successfully.` });
    } catch (e: any) {
      toast({ title: "Failed to update subscription", variant: "destructive" });
    }
  };

  const handleChangePlan = async () => {
    if (!db || !selectedCafeForPlan) return;
    setIsChangingPlan(true);
    try {
      /* TODO: PATCH /api/super-admin/subscriptions/[id] endpoint */
      toast({ title: `Plan successfully changed to ${newPlanSelection.toUpperCase()}` });
      setSelectedCafeForPlan(null);
    } catch (e: any) {
      toast({ title: "Failed to update plan", variant: "destructive" });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const getStatusBadge = (row: any) => {
    const status = row.subscription?.status || (row.isActive ? 'active' : 'canceled');
    const plan = (row.subscription?.planId || row.plan || 'free').toLowerCase();
    
    if (status === 'canceled') return <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none font-bold"><Ban className="h-3 w-3 mr-1" /> Canceled</Badge>;
    if (status === 'past_due') return <Badge variant="destructive" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none font-bold"><AlertCircle className="h-3 w-3 mr-1" /> Past Due</Badge>;
    if (status === 'grace_period') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold"><Clock className="h-3 w-3 mr-1" /> Grace Period</Badge>;
    
    if (plan === 'free' || plan === 'trial') return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 font-bold"><Zap className="h-3 w-3 mr-1" /> Trial</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>;
  };

  const getPaymentBadge = (row: any) => {
    const pStatus = row.subscription?.paymentStatus || (row.isActive ? 'paid' : 'failed');
    
    if (pStatus === 'paid') return <div className="flex flex-col"><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">Paid</Badge><span className="text-[10px] text-muted-foreground mt-1">Retry: 0/3</span></div>;
    if (pStatus === 'failed') return <div className="flex flex-col"><Badge variant="destructive" className="w-fit">Failed</Badge><span className="text-[10px] text-destructive mt-1 font-bold">Retry: 3/3 (Max)</span></div>;
    if (pStatus === 'retrying') return <div className="flex flex-col"><Badge className="bg-orange-100 text-orange-700 border-orange-200 w-fit" variant="outline"><RefreshCcw className="h-3 w-3 mr-1 animate-spin" /> Retrying</Badge><span className="text-[10px] text-orange-600 mt-1">Attempt: 1/3</span></div>;
    if (pStatus === 'pending') return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 w-fit">Pending</Badge>;
    
    return <Badge variant="outline" className="text-muted-foreground w-fit">N/A</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-2">
             <CreditCard className="h-8 w-8 text-primary" /> Billing Engine
          </h1>
          <p className="text-muted-foreground mt-1">SaaS Revenue Control Panel & Subscription Lifecycle Management.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <Button variant="outline" className="gap-2 bg-card border-indigo-100 text-indigo-700 hover:bg-indigo-50">
              <CloudLightning className="h-4 w-4" /> Sync Stripe
              <span className="text-[10px] font-mono text-muted-foreground ml-2 border-l pl-2 border-indigo-200">Just now</span>
           </Button>
           <Button variant="outline" className="gap-2 bg-card">
              <Download className="h-4 w-4" /> Export CSV
           </Button>
           <Button className="bg-primary hover:bg-primary/90">Billing Settings</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
         <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-primary/5">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                  MRR
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-indigo-700">{totalMRR.toLocaleString()} <span className="text-sm font-normal text-indigo-600/70">OMR</span></div>
               <p className="text-xs text-indigo-800 font-bold mt-1.5 flex items-center gap-1">
                  ARR: <span className="font-mono">{arr.toLocaleString()} OMR</span>
               </p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card transition-shadow">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Paid Subs</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-emerald-600">{activeSubs}</div>
               <p className="text-xs text-muted-foreground font-bold mt-1.5 flex items-center gap-1">
                  ARPU: {avgARPU} OMR
               </p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card transition-shadow">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Failed / Past Due</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-red-600">{failedCount}</div>
               <p className="text-xs text-red-600/80 font-bold mt-1.5 flex items-center gap-1">
                  Requires immediate action
               </p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Canceled (Churn)</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-zinc-700">{canceledCount}</div>
               <p className="text-xs text-muted-foreground font-medium mt-1.5">
                  Est. {(cafes && cafes.length > 0) ? ((canceledCount / cafes.length)*100).toFixed(1) : 0}% Churn rate
               </p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trial Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-blue-600">{trialCount}</div>
               <p className="text-xs text-muted-foreground font-medium mt-1.5">Potential revenue expansion</p>
            </CardContent>
         </Card>
      </div>

      {/* Revenue Graph */}
      <Card className="border-none shadow-sm bg-card">
         <CardHeader>
            <CardTitle className="text-lg">MRR Growth Trend</CardTitle>
            <CardDescription>Monthly Recurring Revenue over time</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} />
                   <YAxis axisLine={false} tickLine={false} tickMargin={10} fontSize={12} domain={['auto', 'auto']} />
                   <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                   <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                   <Area type="monotone" dataKey="MRR" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorMRR)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </CardContent>
      </Card>

      {/* TABLE SECTION */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/10 pb-4">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap gap-2 w-full">
                 <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search tenant..." 
                      className="pl-10 h-10 border-none bg-background focus-visible:ring-1 focus-visible:ring-primary/30" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 
                 <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-[150px] h-10 border-none bg-background">
                       <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">All Payments</SelectItem>
                       <SelectItem value="paid">Paid</SelectItem>
                       <SelectItem value="failed">Failed / Past Due</SelectItem>
                       <SelectItem value="retrying">Retrying</SelectItem>
                    </SelectContent>
                 </Select>

                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px] h-10 border-none bg-background">
                       <SelectValue placeholder="Lifecycle" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">All Lifecycle</SelectItem>
                       <SelectItem value="active">Active</SelectItem>
                       <SelectItem value="trial">Trial</SelectItem>
                       <SelectItem value="grace_period">Grace Period</SelectItem>
                       <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                 </Select>
                 
                 <Select value={cycleFilter} onValueChange={setCycleFilter}>
                    <SelectTrigger className="w-[140px] h-10 border-none bg-background">
                       <SelectValue placeholder="Billing Cycle" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">All Cycles</SelectItem>
                       <SelectItem value="month">Monthly</SelectItem>
                       <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           {isLoading ? (
             <div className="h-64 flex items-center justify-center text-muted-foreground font-medium">Fetching billing records...</div>
           ) : filteredCafes.length === 0 ? (
             <div className="h-64 flex items-center justify-center text-muted-foreground">No subscriptions match your filters.</div>
           ) : (
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                     <TableHead className="font-bold whitespace-nowrap px-6">Tenant & Subscription</TableHead>
                     <TableHead className="font-bold whitespace-nowrap">Plan Tier</TableHead>
                     <TableHead className="font-bold whitespace-nowrap text-center">Cycle & Amount</TableHead>
                     <TableHead className="font-bold whitespace-nowrap">Billing Dates</TableHead>
                     <TableHead className="font-bold whitespace-nowrap">Lifecycle</TableHead>
                     <TableHead className="font-bold whitespace-nowrap">Payment Health</TableHead>
                     <TableHead className="font-bold whitespace-nowrap text-center">Auto-Renew</TableHead>
                     <TableHead className="font-bold whitespace-nowrap text-right pr-6">Management</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredCafes.map((cafe) => {
                     const sub = cafe.subscription || {};
                     const autoRenew = sub.autoRenew !== false; // default true
                     
                     const pName = (sub.planId || cafe.plan || 'Free').toLowerCase();
                     let planAmount = "0";
                     let displayPlan = pName;
                     if (pName === 'starter' || pName === 'basic') { planAmount = "5"; displayPlan = "Basic"; }
                     else if (pName === 'growth' || pName === 'popular') { planAmount = "9"; displayPlan = "Popular"; }
                     else if (pName === 'pro' || pName === 'business') { planAmount = "15"; displayPlan = "Business"; }
                     else if (pName === 'free') { displayPlan = "Free"; }

                     return (
                       <TableRow key={cafe.id} className="hover:bg-muted/10 group transition-colors cursor-pointer" onClick={() => router.push(`/super-admin/cafes/${cafe.id}`)}>
                         <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                  {cafe.name?.substring(0, 2).toUpperCase()}
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-bold text-foreground leading-tight">{cafe.name}</span>
                                  {sub.discount && <Badge variant="secondary" className="h-4 text-[9px] mt-1 bg-fuchsia-100 text-fuchsia-700 w-fit">{sub.discount} APPLIED</Badge>}
                               </div>
                            </div>
                         </TableCell>
                         <TableCell>
                            <div className="flex flex-col">
                               <span className="font-bold text-sm uppercase">{displayPlan}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                               <span className="font-black text-foreground">{planAmount} OMR</span>
                               <span className="text-xs text-muted-foreground capitalize">{sub.cycle || 'Monthly'}</span>
                            </div>
                         </TableCell>
                         <TableCell>
                            <div className="flex flex-col text-sm gap-1">
                               <span className="text-muted-foreground flex items-center gap-1.5 text-xs"><CheckCircle2 className="h-3 w-3" /> Last: {formatDate(sub.lastPaymentDate || cafe.createdAt)}</span>
                               <span className="font-medium flex items-center gap-1.5 text-xs"><Clock className="h-3 w-3" /> Next: {formatDate(sub.nextBillingDate)}</span>
                            </div>
                         </TableCell>
                         <TableCell>{getStatusBadge(cafe)}</TableCell>
                         <TableCell onClick={(e) => e.stopPropagation()}>{getPaymentBadge(cafe)}</TableCell>
                         <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                               <Switch 
                                  checked={autoRenew} 
                                  onCheckedChange={() => handleToggleAutoRenew(cafe.id, autoRenew)}
                                  className="scale-75" 
                               />
                            </div>
                         </TableCell>
                         <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                     <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-56 font-medium">
                                  <DropdownMenuLabel>Billing Actions</DropdownMenuLabel>
                                  <DropdownMenuItem 
                                    className="gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                    onClick={() => { setSelectedCafeForPlan(cafe); setNewPlanSelection(pName); }}
                                  >
                                     <ArrowUpRight className="h-4 w-4" /> Change Plan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 cursor-pointer">
                                     <PauseCircle className="h-4 w-4" /> Pause Subscription
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 cursor-pointer">
                                     <RefreshCw className="h-4 w-4" /> Force Renew Now
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 cursor-pointer">
                                     <Undo2 className="h-4 w-4" /> Issue Refund
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 cursor-pointer">
                                     <Download className="h-4 w-4" /> Download Latest Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive gap-2 font-bold cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
                                     <Ban className="h-4 w-4" /> Cancel Subscription
                                  </DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
             </div>
           )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCafeForPlan} onOpenChange={(open) => !open && setSelectedCafeForPlan(null)}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Change Subscription Plan</DialogTitle>
               <DialogDescription>
                  Modify the billing plan for {selectedCafeForPlan?.name}.
               </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label>Select New Tier</Label>
                  <Select value={newPlanSelection} onValueChange={setNewPlanSelection}>
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="free">Free (0 OMR)</SelectItem>
                        <SelectItem value="starter">Basic (5 OMR)</SelectItem>
                        <SelectItem value="growth">Popular (9 OMR)</SelectItem>
                        <SelectItem value="pro">Business (15 OMR)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter>
               <Button disabled={isChangingPlan} onClick={handleChangePlan} className="w-full">
                  {isChangingPlan ? "Saving..." : "Confirm Plan Change"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
