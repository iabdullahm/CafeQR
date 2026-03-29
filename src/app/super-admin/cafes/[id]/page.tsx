"use client";

import React, { useState, use } from "react";
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
  ArrowDownRight,
  ClipboardList,
  LayoutGrid,
  Plus,
  AlertTriangle,
  UserPlus,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

// Dialog / Modal components
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CafeDetailsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Handle Next.js 15 async params or sync params depending on setup
  const resolvedParams = params instanceof Promise ? use(params) : params as { id: string };
  const { id } = resolvedParams;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);

  const db = useFirestore();
  const { toast } = useToast();
  
  const cafeRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'cafes', id);
  }, [db, id]);

  const { data: cafe, isLoading } = useDoc(cafeRef);

  // Helper function to handle form saves
  const handleSave = async (e: React.FormEvent<HTMLFormElement>, type: string) => {
    e.preventDefault();
    if (!cafeRef) return;
    setIsSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const updates: any = {};
      
      if (type === 'edit_cafe') {
        const name = formData.get('name') as string;
        if (name) updates.name = name;
        updates.email = formData.get('email');
        updates.phone = formData.get('phone');
        updates.location = formData.get('location');
      } else if (type === 'assign_owner') {
        updates.owner_name = formData.get('ownerName');
        updates.owner_email = formData.get('ownerEmail');
      } else if (type === 'add_branch') {
        updates.branches_count = (cafe?.branches_count || 0) + 1;
        // Normally push to subcollection
      } else if (type === 'add_table') {
        updates.tables_count = (cafe?.tables_count || 0) + 1;
      } else if (type === 'add_menu_item') {
        updates.menu_count = (cafe?.menu_count || 0) + 1;
      }

      await updateDoc(cafeRef, updates);
      toast({ title: "Success", description: "Changes saved successfully!" });
      setDialogOpen(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading cafe details...</div>;
  }

  if (!cafe) {
    return <div className="p-12 text-center">
      <h2 className="text-xl font-bold">Cafe Not Found</h2>
      <p className="text-muted-foreground mt-2">The cafe with ID {id} does not exist.</p>
      <Button asChild className="mt-4">
        <Link href="/super-admin/cafes">Back to Cafes</Link>
      </Button>
    </div>;
  }

  // Map dynamic cafe data, using sensible defaults for mock functionality where needed
  const CAFE_DATA = {
    id: cafe.id,
    name: cafe.name || "Unnamed Cafe",
    owner: cafe.owner_name || "Unknown Owner",
    email: cafe.email || "N/A",
    phone: cafe.phone || "N/A",
    city: cafe.city || "N/A",
    location: `${cafe.city || 'Unknown'}, ${cafe.country || ''}`,
    plan: cafe.subscription?.planId ? cafe.subscription.planId.toUpperCase() : "FREE",
    status: cafe.isActive ? "active" : "inactive",
    joinedDate: cafe.createdAt ? new Date(cafe.createdAt.seconds * 1000).toLocaleDateString() : "Just now",
    logo: cafe.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(cafe.name || 'C')}&background=random`,
    metrics: {
      branches: cafe.branches_count || 1,
      tables: cafe.tables_count || 0,
      products: cafe.menu_count || 0,
      orders: cafe.orders_count || 0,
      scans: 0,
      customers: 0,
      revenue: 0,
      tickets: 0
    }
  };

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
                  <Badge className={CAFE_DATA.status === "active" ? "bg-green-600 font-bold" : "bg-destructive font-bold"}>
                    {CAFE_DATA.status.toUpperCase()}
                  </Badge>
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
              <Dialog open={dialogOpen === 'edit'} onOpenChange={(open) => setDialogOpen(open ? 'edit' : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2 bg-card">
                    <Edit className="h-4 w-4" /> Edit Full Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Cafe Details</DialogTitle>
                    <DialogDescription>
                      Update comprehensive details for {CAFE_DATA.name}. This action modifies the base profile of the business across the platform.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => handleSave(e, 'edit_cafe')} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input name="name" defaultValue={CAFE_DATA.name} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Registration Number</Label>
                        <Input name="registration" placeholder="E.g., CR-12345" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Email</Label>
                        <Input name="email" defaultValue={CAFE_DATA.email} type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input name="phone" defaultValue={CAFE_DATA.phone} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Headquarters Location</Label>
                      <Input name="location" defaultValue={CAFE_DATA.location} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tax ID (VAT)</Label>
                        <Input placeholder="Enter VAT number" />
                      </div>
                      <div className="space-y-2">
                        <Label>Platform Plan</Label>
                        <Select defaultValue={CAFE_DATA.plan.toLowerCase()}>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="free">Free Tier</SelectItem>
                             <SelectItem value="premium">Premium Pro</SelectItem>
                             <SelectItem value="enterprise">Enterprise VIP</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button disabled={isSaving} type="submit" className="w-full gap-2">
                         {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save All Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" className="gap-2 bg-card">
                <RefreshCw className="h-4 w-4" /> Renew Sub
              </Button>
              <Button size="sm" variant="outline" className={CAFE_DATA.status === "active" ? "gap-2 text-destructive hover:bg-destructive/10 bg-card border-destructive/20" : "gap-2 text-green-600 hover:bg-green-600/10 bg-card border-green-600/20"}>
                <AlertCircle className="h-4 w-4" /> {CAFE_DATA.status === "active" ? "Suspend" : "Activate"}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                    <LogIn className="h-4 w-4" /> Login as Admin
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Login as {CAFE_DATA.name} Admin?</AlertDialogTitle>
                     <AlertDialogDescription>
                        For security and compliance purposes, this action will be logged in the system's Audit Trail. You will be signed in with full administrative privileges over this cafe.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-primary text-primary-foreground font-bold">Confirm Access</AlertDialogAction>
                   </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

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
                          <span>${cafe.revenue || 0} / $20,000</span>
                          <span className="text-green-600 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> 12% MoM</span>
                       </div>
                       <Progress value={Math.min(100, ((cafe.revenue || 0) / 20000) * 100)} className="h-2 [&>div]:bg-green-500" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-muted-foreground uppercase">Orders Target</p>
                       <div className="flex items-center justify-between text-sm font-bold">
                          <span>{cafe.orders_count || 0} / 600</span>
                          <span className="text-destructive flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" /> 5% MoM</span>
                       </div>
                       <Progress value={Math.min(100, ((cafe.orders_count || 0) / 600) * 100)} className="h-2" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-muted-foreground uppercase">Customer Growth</p>
                       <div className="flex items-center justify-between text-sm font-bold">
                          <span>+{cafe.new_customers || 0} New</span>
                          <span className="text-blue-600 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> {cafe.customer_growth_pct ? cafe.customer_growth_pct + '%' : '8%'}</span>
                       </div>
                       <Progress value={cafe.customer_growth_pct || 8} className="h-2 [&>div]:bg-blue-600" />
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
                          <span className="text-xs font-bold text-muted-foreground uppercase mb-1">Owner</span>
                          <div className="flex items-center justify-between">
                            <span className={CAFE_DATA.owner === "Unknown Owner" ? "font-bold text-destructive" : "font-bold"}>{CAFE_DATA.owner}</span>
                            <Dialog open={dialogOpen === 'owner'} onOpenChange={(open) => setDialogOpen(open ? 'owner' : null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] uppercase font-bold shrink-0">
                                  {CAFE_DATA.owner === "Unknown Owner" ? "Assign Owner" : "Change Owner"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{CAFE_DATA.owner === "Unknown Owner" ? "Assign Cafe Owner" : "Update Cafe Owner"}</DialogTitle>
                                  <DialogDescription>
                                    Assign an owner or manager to this business. They will receive an email invitation to access their dashboard.
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={(e) => handleSave(e, 'assign_owner')} className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input name="ownerName" placeholder="John Doe" required />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input name="ownerEmail" placeholder="john@example.com" type="email" required />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Role Assignment</Label>
                                    <Select defaultValue="owner">
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="owner">Primary Owner</SelectItem>
                                        <SelectItem value="manager">General Manager</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <DialogFooter>
                                    <Button disabled={isSaving} type="submit" className="w-full gap-2">
                                       {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Send Invitation</>}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>
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
                        {CAFE_DATA.status === 'active' ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge className="bg-destructive">Suspended</Badge>
                        )}
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
                     <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                     <Dialog open={dialogOpen === 'branch'} onOpenChange={(open) => setDialogOpen(open ? 'branch' : null)}>
                       <DialogTrigger asChild>
                         <Button variant="outline" className="w-full justify-start gap-2 bg-card"><Plus className="h-4 w-4" /> Add Branch</Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Add New Branch</DialogTitle>
                           <DialogDescription>Create a new physical location for {CAFE_DATA.name}.</DialogDescription>
                         </DialogHeader>
                         <form onSubmit={(e) => handleSave(e, 'add_branch')} className="space-y-4 py-4">
                           <div className="space-y-2">
                             <Label>Branch Name</Label>
                             <Input name="branchName" placeholder="e.g., Downtown Branch" required />
                           </div>
                           <div className="space-y-2">
                             <Label>Address</Label>
                             <Input name="branchAddress" placeholder="123 Main St, City" required />
                           </div>
                           <DialogFooter>
                             <Button disabled={isSaving} type="submit" className="w-full">
                               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Branch"}
                             </Button>
                           </DialogFooter>
                         </form>
                       </DialogContent>
                     </Dialog>

                     <Dialog open={dialogOpen === 'table'} onOpenChange={(open) => setDialogOpen(open ? 'table' : null)}>
                       <DialogTrigger asChild>
                         <Button variant="outline" className="w-full justify-start gap-2 bg-card"><Plus className="h-4 w-4" /> Add Table Space</Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Add Table Space</DialogTitle>
                           <DialogDescription>Define a new seating or dining area for QR code mapping.</DialogDescription>
                         </DialogHeader>
                         <form onSubmit={(e) => handleSave(e, 'add_table')} className="space-y-4 py-4">
                           <div className="space-y-2">
                             <Label>Table/Area Identifier</Label>
                             <Input name="tableName" placeholder="e.g., Table 12 or VIP Lounge" required />
                           </div>
                           <div className="space-y-2">
                             <Label>Branch Assignment</Label>
                             <Select defaultValue="main">
                               <SelectTrigger><SelectValue/></SelectTrigger>
                               <SelectContent><SelectItem value="main">Main Branch</SelectItem></SelectContent>
                             </Select>
                           </div>
                           <DialogFooter>
                             <Button disabled={isSaving} type="submit" className="w-full">
                               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Space"}
                             </Button>
                           </DialogFooter>
                         </form>
                       </DialogContent>
                     </Dialog>

                     <Dialog open={dialogOpen === 'menu'} onOpenChange={(open) => setDialogOpen(open ? 'menu' : null)}>
                       <DialogTrigger asChild>
                         <Button variant="outline" className="w-full justify-start gap-2 bg-card"><Plus className="h-4 w-4" /> Add Menu Item</Button>
                       </DialogTrigger>
                       <DialogContent className="sm:max-w-[500px]">
                         <DialogHeader>
                           <DialogTitle>Add New Menu Item</DialogTitle>
                           <DialogDescription>Add a product to the catalog for {CAFE_DATA.name}.</DialogDescription>
                         </DialogHeader>
                         <form onSubmit={(e) => handleSave(e, 'add_menu_item')} className="space-y-4 py-4">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <Label>Item Name</Label>
                               <Input name="itemName" placeholder="e.g., Iced Latte" required />
                             </div>
                             <div className="space-y-2">
                               <Label>Price ($)</Label>
                               <Input name="itemPrice" type="number" placeholder="0.00" required />
                             </div>
                           </div>
                           <div className="space-y-2">
                             <Label>Category</Label>
                             <Select defaultValue="beverages">
                               <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                               <SelectContent><SelectItem value="beverages">Beverages</SelectItem><SelectItem value="food">Food</SelectItem></SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-2">
                             <Label>Description</Label>
                             <Input name="itemDesc" placeholder="Brief description of the item..." />
                           </div>
                           <DialogFooter>
                             <Button disabled={isSaving} type="submit" className="w-full">
                               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Menu Item"}
                             </Button>
                           </DialogFooter>
                         </form>
                       </DialogContent>
                     </Dialog>

                     <Button variant="secondary" className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary mt-2 border-none"><QrCode className="h-4 w-4" /> Generate QR Kit</Button>
                  </CardContent>
               </Card>

               <Card className="border-none shadow-sm bg-card border border-destructive/20 border-l-4 border-l-destructive/80">
                  <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2 uppercase tracking-wider">
                       <AlertTriangle className="h-4 w-4" /> Risks & Alerts
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-3">
                       <div className="flex items-start gap-2 border-b border-destructive/10 pb-3">
                          <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                          <div className="flex flex-col text-sm">
                            <span className="font-bold">No recent activity</span>
                            <span className="text-xs text-muted-foreground">Admin hasn't logged in for 7 days.</span>
                          </div>
                       </div>
                       <div className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                          <div className="flex flex-col text-sm">
                            <span className="font-bold">Incomplete Setup</span>
                            <span className="text-xs text-muted-foreground">No menu items configured yet.</span>
                          </div>
                       </div>
                     </div>
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
                 <p className="text-xs font-bold text-muted-foreground uppercase">Total Orders</p>
                 <p className="text-2xl font-black mt-1">{cafe.orders_count || 0}</p>
              </Card>
              <Card className="p-4 border-none shadow-sm">
                 <p className="text-xs font-bold text-muted-foreground uppercase">Pending</p>
                 <p className="text-2xl font-black mt-1 text-orange-600">{cafe.pending_orders_count || 0}</p>
              </Card>
              <Card className="p-4 border-none shadow-sm">
                 <p className="text-xs font-bold text-muted-foreground uppercase">Ready</p>
                 <p className="text-2xl font-black mt-1 text-green-600">{cafe.ready_orders_count || 0}</p>
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
                       {(!cafe.recent_orders || cafe.recent_orders.length === 0) ? (
                         <TableRow>
                           <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm italic">
                             No live orders found for this cafe yet.
                           </TableCell>
                         </TableRow>
                       ) : cafe.recent_orders.map((order: any) => (
                         <TableRow key={order.id}>
                            <TableCell className="font-bold">{order.id}</TableCell>
                            <TableCell>{order.branch || "Main"}</TableCell>
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
                       {(!cafe.invoices || cafe.invoices.length === 0) ? (
                         <TableRow>
                           <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm italic">
                             No live transactions found yet. 
                           </TableCell>
                         </TableRow>
                       ) : cafe.invoices.map((inv: any) => (
                         <TableRow key={inv.id}>
                            <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                            <TableCell className="font-medium">{inv.desc}</TableCell>
                            <TableCell className="font-bold">{inv.amount}</TableCell>
                            <TableCell>
                               <Badge className="bg-green-600 h-5 text-[10px] font-bold">{inv.status.toUpperCase()}</Badge>
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
                    {(!cafe.auditLogs || cafe.auditLogs.length === 0) ? (
                      <p className="text-sm text-muted-foreground italic">No audit trail logs are available.</p>
                    ) : cafe.auditLogs.map((log: any, i: number) => (
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
                 { cafe.auditLogs && cafe.auditLogs.length > 0 && <Button variant="outline" className="w-full mt-6">Load Older Activity</Button> }
              </CardContent>
           </Card>
        </TabsContent>

        {/* Other Tab Placeholders */}
        {["branches", "tables", "menu", "qr", "loyalty", "support"].map(tab => {
           let dialogKey: string | null = null;
           if (tab === "branches") dialogKey = "branch";
           if (tab === "tables") dialogKey = "table";
           if (tab === "menu") dialogKey = "menu";
           
           return (
             <TabsContent key={tab} value={tab} className="p-10 md:p-20 text-center space-y-4 border rounded-xl border-dashed bg-card/40 my-6 mx-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                   {tab === 'menu' ? <Coffee className="h-8 w-8 text-muted-foreground/30" /> : <TrendingUp className="h-8 w-8 text-muted-foreground/30" />}
                </div>
                <div className="max-w-xs mx-auto space-y-2">
                   <h3 className="text-lg font-bold capitalize">No {tab.replace('_', ' ')} yet</h3>
                   <p className="text-sm text-muted-foreground">It looks like {CAFE_DATA.name} hasn't configured any {tab.replace('_', ' ')} yet. Help them get started.</p>
                   <Button 
                     variant="secondary" 
                     className="mt-4 gap-2 border shadow-sm w-full"
                     onClick={() => {
                        if (dialogKey) {
                           setDialogOpen(dialogKey);
                        } else {
                           toast({ title: "Coming Soon", description: `The ${tab} module is still in development.` });
                        }
                     }}
                   >
                      <Plus className="h-4 w-4" /> Add First {tab.replace('_', ' ').slice(0, tab.length - (tab.endsWith('s') ? 1 : 0))}
                   </Button>
                </div>
             </TabsContent>
           );
        })}
      </Tabs>
    </div>
  );
}
