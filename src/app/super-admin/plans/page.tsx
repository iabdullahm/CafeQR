"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Edit, Plus, Trash2, Shield, Zap, Globe, Users } from "lucide-react";

const PLANS = [
  {
    id: "basic",
    name: "Starter",
    price: 19,
    billing: "per month",
    icon: Zap,
    description: "Perfect for single location small coffee shops.",
    features: ["1 Branch Included", "Up to 5 Tables", "Basic QR Ordering", "Email Support", "Digital Menu Only"],
    limits: "500 Monthly Orders",
    color: "bg-blue-500/10 text-blue-600 border-blue-200"
  },
  {
    id: "pro",
    name: "Professional",
    price: 49,
    billing: "per month",
    icon: Shield,
    description: "Advanced features for growing cafe brands.",
    features: ["Up to 3 Branches", "Unlimited Tables", "Custom Branding", "Priority Support", "Advanced Analytics", "Inventory Tracking"],
    limits: "2,500 Monthly Orders",
    color: "bg-primary/10 text-primary border-primary/20",
    popular: true
  },
  {
    id: "premium",
    name: "Business Elite",
    price: 99,
    billing: "per month",
    icon: Globe,
    description: "Full suite for large-scale multi-branch operations.",
    features: ["Up to 10 Branches", "Everything in Pro", "White Label Options", "Dedicated AM", "API Access", "Multi-tenant Management"],
    limits: "Unlimited Orders",
    color: "bg-accent/10 text-accent border-accent/20"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 249,
    billing: "per month",
    icon: Users,
    description: "Custom solutions for franchises and global chains.",
    features: ["Unlimited Branches", "Custom Contracts", "SLA Guarantees", "SSO Integration", "On-site Training"],
    limits: "Custom Limits",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-200"
  }
];

export default function PlansManagement() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Configure and manage platform billing tiers and feature sets.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> Create New Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`relative border-none shadow-sm flex flex-col ${plan.popular ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1">MOST POPULAR</Badge>
              </div>
            )}
            <CardHeader>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${plan.color}`}>
                <plan.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="min-h-[40px] mt-1">{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                 <span className="text-4xl font-black">${plan.price}</span>
                 <span className="text-muted-foreground text-sm font-medium">{plan.billing}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="space-y-3">
                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Features</p>
                 <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                         <div className="mt-0.5 h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-green-600" />
                         </div>
                         <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                 </ul>
              </div>
              <div className="pt-4 border-t border-dashed">
                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan Limits</p>
                 <p className="mt-1 text-sm font-bold text-foreground">{plan.limits}</p>
              </div>
            </CardContent>
            <CardFooter className="pt-6 flex gap-2">
               <Button variant="outline" className="flex-1 gap-2">
                  <Edit className="h-4 w-4" /> Edit
               </Button>
               <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
