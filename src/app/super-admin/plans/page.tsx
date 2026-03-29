"use client";

import { useState } from "react";
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
  Star
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

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 8.000,
    yearlyPrice: 80.000,
    billing: "per month",
    icon: Zap,
    description: "Best for: Small cafés (1 branch)",
    status: "active",
    features: [
      "1 branch",
      "Up to 15 tables",
      "QR Menu",
      "Basic order management",
      "Up to 50 products",
      "Basic dashboard (orders + revenue)"
    ],
    missingFeatures: [
      "No loyalty system",
      "No staff roles",
      "No advanced analytics"
    ],
    limits: { branches: 1, tables: 15, products: 50, staff: 1 },
    color: "bg-green-500/10 text-green-600 border-green-200",
    popularity: 20
  },
  {
    id: "growth",
    name: "Growth",
    price: 12.000,
    yearlyPrice: 120.000,
    billing: "per month",
    icon: Shield,
    description: "Best for: Growing cafés. This is your main selling plan.",
    status: "active",
    features: [
      "Up to 3 branches",
      "Unlimited tables",
      "Unlimited products",
      "Full order management",
      "Loyalty system (☕ configurable)",
      "Staff roles (Manager / Cashier)",
      "Basic analytics (top products, sales)"
    ],
    limits: { branches: 3, tables: 999, products: 9999, staff: 10 },
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    popular: true,
    popularity: 60
  },
  {
    id: "pro",
    name: "Pro",
    price: 20.000,
    yearlyPrice: 200.000,
    billing: "per month",
    icon: Globe,
    description: "Best for: Established cafés",
    status: "active",
    features: [
      "Unlimited branches",
      "Advanced analytics dashboard",
      "Customer insights (repeat customers)",
      "Promotions & discounts",
      "Full staff permissions",
      "Priority support",
      "Custom branding (logo/colors)"
    ],
    limits: { branches: 999, tables: 999, products: 9999, staff: 999 },
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
    popularity: 15
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    yearlyPrice: 0,
    billing: "Custom Pricing",
    icon: Users,
    description: "Best for: Chains / large businesses",
    status: "active",
    features: [
      "Everything in Pro",
      "Custom integrations (POS / ERP)",
      "Dedicated support",
      "SLA guarantees",
      "Multi-location reporting",
      "Optional white-label system"
    ],
    limits: { branches: 999, tables: 999, products: 9999, staff: 999 },
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    popularity: 5
  }
];

export default function PlansManagement() {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Plans Management</h1>
          <p className="text-muted-foreground mt-1">Configure and manage platform billing tiers, limits, and feature sets (OMR).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2 bg-card">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" className="gap-2 bg-card">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> Create New Plan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Plans", value: "4", icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Active Plans", value: "4", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { title: "Most Popular", value: "Growth", icon: Star, color: "text-primary", bg: "bg-primary/5" },
          { title: "Monthly Rev", value: "0 OMR", icon: TrendingUp, color: "text-accent", bg: "bg-accent/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                <p className="text-xl font-black mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`relative border-none shadow-sm flex flex-col group hover:shadow-xl transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary ring-offset-4' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1.5 shadow-lg flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-current" /> MOST POPULAR
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${plan.color}`}>
                  <plan.icon className="h-6 w-6" />
                </div>
                <div className="flex gap-1">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                         <DropdownMenuLabel>Plan Actions</DropdownMenuLabel>
                         <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Usage</DropdownMenuItem>
                         <DropdownMenuItem className="gap-2"><Copy className="h-4 w-4" /> Duplicate Plan</DropdownMenuItem>
                         <DropdownMenuItem className="gap-2"><ToggleLeft className="h-4 w-4" /> Deactivate</DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem className="text-destructive gap-2 font-bold"><Trash2 className="h-4 w-4" /> Delete Plan</DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
              </div>
              <div className="mt-4">
                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                  {plan.name}
                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="h-5 text-[10px] bg-green-600">
                    {plan.status}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1.5 text-sm line-clamp-2">
                  {plan.description}
                </CardDescription>
              </div>
              <div className="mt-6 flex flex-col">
                 <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">
                       {plan.price === 0 ? "Custom" : plan.price.toFixed(3)}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground text-sm font-medium">OMR / mo</span>}
                 </div>
                 {plan.price > 0 ? (
                    <span className="text-xs text-muted-foreground mt-1 font-medium">or {plan.yearlyPrice.toFixed(3)} OMR/year</span>
                 ) : (
                    <span className="text-xs text-muted-foreground mt-1 font-medium">Contact sales for pricing</span>
                 )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-6 pt-2">
              <div className="space-y-3">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Included Features</p>
                 <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={`inc-${i}`} className="text-sm flex items-start gap-2.5">
                         <div className="mt-0.5 h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0 border border-green-200">
                            <Check className="h-2.5 w-2.5 text-green-600" />
                         </div>
                         <span className="font-medium text-foreground/80 leading-tight">{feature}</span>
                      </li>
                    ))}
                    {(plan as any).missingFeatures?.map((feature: string, i: number) => (
                      <li key={`miss-${i}`} className="text-sm flex items-start gap-2.5 opacity-60">
                         <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                            <span className="text-[10px] font-bold text-muted-foreground">✕</span>
                         </div>
                         <span className="font-medium text-muted-foreground leading-tight line-through">{feature}</span>
                      </li>
                    ))}
                 </ul>
              </div>

              <div className="pt-4 border-t border-dashed space-y-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Platform Limits</p>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Branches</p>
                       <p className="text-sm font-black mt-1">{plan.limits.branches === 999 ? 'Unlimited' : plan.limits.branches}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Tables</p>
                       <p className="text-sm font-black mt-1">{plan.limits.tables === 999 ? 'Unlimited' : plan.limits.tables}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Products</p>
                       <p className="text-sm font-black mt-1">{plan.limits.products === 9999 ? 'Unlimited' : plan.limits.products}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Staff</p>
                       <p className="text-sm font-black mt-1">{plan.limits.staff === 999 ? 'Unlimited' : plan.limits.staff}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
                    <span>Market Share</span>
                    <span>{plan.popularity}%</span>
                 </div>
                 <Progress value={plan.popularity} className="h-1.5" />
              </div>
            </CardContent>

            <CardFooter className="pt-6 flex gap-2 border-t bg-muted/5 rounded-b-lg">
               <Button variant="outline" className="flex-1 gap-2 font-bold shadow-sm h-11">
                  <Edit className="h-4 w-4" /> Edit Plan
               </Button>
               <Button variant="secondary" className="px-3 h-11" title="Quick View Summary">
                  <ChevronRight className="h-5 w-5" />
               </Button>
            </CardFooter>
          </Card>
        ))}

        <button className="border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center p-12 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all group">
           <div className="h-14 w-14 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="h-8 w-8" />
           </div>
           <p className="font-black text-lg">Add New Plan</p>
           <p className="text-xs mt-1 max-w-[150px] text-center">Create a new billing tier for your customers.</p>
        </button>
      </div>
    </div>
  );
}
