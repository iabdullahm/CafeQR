"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

/**
 * Create or edit a billing plan.
 *
 * Modes:
 *   mode="create"  -> POST /api/super-admin/plans
 *   mode="edit"    -> PATCH /api/super-admin/plans/[id]
 *
 * The parent owns the open state and supplies a one-shot onSaved
 * callback so it can refetch its list. The dialog itself is dumb about
 * the surrounding page.
 *
 * Slug shape is enforced both client-side (regex) and server-side. The
 * server is the source of truth for uniqueness; we don't pre-check.
 */
export interface PlanFormValue {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  monthlyPrice?: number;
  yearlyPrice?: number;
  currency?: string;
  maxBranches?: number;
  maxTables?: number;
  maxProducts?: number;
  maxStaffUsers?: number;
  trialDays?: number;
  isPopular?: boolean;
  status?: string;
}

interface PlanFormDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PlanFormValue;
  onSaved?: () => void;
}

const SLUG_RE = /^[a-z0-9-]+$/;

function blank(): Required<Omit<PlanFormValue, "id" | "description">> & {
  id?: string;
  description: string;
} {
  return {
    name: "",
    slug: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "OMR",
    maxBranches: 1,
    maxTables: 10,
    maxProducts: 50,
    maxStaffUsers: 3,
    trialDays: 14,
    isPopular: false,
    status: "active",
  };
}

export function PlanFormDialog({
  mode,
  open,
  onOpenChange,
  initial,
  onSaved,
}: PlanFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => ({ ...blank(), ...(initial ?? {}) }));

  // Re-seed the form whenever the dialog opens with a different plan.
  useEffect(() => {
    if (open) {
      setForm({ ...blank(), ...(initial ?? {}) });
    }
  }, [open, initial]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim() || !form.slug?.trim()) {
      toast({ title: "Name and slug are required.", variant: "destructive" });
      return;
    }
    if (!SLUG_RE.test(form.slug)) {
      toast({
        title: "Bad slug",
        description: "Use only lowercase letters, digits, and dashes.",
        variant: "destructive",
      });
      return;
    }
    if (Number(form.monthlyPrice) < 0 || Number(form.yearlyPrice) < 0) {
      toast({ title: "Prices must be >= 0", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const url =
        mode === "create"
          ? "/api/super-admin/plans"
          : `/api/super-admin/plans/${initial?.id ?? ""}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase(),
          description: form.description?.trim() || null,
          monthlyPrice: Number(form.monthlyPrice),
          yearlyPrice: Number(form.yearlyPrice),
          currency: form.currency || "OMR",
          maxBranches: Number(form.maxBranches),
          maxTables: Number(form.maxTables),
          maxProducts: Number(form.maxProducts),
          maxStaffUsers: Number(form.maxStaffUsers),
          trialDays: Number(form.trialDays),
          isPopular: !!form.isPopular,
          status: form.status,
        }),
      });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || (json as { success?: boolean }).success === false) {
        throw new Error(((json as { message?: string }).message) || `HTTP ${res.status}`);
      }
      toast({
        title: mode === "create" ? "Plan created" : "Plan updated",
        description: `${form.name} (${form.slug}) saved.`,
      });
      if (onSaved) onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Plan" : "Edit Plan"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Set up a new billing tier. Slug is the URL key; it can't easily change later."
              : "Update plan details. Slug change is allowed but breaks any external links that referenced the old one."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Pro" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-slug">Slug (URL key)</Label>
            <Input
              id="plan-slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="pro"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-currency">Currency</Label>
            <Input id="plan-currency" value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="OMR" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="plan-desc">Description</Label>
            <Input id="plan-desc" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Best for mid-size cafes" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-monthly">Monthly price</Label>
            <Input id="plan-monthly" type="number" step="0.001" value={form.monthlyPrice} onChange={(e) => set("monthlyPrice", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-yearly">Yearly price</Label>
            <Input id="plan-yearly" type="number" step="0.001" value={form.yearlyPrice} onChange={(e) => set("yearlyPrice", Number(e.target.value))} />
          </div>

          <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 pt-3 border-t">
            <div className="space-y-1">
              <Label htmlFor="plan-branches" className="text-xs">Branches</Label>
              <Input id="plan-branches" type="number" min={1} value={form.maxBranches} onChange={(e) => set("maxBranches", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-tables" className="text-xs">Tables</Label>
              <Input id="plan-tables" type="number" min={1} value={form.maxTables} onChange={(e) => set("maxTables", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-products" className="text-xs">Products</Label>
              <Input id="plan-products" type="number" min={1} value={form.maxProducts} onChange={(e) => set("maxProducts", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-staff" className="text-xs">Staff</Label>
              <Input id="plan-staff" type="number" min={1} value={form.maxStaffUsers} onChange={(e) => set("maxStaffUsers", Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-trial">Trial days</Label>
            <Input id="plan-trial" type="number" min={0} value={form.trialDays} onChange={(e) => set("trialDays", Number(e.target.value))} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch id="plan-popular" checked={!!form.isPopular} onCheckedChange={(v) => set("isPopular", v)} />
            <Label htmlFor="plan-popular">Mark as Popular</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : mode === "create" ? "Create Plan" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
