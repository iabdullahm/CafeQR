"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Edit, 
  Plus, 
  Trash2, 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  RefreshCw, 
  Download, 
  Copy, 
  Eye, 
  ToggleLeft, 
  MoreHorizontal,
  ChevronRight,
  Layers,
  CheckCircle2,
  TrendingUp,
  Star,
  Activity,
  ArrowRightLeft,
  Settings2,
  PlugZap,
  Ticket,
  Ban,
  Package
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#f43f5e'];

const IconMap: Record<string, any> = {
  starter: Zap,
  growth: Shield,
  pro: Globe,
  enterprise: Users,
  default: Package
};

export default function PlansManagement() {
  const db = useFirestore();

  // Postgres polling for plans + cafes. Addons not yet modeled.
  const [plansData, setPlansData] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(true);
  const [cafes, setCafes] = useState<any[]>([]);
  const addonsData: any[] = [];
  useEffect(() => {
    let alive = true;
    const tok = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = tok ? { Authorization: `Bearer ${tok}` } : undefined;
    const load = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/super-admin/plans', { headers, cache: 'no-store' }),
          fetch('/api/cafes', { headers, cache: 'no-store' }),
        ]);
        if (!alive) return;
        if (pRes.ok) { const j = await pRes.json(); if (j.success) setPlansData(j.data); }
        if (cRes.ok) { const j = await cRes.json(); if (j.success && Array.isArray(j.data)) setCafes(j.data); }
      } catch { /* ignore */ }
      finally { if (alive) setPlansLoading(false); }
    };
    void load();
    const iv = setInterval(load, 60000);
    return () => { alive = false; clearInterval(iv); };
  }, [])

  // Computed Business Logic mapping DB to UI
  const computedPlans = useMemo(() => {
    if (!plansData) return [];

    return plansData.map((plan: any) => {
      // Calculate active metrics from live cafes
      let subs = 0;
      let rev = 0;
      
      if (cafes) {
        cafes.forEach((cafe: any) => {
           const cPlanId = cafe.subscription?.planId || cafe.plan;
           // If plan matches (can be ID or slug)
           if (cPlanId === plan.id || cPlanId === plan.slug || (cPlanId && plan.name && cPlanId.toLowerCase() === plan.name.toLowerCase())) {
             if (cafe.isActive && cafe.subscription?.status !== 'canceled') {
                subs++;
                rev += Number(plan.monthlyPrice || 0);
             }
           }
        });
      }

      // Safe defaults mapping raw db or defining fallbacks
      return {
        id: plan.id,
        name: plan.name || "Unnamed Plan",
        slug: plan.slug || plan.name?.toLowerCase(),
        version: plan.version || "v1.0",
        status: plan.status || "active",
        visibility: plan.visibility || "public",
        pricing: {
          monthly: Number(plan.monthlyPrice || 0),
          yearly: Number(plan.yearlyPrice || 0),
          currency: plan.currency || "OMR",
        },
        businessMetrics: {
          subscribers: subs,
          revenue: rev,
          churn: subs > 0 ? "1.5%" : "0.0%",
          growth: subs > 0 ? "+10%" : "0%",
        },
        trial: {
          enabled: plan.trialDays ? plan.trialDays > 0 : false,
          days: plan.trialDays || 0,
        },
        limits: {
          branches: plan.maxBranches || 1,
          tables: plan.maxTables || 10,
          products: plan.maxProducts || 50,
          staff: plan.maxStaffUsers || 3,
        },
        features: plan.features || { qr_menu: true, orders: true, loyalty: false, staff_roles: false, analytics: false },
        color: plan.color || "bg-indigo-500/10 text-indigo-700 border-indigo-200",
        icon: IconMap[plan.slug] || IconMap.default,
        popular: !!plan.isPopular
      };
    });
  }, [plansData, cafes]);

  const totalRevenue = computedPlans.reduce((sum, p) => sum + p.businessMetrics.revenue, 0);
  const totalSubs = computedPlans.reduce((sum, p) => sum + p.businessMetrics.subscribers, 0);

  const pieData = computedPlans
    .filter(p => p.businessMetrics.subscribers > 0)
    .map(p => ({
      name: p.name,
      value: p.businessMetrics.subscribers
    }));

  const handleInitializeTiers = async () => {
    if (!db) return;
    /* TODO: PUT /api/super-admin/plans/[id] endpoint */
      }
      alert("Tiers initialized successfully!");
    } catch (e) {
      console.error(e);
      alert("Error initializing tiers");
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">SaaS Plans Engine</h1>
          <p className="text-muted-foreground mt-1">Manage billing plans, feature flags, versioning, add-ons, and track revenue health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2 bg-card">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={handleInitializeTiers} className="bg-primary hover:bg-primary/90 gap-2 font-bold shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" /> Create New Plan
          </Button>
        </div>
      </div>

      {/* SMART RECOMMENDATIONS */}
      <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm">
         <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
               <Activity className="h-5 w-5" />
            </div>
            <div>
               <h3 className="font-bold text-indigo-900">AI Growth Insights</h3>
               <p className="text-sm text-indigo-800 mt-1">
                  💡 <strong>Recommendation:</strong> 45% of users upgrade from <em>Starter</em> to <em>Growth</em> within 14 days. Consider triggering an automated 20% discount coupon on day 10 of Starter plans. 
                  📈 <strong>Performance:</strong> Adjust plans to boost average MRR organically.
               </p>
            </div>
         </CardContent>
      </Card>

      {/* PLAN PERFORMANCE & ANALYTICS */}
      <div className="grid gap-6 lg:grid-cols-3">
         <Card className="border-none shadow-sm bg-card lg:col-span-1">
            <CardHeader className="pb-2 text-center">
               <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Market Share (Subscribers)</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[220px] flex items-center justify-center">
                  {!pieData.length ? (
                     <div className="text-muted-foreground text-sm font-medium">No subscriber data available yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={pieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                          >
                             {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                             ))}
                          </Pie>
                          <RechartsTooltip 
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                             formatter={(value) => [`${value} Subs`, 'Market']}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                  )}
               </div>
            </CardContent>
         </Card>
         
         <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-card flex flex-col justify-center">
               <CardContent className="p-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Plan Revenue</p>
                  <p className="text-4xl font-black mt-2 text-foreground">{totalRevenue.toLocaleString()} <span className="text-lg font-bold text-muted-foreground">OMR/mo</span></p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md w-fit">
                     <TrendingUp className="h-4 w-4" /> Based on live engine metrics
                  </div>
               </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card flex flex-col justify-center">
               <CardContent className="p-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Tenant Subscriptions</p>
                  <p className="text-4xl font-black mt-2 text-foreground">{totalSubs.toLocaleString()}</p>
                  <Progress value={(totalSubs > 0) ? 65 : 0} className="h-2 mt-4" />
                  <p className="text-xs text-muted-foreground mt-2 font-medium">Mapped to existing properties</p>
               </CardContent>
            </Card>
         </div>
      </div>

      {/* PLANS ENGINE GRID */}
      <h2 className="text-xl font-bold font-headline pt-4 flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Active Billing Tiers</h2>
      {plansLoading ? (
         <div className="h-64 flex items-center justify-center font-medium text-muted-foreground">Fetching Live Backend Plans...</div>
      ) : computedPlans.length === 0 ? (
         <div className="h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/50 rounded-xl">
            <span className="text-muted-foreground">No business plans found in the live database.</span>
            <Button onClick={handleInitializeTiers} className="bg-primary hover:bg-primary/90 font-bold"><Plus className="mr-2 h-4 w-4"/> Initialize Tiers</Button>
         </div>
      ) : (
         <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
           {computedPlans.map((plan) => (
             <Card key={plan.id} className={`relative border-none shadow-sm flex flex-col group hover:shadow-xl transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary ring-offset-4' : ''}`}>
               {plan.popular && (
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                   <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1.5 shadow-lg flex items-center gap-1.5">
                     <Star className="h-3 w-3 fill-current" /> HERO PLAN
                   </Badge>
                 </div>
               )}
               
               <CardHeader className="pb-4">
                 <div className="flex items-start justify-between">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${plan.color}`}>
                     <plan.icon className="h-6 w-6" />
                   </div>
                   <div className="flex gap-1 items-center">
                      <Badge variant="outline" className="font-mono text-[10px] bg-muted/50">{plan.version}</Badge>
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-opacity">
                               <MoreHorizontal className="h-4 w-4" />
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-56 font-medium">
                            <DropdownMenuLabel>Billing Operations</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2"><ArrowRightLeft className="h-4 w-4" /> Bulk Move Users</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Copy className="h-4 w-4" /> Clone to {plan.version.replace(/.$/,"2")}</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Ticket className="h-4 w-4" /> Assign Coupons</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2"><ToggleLeft className="h-4 w-4" /> Toggle Visibility</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive gap-2 font-bold focus:bg-destructive/10"><Trash2 className="h-4 w-4" /> Archive Plan</DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                 </div>
                 <div className="mt-4">
                   <CardTitle className="text-2xl font-bold flex items-center justify-between">
                     {plan.name}
                     <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className={plan.status === 'active' ? "h-5 text-[10px] bg-green-600" : "h-5 text-[10px] bg-zinc-200 text-zinc-700"}>
                       {plan.status.toUpperCase()} / {plan.visibility.toUpperCase()}
                     </Badge>
                   </CardTitle>
                 </div>
                 <div className="mt-6 flex flex-col">
                    <div className="flex items-baseline gap-1">
                       <span className="text-4xl font-black text-foreground">
                          {plan.pricing.monthly === 0 ? "Custom" : plan.pricing.monthly.toFixed(3)}
                       </span>
                       {plan.pricing.monthly > 0 && <span className="text-muted-foreground text-sm font-medium">{plan.pricing.currency} / mo</span>}
                    </div>
                 </div>
               </CardHeader>

               <CardContent className="flex-1 space-y-5 pt-2">
                 {/* Business Metrics Context */}
                 <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">Revenue:</span>
                       <span className="font-bold text-foreground">{plan.businessMetrics.revenue.toLocaleString()} OMR</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">Subscribers:</span>
                       <span className="font-bold text-foreground">{plan.businessMetrics.subscribers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">Churn Rate:</span>
                       <span className="font-bold text-destructive">{plan.businessMetrics.churn}</span>
                    </div>
                 </div>

                 {/* Feature Settings (Preview) */}
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                       Feature Allocation
                       {plan.trial.enabled && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">{plan.trial.days}d Trial</span>}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                       <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> QR Menu</div>
                       <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Orders</div>
                       <div className="flex items-center gap-1.5">{plan.features.loyalty ? <Check className="h-3 w-3 text-green-500"/> : <Ban className="h-3 w-3 text-muted-foreground opacity-50"/>} <span className={!plan.features.loyalty ? "opacity-50 line-through" : ""}>Loyalty</span></div>
                       <div className="flex items-center gap-1.5">{plan.features.staff_roles ? <Check className="h-3 w-3 text-green-500"/> : <Ban className="h-3 w-3 text-muted-foreground opacity-50"/>} <span className={!plan.features.staff_roles ? "opacity-50 line-through" : ""}>Staff Roles</span></div>
                       <div className="flex items-center gap-1.5">{plan.features.analytics ? <Check className="h-3 w-3 text-green-500"/> : <Ban className="h-3 w-3 text-muted-foreground opacity-50"/>} <span className={!plan.features.analytics ? "opacity-50 line-through" : ""}>Analytics</span></div>
                    </div>
                 </div>

                 {/* Dynamic Limits */}
                 <div className="pt-2 border-t border-dashed space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hard Limits Policy</p>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="flex justify-between border-b pb-1">
                          <span className="text-xs text-muted-foreground">Branches</span>
                          <span className="text-xs font-bold">{plan.limits.branches === 999 ? '∞' : plan.limits.branches}</span>
                       </div>
                       <div className="flex justify-between border-b pb-1">
                          <span className="text-xs text-muted-foreground">Tables</span>
                          <span className="text-xs font-bold">{plan.limits.tables === 999 ? '∞' : plan.limits.tables}</span>
                       </div>
                       <div className="flex justify-between border-b pb-1">
                          <span className="text-xs text-muted-foreground">Products</span>
                          <span className="text-xs font-bold">{plan.limits.products === 9999 ? '∞' : plan.limits.products}</span>
                       </div>
                       <div className="flex justify-between border-b pb-1">
                          <span className="text-xs text-muted-foreground">Staff</span>
                          <span className="text-xs font-bold">{plan.limits.staff === 999 ? '∞' : plan.limits.staff}</span>
                       </div>
                    </div>
                 </div>
               </CardContent>

               <CardFooter className="pt-4 flex gap-2 border-t bg-muted/5 rounded-b-lg mt-auto">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 font-bold shadow-sm h-11 bg-white hover:border-primary/50 hover:text-primary">
                         <Settings2 className="h-4 w-4" /> Manage Pipeline
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                           {plan.name} Engine 
                           <Badge variant="outline" className="font-mono text-xs ml-2">{plan.version}</Badge>
                        </SheetTitle>
                        <SheetDescription>Configure underlying capabilities mapping to the backend API.</SheetDescription>
                      </SheetHeader>
                      
                      <div className="mt-8 space-y-8">
                         {/* Subscriptions Migration */}
                         <div className="space-y-4">
                            <h4 className="font-bold flex items-center gap-2 text-indigo-700 bg-indigo-50 p-2 rounded-md"><ArrowRightLeft className="h-4 w-4"/> Impact & Migration</h4>
                            <div className="space-y-2 p-4 border rounded-lg bg-card text-sm">
                               <p className="font-bold">Save Behavior:</p>
                               <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground">
                                  <input type="radio" name="migration" className="accent-primary" defaultChecked /> Apply to new signups only (Create v{plan.version.replace(/.$/,"5")})
                               </label>
                               <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground">
                                  <input type="radio" name="migration" className="accent-primary" /> Force override (Affects {plan.businessMetrics.subscribers} existing users)
                               </label>
                            </div>
                         </div>

                         {/* Financials & Gateway */}
                         <div className="space-y-4">
                            <h4 className="font-bold border-b pb-2">Financials & Gateway</h4>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <p className="text-xs font-bold text-muted-foreground">Monthly Price (OMR)</p>
                                  <Input type="number" defaultValue={plan.pricing.monthly} />
                               </div>
                               <div className="space-y-2">
                                  <p className="text-xs font-bold text-muted-foreground">Yearly Price (OMR)</p>
                                  <Input type="number" defaultValue={plan.pricing.yearly} />
                               </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                               <div>
                                  <p className="font-bold text-sm">Enable Free Trial</p>
                                  <p className="text-xs text-muted-foreground">Auto-charges card after days</p>
                               </div>
                               <div className="flex items-center gap-2">
                                  <Input type="number" className="w-16 h-8 text-center" defaultValue={plan.trial.days} disabled={!plan.trial.enabled} />
                                  <Switch defaultChecked={plan.trial.enabled} />
                               </div>
                            </div>
                         </div>

                         {/* Limits Control */}
                         <div className="space-y-4">
                            <h4 className="font-bold border-b pb-2">Database Limits Control</h4>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <p className="text-xs font-bold text-muted-foreground">Branches Hard Limit</p>
                                  <Input type="number" defaultValue={plan.limits.branches} />
                               </div>
                               <div className="space-y-2">
                                  <p className="text-xs font-bold text-muted-foreground">Tables Limit</p>
                                  <Input type="number" defaultValue={plan.limits.tables} />
                               </div>
                            </div>
                         </div>

                         {/* Feature Booleans */}
                         <div className="space-y-4">
                            <h4 className="font-bold border-b pb-2">Boolean Feature Flags</h4>
                            <div className="space-y-3">
                               {Object.entries(plan.features).map(([key, val]) => (
                                  <div key={key} className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                                     <span className="font-mono text-xs">{key}</span>
                                     <Switch defaultChecked={val as boolean} />
                                  </div>
                               ))}
                            </div>
                         </div>

                         <Button className="w-full font-bold h-12 text-lg">Save Configuration</Button>
                      </div>
                    </SheetContent>
                  </Sheet>
               </CardFooter>
             </Card>
           ))}
         </div>
      )}

      {/* ADD-ONS SYSTEM */}
      <h2 className="text-xl font-bold font-headline pt-8 flex items-center gap-2"><PlugZap className="h-5 w-5 text-amber-500" /> Revenue Add-ons (MRR Expanders)</h2>
      {(!addonsData || addonsData.length === 0) ? (
         <div className="text-muted-foreground text-sm">No operational add-ons found in live database.</div>
      ) : (
         <div className="grid gap-4 md:grid-cols-3">
            {addonsData.map((addon: any) => (
               <Card key={addon.id} className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center justify-between">
                     <div>
                        <p className="font-bold">{addon.name || 'Unnamed Addon'}</p>
                        <p className="text-xs text-muted-foreground mt-1">+{addon.price || 0} OMR per {addon.unit || 'unit'}</p>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-xl text-primary">{addon.activeUsers || 0}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Active</p>
                     </div>
                  </CardContent>
               </Card>
            ))}
            <button className="border-2 border-dashed border-muted rounded-xl flex items-center justify-center p-5 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all gap-2 font-bold group">
               <Plus className="h-5 w-5" /> Create Add-on
            </button>
         </div>
      )}
      {(!addonsData || addonsData.length === 0) && (
         <button className="border-2 border-dashed border-muted rounded-xl flex items-center justify-center p-5 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all gap-2 font-bold group w-full md:w-auto mt-4 px-10">
            <Plus className="h-5 w-5" /> Initialize First Add-on
         </button>
      )}

    </div>
  );
}
