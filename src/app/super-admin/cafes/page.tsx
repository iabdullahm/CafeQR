"use client";

import { useState, useMemo } from "react";
import { SectionHeader } from "@/components/dashboard/section-header";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Filter, 
  RefreshCw, 
  Download, 
  ChevronRight,
  MoreHorizontal,
  User,
  Mail,
  MapPin,
  Building2,
  Wallet,
  Store,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  AlertTriangle,
  Eye,
  Settings,
  XCircle,
  CreditCard,
  Lock,
  Ghost,
  CheckCircle
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
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { AddCafeModal } from "@/components/cafes/add-cafe-modal";
import { AdminManagementModal } from "@/components/cafes/admin-management-modal";
import { SubscriptionManagementModal } from "@/components/cafes/subscription-management-modal";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export default function CafeManagement() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  
  // Modals
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<any>(null);

  // Firestore
  const cafesRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'cafes'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: cafes, isLoading } = useCollection(cafesRef);

  // 1. Business Calculations (KPIs)
  const { totalCafes, activeSubs, totalMRR, trialCount, expiredCount } = useMemo(() => {
    if (!cafes) return { totalCafes: 0, activeSubs: 0, totalMRR: 0, trialCount: 0, expiredCount: 0 };
    
    let mrr = 0;
    let active = 0;
    let trial = 0;
    let expired = 0;

    cafes.forEach(c => {
      const plan = (c.subscription?.planId || c.plan || 'free').toLowerCase();
      const isActive = c.isActive && c.subscription?.status !== 'canceled';
      const isPastDue = c.subscription?.status === 'past_due' || c.subscription?.status === 'unpaid';

      if (isActive) {
        if (plan === 'pro' || plan === 'premium') { mrr += 49; active++; }
        else if (plan === 'enterprise') { mrr += 199; active++; }
        else { trial++; } // Treat free/others as trial logically
      }

      if (isPastDue || (!c.isActive && c.status !== 'new')) {
        expired++;
      }
    });

    return { totalCafes: cafes.length, activeSubs: active, totalMRR: mrr, trialCount: trial, expiredCount: expired };
  }, [cafes]);

  // 2. Advanced Search & Filtering
  const filteredCafes = useMemo(() => {
    if (!cafes) return [];
    
    return cafes.filter(cafe => {
      const st = searchTerm.toLowerCase();
      // Search all domains
      const matchesSearch = 
        cafe.name?.toLowerCase().includes(st) || 
        cafe.slug?.toLowerCase().includes(st) ||
        cafe.email?.toLowerCase().includes(st) ||
        cafe.owner_name?.toLowerCase().includes(st) ||
        cafe.owner_email?.toLowerCase().includes(st) ||
        cafe.phone?.toLowerCase().includes(st);

      // Status
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && cafe.isActive) || 
                           (statusFilter === 'suspended' && !cafe.isActive);

      // Plan
      const cafePlan = (cafe.subscription?.planId || cafe.plan || 'free').toLowerCase();
      const matchesPlan = planFilter === 'all' || 
                         (planFilter === 'free' && (cafePlan === 'free' || cafePlan === 'trial')) ||
                         (planFilter === 'pro' && (cafePlan === 'pro' || cafePlan === 'premium')) ||
                         (planFilter === 'enterprise' && cafePlan === 'enterprise');

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [cafes, searchTerm, statusFilter, planFilter]);

  // CSV Export
  const exportToCSV = () => {
    if (!filteredCafes || filteredCafes.length === 0) return;
    const header = "Name,Slug,Email,Admin Name,Admin Email,Plan,Status,CreatedAt\n";
    const csvContent = filteredCafes.map(c => 
      `"${c.name}","${c.slug}","${c.email || ''}","${c.owner_name || ''}","${c.owner_email || ''}","${c.subscription?.planId || c.plan || 'Free'}","${c.isActive ? 'Active' : 'Suspended'}","${c.createdAt || ''}"`
    ).join("\n");
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cafes_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Actions
  const toggleSuspend = async (cafe: any) => {
    if (!db) return;
    if (!confirm(`Are you sure you want to ${cafe.isActive ? 'suspend' : 'activate'} this cafe?`)) return;
    try {
      await updateDoc(doc(db, "cafes", cafe.id), { isActive: !cafe.isActive });
      toast({ title: `Cafe successfully ${cafe.isActive ? 'suspended' : 'activated'}.` });
    } catch (e: any) {
      toast({ title: e.message || "Failed to update status.", variant: "destructive" });
    }
  };

  // Format Dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  };

  const handleImpersonate = async (cafeId: string, cafeName: string) => {
    try {
      toast({ title: `Impersonating ${cafeName}...` });
      const oldToken = localStorage.getItem("token");
      if (oldToken) localStorage.setItem("superAdminToken", oldToken);
      // Endpoint now uses our own JWT (no Firebase Auth required).
      const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!jwt) throw new Error("Not signed in — please log in again.");
      const res = await fetch(`/api/super-admin/impersonate/${cafeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || `Impersonate failed (${res.status})`);
      const newToken = json.data?.token;
      if (!newToken) throw new Error("No token returned.");
      localStorage.setItem("token", newToken);
      window.dispatchEvent(new Event("storage"));
      window.location.href = "/cafe-admin";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impersonation failed";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const columns = [
    {
      key: "name",
      label: "Tenant (Cafe)",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          {row.logoUrl ? (
            <img src={row.logoUrl} alt={row.name} className="h-10 w-10 rounded-xl object-cover bg-muted" />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              {row.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold flex items-center gap-2">
               {row.name}
               {row.ordersCount > 1000 && <Badge variant="secondary" className="h-4 text-[9px] bg-amber-100 text-amber-700 hover:bg-amber-100 uppercase">Top</Badge>}
               {row.subscription?.status === 'past_due' && <Badge variant="destructive" className="h-4 text-[9px] uppercase">Payment Failed</Badge>}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">{row.slug}</span>
          </div>
        </div>
      )
    },
    {
      key: "contact",
      label: "Contact & Admin",
      render: (row: any) => (
        <div className="flex flex-col text-sm">
          <span className="font-semibold text-xs flex items-center gap-1.5"><User className="h-3 w-3 text-primary" /> {row.owner_name || 'No Admin Assigned'}</span>
          <span className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" /> {row.owner_email || row.email || 'N/A'}</span>
        </div>
      )
    },
    {
      key: "business",
      label: "Business Activity",
      render: (row: any) => {
         const plan = (row.subscription?.planId || row.plan || 'Free').toLowerCase();
         let mrr = 0;
         if (row.isActive) {
            if (plan === 'pro' || plan === 'premium') mrr = 49;
            if (plan === 'enterprise') mrr = 199;
         }
         return (
          <div className="flex flex-col text-sm gap-1 pl-2">
            <div className="flex items-center gap-2">
               <span className="font-bold text-emerald-600 block w-14">{mrr > 0 ? `${mrr} OMR` : '0 OMR'}</span>
               <span className="text-xs text-muted-foreground">- MRR</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="font-medium text-foreground block w-14">{row.ordersCount ? Number(row.ordersCount).toLocaleString() : 'N/A'}</span>
               <span className="text-xs text-muted-foreground">- Orders (All time)</span>
            </div>
          </div>
         )
      }
    },
    {
      key: "subscription",
      label: "State & Plan",
      render: (row: any) => {
        const plan = (row.subscription?.planId || row.plan || 'Free').toUpperCase();
        const subStatus = row.subscription?.status || 'active';
        
        let statusBadge = null;
        if (!row.isActive) {
           statusBadge = <Badge className="bg-red-600 shadow-none border-none hover:bg-red-700">SUSPENDED</Badge>;
        } else if (plan === 'FREE' || plan === 'TRIAL') {
           statusBadge = <Badge className="bg-blue-600 shadow-none border-none hover:bg-blue-700 text-white">TRIAL</Badge>;
        } else if (subStatus === 'past_due' || subStatus === 'unpaid') {
           statusBadge = <Badge className="bg-orange-500 shadow-none border-none hover:bg-orange-600">PAST DUE</Badge>;
        } else {
           statusBadge = <Badge className="bg-emerald-600 shadow-none border-none hover:bg-emerald-700">ACTIVE</Badge>;
        }

        return (
          <div className="flex flex-col items-start gap-1.5">
            {statusBadge}
            <Badge variant="outline" className="border-border text-muted-foreground uppercase text-[10px] font-bold">
              PLAN: {plan}
            </Badge>
          </div>
        )
      }
    },
    {
      key: "dates",
      label: "Timestamps",
      render: (row: any) => (
         <div className="flex flex-col text-xs text-muted-foreground gap-1">
            <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Built: {formatDate(row.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Last Active: {formatDate(row.updatedAt || row.createdAt)}</span>
         </div>
      )
    },
    {
      key: "actions",
      label: "",
      className: "text-right pr-6",
      render: (row: any) => (
        <div className="flex items-center justify-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Tenant Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/super-admin/cafes/${row.id}`)} className="cursor-pointer">
                 <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImpersonate(row.id, row.name)} className="cursor-pointer text-indigo-600 font-bold bg-indigo-50/50 mt-1">
                 <Ghost className="mr-2 h-4 w-4" /> Login as Admin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSelectedCafe(row); setAdminModalOpen(true); }} className="cursor-pointer">
                 <Settings className="mr-2 h-4 w-4" /> Manage Access
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedCafe(row); setSubModalOpen(true); }} className="cursor-pointer">
                 <CreditCard className="mr-2 h-4 w-4" /> Change Plan & Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                 <Lock className="mr-2 h-4 w-4" /> Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleSuspend(row)} className={cn("cursor-pointer font-bold", row.isActive ? "text-destructive" : "text-emerald-600")}>
                 {row.isActive ? <><XCircle className="mr-2 h-4 w-4" /> Suspend Cafe</> : <><CheckCircle className="mr-2 h-4 w-4" /> Activate Cafe</>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <SectionHeader 
        title="Customer Management (CRM)" 
        description="Centralized B2B hub to manage tenants, subscriptions, and platform access control."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 bg-card text-muted-foreground mr-1" onClick={exportToCSV}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <AddCafeModal />
          </div>
        }
      />

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
               <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-primary" /> Total Tenants</p>
               <p className="text-2xl font-black">{totalCafes}</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
               <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2"><Store className="w-4 h-4 text-emerald-600" /> Active Paid</p>
               <p className="text-2xl font-black text-emerald-600">{activeSubs}</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
               <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2"><Ghost className="w-4 h-4 text-blue-600" /> Trial / Free</p>
               <p className="text-2xl font-black text-blue-600">{trialCount}</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
               <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-600" /> Suspended / Due</p>
               <p className="text-2xl font-black text-red-600">{expiredCount}</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-primary/5">
            <CardContent className="p-4 flex flex-col justify-center">
               <p className="text-sm font-semibold text-indigo-900 flex items-center gap-2 mb-2"><Wallet className="w-4 h-4" /> Computed MRR</p>
               <p className="text-2xl font-black text-indigo-700">{totalMRR} OMR <span className="text-xs font-normal text-indigo-600/70 ml-1">/mo</span></p>
            </CardContent>
         </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-2 bg-card p-3 rounded-xl shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, phone, admin, slug..." 
            className="pl-10 h-10 border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[140px] h-10 border-none bg-muted/50 font-semibold text-xs">
              <SelectValue placeholder="Plan Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="pro">Pro/Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="free">Free/Trial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 border-none bg-muted/50 font-semibold text-xs">
              <SelectValue placeholder="Account Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Status</SelectItem>
              <SelectItem value="active">Active Accounts</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTableReusable 
        columns={columns} 
        data={filteredCafes} 
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/super-admin/cafes/${row.id}`)}
      />

      {/* Modals */}
      <AdminManagementModal 
         cafe={selectedCafe} 
         open={adminModalOpen} 
         onOpenChange={setAdminModalOpen} 
      />
      <SubscriptionManagementModal 
         cafe={selectedCafe} 
         open={subModalOpen} 
         onOpenChange={setSubModalOpen} 
      />
    </div>
  );
}
