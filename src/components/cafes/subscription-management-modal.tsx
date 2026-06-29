"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CreditCard, RefreshCw, ShieldCheck, PauseCircle, XOctagon, Loader2 } from "lucide-react";
// Firestore imports removed in Phase 4d. State now lives in Postgres.

interface SubscriptionManagementModalProps {
  cafe: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionManagementModal({ cafe, open, onOpenChange }: SubscriptionManagementModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();

  if (!cafe) return null;

  const currentPlan = cafe.subscription?.planId?.toLowerCase() || cafe.plan?.toLowerCase() || "free";
  const subStatus = cafe.subscription?.status || "active";

  const handleAction = async (
    action: string,
    data?: { plan?: string; billingCycle?: "monthly" | "yearly" }
  ) => {
    // Wired to PATCH /api/super-admin/subscriptions/[id]. The UI uses
    // legacy verb names (renew_sub, pause_sub, ...); we map them to the
    // server's vocabulary here.
    const subId: string | undefined = cafe.subscription?.id;
    if (!subId) {
      toast({
        title: "No subscription on file",
        description: "This cafe doesn't have a subscription row yet. Create one from Plans first.",
        variant: "destructive",
      });
      return;
    }

    const verbMap: Record<string, string> = {
      renew_sub: "renew",
      pause_sub: "pause",
      cancel_sub: "cancel",
      change_plan: "change_plan",
      resume_sub: "resume",
    };
    const serverAction = verbMap[action] ?? action;

    setLoadingAction(action);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const body: Record<string, unknown> = { action: serverAction };
      if (serverAction === "change_plan") {
        const planSlug = data?.plan?.toLowerCase();
        const planId = cafe.subscription?.planMap?.[planSlug ?? ""];
        if (!planId) {
          throw new Error(
            `Cannot resolve plan '${planSlug}' to a planId. Add planMap on the cafe row server-side.`
          );
        }
        body.planId = planId;
        if (data?.billingCycle) body.billingCycle = data.billingCycle;
      }
      const res = await fetch(`/api/super-admin/subscriptions/${subId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || (json as { success?: boolean }).success === false) {
        throw new Error(((json as { message?: string }).message) || `HTTP ${res.status}`);
      }

      const msgs: Record<string, string> = {
        renew: "Subscription renewed.",
        pause: "Subscription paused. Service stays live until endDate.",
        cancel: "Subscription cancelled.",
        change_plan: `Plan changed${data?.plan ? ` to ${data.plan.toUpperCase()}` : ""}.`,
        resume: "Subscription reactivated.",
      };
      toast({ title: "Done", description: msgs[serverAction] ?? "Updated." });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const onSubmitPlanChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const plan = String(fd.get("plan") ?? "");
    const cycleRaw = String(fd.get("billingCycle") ?? "monthly");
    const billingCycle: "monthly" | "yearly" = cycleRaw === "yearly" ? "yearly" : "monthly";
    handleAction("change_plan", { plan, billingCycle });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] md:h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Subscription: {cafe.name}
            {subStatus === "paused" && <Badge variant="secondary" className="bg-orange-100 text-orange-600">Paused</Badge>}
            {subStatus === "canceled" && <Badge variant="destructive">Canceled</Badge>}
            {subStatus === "active" && <Badge className="bg-green-600">Active</Badge>}
          </DialogTitle>
          <DialogDescription>
            Manage billing, plan upgrades, and subscription lifecycle directly.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="change">Change Plan</TabsTrigger>
            <TabsTrigger value="billing">Billing Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/> Current Plan</span>
                <p className="text-2xl font-black capitalize">{currentPlan}</p>
                <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px] mt-1">
                  {cafe.subscription?.billingCycle || 'Monthly'} Billing
                </Badge>
              </div>

              <div className="rounded-lg border bg-card p-4 space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/> Next Renewal</span>
                <p className="text-2xl font-black flex items-center gap-2">
                  {cafe.subscription?.renewalDate || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Last seen status: <span className="font-bold">{subStatus.toUpperCase()}</span></p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
               <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Plan Limits (Instant View)</h4>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <div>
                    <span className="text-xs text-muted-foreground">Branches</span>
                    <p className="font-bold">{currentPlan === 'free' ? '1' : currentPlan === 'premium' ? '3' : 'Unlimited'}</p>
                 </div>
                 <div>
                    <span className="text-xs text-muted-foreground">Tables</span>
                    <p className="font-bold">{currentPlan === 'free' ? '30' : currentPlan === 'premium' ? '100' : 'Unlimited'}</p>
                 </div>
                 <div>
                    <span className="text-xs text-muted-foreground">Premium QR</span>
                    <p className="font-bold">{currentPlan === 'free' ? 'No' : 'Yes'}</p>
                 </div>
                 <div>
                    <span className="text-xs text-muted-foreground">White Label</span>
                    <p className="font-bold">{currentPlan === 'enterprise' ? 'Yes' : 'No'}</p>
                 </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="change" className="space-y-4 pt-4">
            <form onSubmit={onSubmitPlanChange} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Change Platform Plan</Label>
                  <Select name="plan" defaultValue={currentPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Tier ($0/mo)</SelectItem>
                      <SelectItem value="premium">Premium Pro ($49/mo)</SelectItem>
                      <SelectItem value="enterprise">Enterprise VIP ($199/mo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select name="billingCycle" defaultValue={cafe.subscription?.billingCycle || 'monthly'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual (Save 20%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loadingAction === "change_plan"} className="w-full">
                {loadingAction === "change_plan" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Change Platform Plan
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 pt-4">
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="font-bold border-b pb-2 mb-4 flex items-center gap-2">
                 <CreditCard className="h-4 w-4" /> Operations
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleAction("renew_sub")}
                  disabled={loadingAction === "renew_sub" || subStatus === "active"}
                  className="w-full justify-start text-left"
                >
                  {loadingAction === "renew_sub" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Manual Renewal / Reactivate
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleAction("pause_sub")}
                  disabled={loadingAction === "pause_sub" || subStatus !== "active"}
                  className="w-full justify-start text-left text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                >
                  {loadingAction === "pause_sub" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PauseCircle className="h-4 w-4 mr-2" />}
                  Pause Subscription (Stop Billing)
                </Button>

                <Button 
                   variant="destructive" 
                   onClick={() => handleAction("cancel_sub")}
                   disabled={loadingAction === "cancel_sub" || subStatus === "canceled"}
                   className="w-full justify-start text-left"
                 >
                   {loadingAction === "cancel_sub" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XOctagon className="h-4 w-4 mr-2" />}
                   Cancel Subscription Immediately
                 </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
