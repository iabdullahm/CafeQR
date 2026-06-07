"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { SectionHeader } from "@/components/dashboard/section-header";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Download, Search, ChevronRight, Coffee, ShoppingBag, Star, Phone, Heart, MessageCircle, Crown, Gift, TrendingUp, Clock, Activity } from "lucide-react";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function CustomersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [impersonatedCafeId, setImpersonatedCafeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  
  // Real implementation for profile
  const cafeId = impersonatedCafeId || profile?.cafeId || (user ? localStorage.getItem('cafe_id_fallback') : null) || 'CAF-1776742784566'; // fallback for demo
  
  // Postgres polling — replaces the old Firestore subscription.
  const [customers, setCustomers] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {
    if (!cafeId) return;
    let alive = true;
    const fetchCustomers = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        const res = await fetch(`/api/cafes/${cafeId}/customers?limit=300`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!alive) return;
        if (json.success && Array.isArray(json.data)) setCustomers(json.data);
      } catch { /* ignore */ }
      finally { if (alive) setIsLoading(false); }
    };
    void fetchCustomers();
    const iv = setInterval(fetchCustomers, 10000);
    return () => { alive = false; clearInterval(iv); };
  }, [cafeId]);
  
  const loyaltyConfigRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'loyalty') : null, [db, cafeId]);
  const { data: loyaltyConfig } = useDoc(loyaltyConfigRef);
  const cupsReq = loyaltyConfig?.cupsReq || 5;

  // Fake or aggregated data generation for intelligence
  const getCustomerIntelligence = (c: any) => {
    const isVIP = c.totalOrders >= 10;
    const isReturning = c.totalOrders > 2 && c.totalOrders < 10;
    const isNew = c.totalOrders <= 2 && !c.isGuest;
    const isGuest = c.isGuest;
    
    // Loyalty syncs from root customers collection now
    const cups = c.cups || 0;
    const rewardReady = cups === 0 && (c.rewardsEarned > (c.rewardsRedeemed || 0));
    
    let status = "Guest";
    if (isVIP) status = "VIP";
    else if (rewardReady) status = "Reward Ready";
    else if (isReturning) status = "Returning";
    else if (isNew) status = "New";

    return { status, cups, isVIP, rewardReady };
  };

  // KPIs
  const { totalCustomers, returningRate, activeLoyaltyRate, topCustomerSpend } = useMemo(() => {
    if (!customers || customers.length === 0) return { totalCustomers: 0, returningRate: 0, activeLoyaltyRate: 0, topCustomerSpend: 0 };
    
    let returning = 0;
    let loyalty = 0;
    let topSpend = 0;
    
    customers.forEach(c => {
      if (c.totalOrders > 2) returning++;
      if (c.phone && !c.isGuest) loyalty++;
      if (c.totalSpent > topSpend) topSpend = c.totalSpent;
    });

    return {
      totalCustomers: customers.length,
      returningRate: Math.round((returning / customers.length) * 100),
      activeLoyaltyRate: Math.round((loyalty / customers.length) * 100),
      topCustomerSpend: topSpend
    };
  }, [customers]);

  // Filtering
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => {
      const intel = getCustomerIntelligence(c);
      const matchesSearch = 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.id?.includes(searchTerm);
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "vip" && intel.status === "VIP") ||
        (statusFilter === "returning" && intel.status === "Returning") ||
        (statusFilter === "reward" && intel.status === "Reward Ready") ||
        (statusFilter === "new" && intel.status === "New") ||
        (statusFilter === "guest" && intel.status === "Guest");
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const exportCSV = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) return;
    const header = "Phone,Name,Total Orders,Total Spent,Status,Last Order\n";
    const csv = filteredCustomers.map(c => 
      `"${c.phone || 'Guest'}","${c.name || 'Unknown'}","${c.totalOrders}","${c.totalSpent}","${getCustomerIntelligence(c).status}","${new Date(c.lastVisit?.toDate() || c.createdAt?.toDate() || Date.now()).toLocaleString()}"`
    ).join("\n");
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const columns = [
    {
      key: "customer",
      label: "Customer",
      render: (row: any) => {
        const displayName = row.name === 'Unknown' || row.name === 'Guest User' ? (row.phone ? `Customer #${row.id?.slice(-4)}` : 'Guest Customer') : row.name;
        const initial = displayName.substring(0,2).toUpperCase();
        const intel = getCustomerIntelligence(row);
        
        return (
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-sm border", intel.isVIP ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-primary/10 text-primary border-primary/20")}>
              {intel.isVIP ? <Crown className="w-5 h-5" /> : initial}
            </div>
            <div>
              <p className="font-bold text-sm text-zinc-900">{displayName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> {row.phone || 'No phone provided'}
              </p>
            </div>
          </div>
        );
      }
    },
    {
      key: "orders",
      label: "Orders",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs">
            {row.totalOrders || 0}
          </div>
        </div>
      )
    },
    {
      key: "spent",
      label: "Total Spent",
      render: (row: any) => (
        <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
          {Number(row.totalSpent || 0).toFixed(3)} OMR
        </span>
      )
    },
    {
      key: "loyalty",
      label: "Loyalty",
      render: (row: any) => {
        if (row.isGuest || !row.phone) return <span className="text-xs text-zinc-400">Not active</span>;
        const intel = getCustomerIntelligence(row);
        const progress = Math.min(((intel.cups || 0) / cupsReq) * 100, 100);
        
        return (
          <div className="flex flex-col w-24">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-amber-700">{intel.cups || 0} / {cupsReq} <Coffee className="w-3 h-3 inline pb-0.5" /></span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const intel = getCustomerIntelligence(row);
        let badgeClass = "bg-zinc-100 text-zinc-600";
        if (intel.status === "VIP") badgeClass = "bg-gradient-to-r from-amber-200 to-amber-300 text-amber-900 border-amber-400 font-bold shadow-sm";
        else if (intel.status === "Reward Ready") badgeClass = "bg-rose-100 text-rose-700 border-rose-200 font-bold animate-pulse";
        else if (intel.status === "Returning") badgeClass = "bg-blue-100 text-blue-700 border-blue-200";
        else if (intel.status === "New") badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200";

        return (
          <Badge variant="outline" className={cn("shadow-none border", badgeClass)}>
            {intel.status === "Reward Ready" && <Gift className="w-3 h-3 mr-1" />}
            {intel.status}
          </Badge>
        );
      }
    },
    {
      key: "lastOrder",
      label: "Last Activity",
      render: (row: any) => {
        const diffDays = Math.floor((new Date().getTime() - new Date(row.lastOrderDate).getTime()) / (1000 * 3600 * 24));
        const timeStr = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
        
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="w-3 h-3" /> {timeStr}
          </div>
        )
      }
    },
    {
      key: "action",
      label: "",
      className: "text-right w-[120px]",
      render: (row: any) => (
        <Button size="sm" onClick={() => { setSelectedCustomer(row); setIsDrawerOpen(true); }} className="w-full gap-2 rounded-xl text-xs font-bold transition-transform active:scale-95 group-hover:bg-primary group-hover:text-primary-foreground">
          View Profile <ChevronRight className="w-3 h-3" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in max-w-[1400px] mx-auto pb-20">
      <SectionHeader 
        title="Customer Intelligence" 
        description="Analyze customer behavior, manage profiles, and track loyalty progress."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2 bg-white rounded-xl">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 rounded-xl">
              <UserPlus className="w-4 h-4" /> Add Customer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-primary" /> Total Customers</p>
            <p className="text-3xl font-black text-zinc-900">{totalCustomers}</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Returning Rate</p>
            <div className="flex items-end gap-2">
               <p className="text-3xl font-black text-blue-600">{returningRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-amber-50/50">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-amber-500" /> Active Loyalty</p>
            <p className="text-3xl font-black text-amber-600">{activeLoyaltyRate}%</p>
          </CardContent>
        </Card>
        <Card className="border border-emerald-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-emerald-500" /> Top Spend</p>
            <p className="text-3xl font-black text-emerald-700">{Number(topCustomerSpend).toFixed(3)} OMR</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-2 bg-white p-3 rounded-2xl shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, phone..." 
            className="pl-10 h-10 border-none bg-zinc-50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 border-none bg-zinc-50 rounded-xl font-bold text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="reward">Reward Ready</SelectItem>
              <SelectItem value="returning">Returning</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Adding a custom wrapper around DataTable to support row hover effects */}
      <div className="[&_tr]:group [&_tr]:cursor-pointer [&_tr:hover]:bg-zinc-50">
        <DataTableReusable 
          columns={columns} 
          data={filteredCustomers} 
          isLoading={isLoading} 
        />
      </div>

      {/* ENHANCED CUSTOMER DETAILS DRAWER */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto p-0 border-l-0 shadow-2xl">
          {selectedCustomer && (() => {
            const intel = getCustomerIntelligence(selectedCustomer);
            const displayName = selectedCustomer.name === 'Unknown' || selectedCustomer.name === 'Guest User' ? (selectedCustomer.phone ? `Customer #${selectedCustomer.id?.slice(-4)}` : 'Guest Customer') : selectedCustomer.name;
            const initial = displayName.substring(0,2).toUpperCase();
            
            return (
              <>
                <SheetHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50 sticky top-0 z-10 backdrop-blur-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm border", intel.isVIP ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-primary/10 text-primary border-primary/20 bg-white")}>
                        {intel.isVIP ? <Crown className="w-8 h-8" /> : initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <SheetTitle className="text-xl font-black text-zinc-900">{displayName}</SheetTitle>
                           {intel.isVIP && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 font-bold text-[10px]">VIP</Badge>}
                        </div>
                        <p className="text-sm font-bold text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="w-3.5 h-3.5" /> {selectedCustomer.phone || 'No Phone Registered'}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium mt-1">ID: {selectedCustomer.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-2">
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="flex-1 gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl bg-white shadow-sm font-bold"
                       onClick={() => {
                         if (selectedCustomer.phone) {
                           let p = selectedCustomer.phone.replace(/\D/g, '');
                           if (p.length === 8) p = `968${p}`;
                           window.open(`https://wa.me/${p}`, '_blank');
                         } else {
                           toast({ title: "No Phone Number", description: "This customer does not have a registered phone number.", variant: "destructive" });
                         }
                       }}
                     >
                       <MessageCircle className="w-4 h-4" /> Message
                     </Button>
                  </div>
                </SheetHeader>

                <div className="p-6 space-y-8">
                  {/* BEHAVIOR INTELLIGENCE */}
                  <div className="space-y-3">
                    <h3 className="font-bold flex items-center gap-2 text-sm text-zinc-800"><Activity className="w-4 h-4 text-blue-500" /> Customer Behavior</h3>
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Favorite Item</p>
                          <p className="text-sm font-bold text-zinc-900">Latte <span className="text-zinc-400 font-medium text-xs">(Est.)</span></p>
                       </div>
                       <div>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Order Time</p>
                          <p className="text-sm font-bold text-zinc-900">Evening <span className="text-zinc-400 font-medium text-xs">(Est.)</span></p>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 shadow-sm">
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Orders</p>
                       <p className="text-2xl font-black mt-1 text-zinc-900">{selectedCustomer.totalOrders}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                       <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Total Spent</p>
                       <p className="text-2xl font-black mt-1 text-emerald-700">{Number(selectedCustomer.totalSpent || 0).toFixed(3)}</p>
                    </div>
                  </div>

                  {selectedCustomer.phone && !selectedCustomer.isGuest && (
                    <div className="space-y-3">
                      <h3 className="font-bold flex items-center gap-2 text-sm text-zinc-800"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Loyalty Progress</h3>
                      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
                        {intel.rewardReady && (
                          <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                            Reward Ready!
                          </div>
                        )}
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="text-lg font-black text-amber-900">{intel.cups} / {cupsReq} Cups</p>
                            <p className="text-xs font-bold text-amber-700 mt-0.5">{cupsReq - intel.cups} more to free coffee</p>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-white rounded-full p-0.5 border border-amber-200 shadow-inner">
                           <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((intel.cups / cupsReq) * 100, 100)}%` }} />
                        </div>
                        {intel.rewardReady && (
                          <Button className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shadow-md rounded-xl">
                            <Gift className="w-4 h-4 mr-2" /> Redeem Reward
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* RECENT ORDERS MOCKUP */}
                  <div className="space-y-3">
                    <h3 className="font-bold flex items-center gap-2 text-sm text-zinc-800"><ShoppingBag className="w-4 h-4 text-primary" /> Recent Orders</h3>
                    <div className="space-y-2">
                       <div className="bg-white border border-zinc-100 p-3 rounded-xl shadow-sm flex items-center justify-between hover:border-zinc-200 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-zinc-900">#1045 - Dine In</p>
                            <p className="text-xs text-zinc-500 font-medium">1x Latte, 1x Croissant</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">1.800 OMR</p>
                            <p className="text-[10px] text-zinc-400 font-bold">2 days ago</p>
                          </div>
                       </div>
                       <div className="bg-white border border-zinc-100 p-3 rounded-xl shadow-sm flex items-center justify-between hover:border-zinc-200 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-zinc-900">#1032 - Car Service</p>
                            <p className="text-xs text-zinc-500 font-medium">1x Espresso, 1x Water</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">1.200 OMR</p>
                            <p className="text-[10px] text-zinc-400 font-bold">5 days ago</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold flex items-center gap-2 text-sm text-zinc-800"><Coffee className="w-4 h-4 text-zinc-400" /> Internal Notes</h3>
                    <Textarea placeholder="E.g. Prefers less sugar, usually orders pickup..." className="bg-zinc-50 border-zinc-200 resize-none rounded-xl h-24 focus-visible:ring-primary/30" />
                    <Button size="sm" variant="secondary" className="w-full rounded-xl font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700">Save Note</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ADD CUSTOMER MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Add Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Phone Number *</Label>
              <Input placeholder="e.g. 96891234567" className="rounded-xl h-12 bg-zinc-50 border-zinc-200" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Full Name (Optional)</Label>
              <Input placeholder="Customer Name" className="rounded-xl h-12 bg-zinc-50 border-zinc-200" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Notes (Optional)</Label>
              <Textarea placeholder="Any preferences..." className="rounded-xl bg-zinc-50 border-zinc-200" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-bold">Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
