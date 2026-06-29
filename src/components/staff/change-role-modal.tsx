"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Change the role of a staff member in a cafe.
 *
 * DB schema (CafeUser) stores a single roleId. The UI keeps the legacy
 * checkbox-style multi-select for familiarity, then collapses the
 * selection to one canonical role via ROLE_HIERARCHY before sending.
 * BARISTA collapses to KITCHEN because the server allowlist is
 * {OWNER, MANAGER, CASHIER, KITCHEN}.
 *
 * The endpoint enforces the same allowlist + a tenant gate.
 */
interface ChangeRoleModalProps {
  staffMember: {
    userId?: string;
    id?: string;
    name?: string;
    fullName?: string;
    roleName?: string;
    role?: string;
    roles?: string[];
  };
  // Required so the PATCH URL knows the tenant.
  cafeId: string | null;
  // Called after a successful save so the parent can splice locally.
  onUpdated?: (updated: { roleName: string; status: string }) => void;
  customTrigger?: React.ReactNode;
}

const ROLE_HIERARCHY = ["OWNER", "MANAGER", "CASHIER", "KITCHEN", "BARISTA"];

function pickHighestRole(selected: string[]): string {
  for (const r of ROLE_HIERARCHY) {
    if (selected.includes(r)) return r === "BARISTA" ? "KITCHEN" : r;
  }
  return "KITCHEN";
}

export function ChangeRoleModal({
  staffMember,
  cafeId,
  onUpdated,
  customTrigger,
}: ChangeRoleModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initialRole = (staffMember.roleName || staffMember.role || "BARISTA").toUpperCase();
  const initialRoles = staffMember.roles?.length ? staffMember.roles : [initialRole];
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) {
      toast({ title: "No cafe in context", description: "Cannot determine which cafe to update.", variant: "destructive" });
      return;
    }
    const userId = staffMember.userId;
    if (!userId) {
      toast({ title: "Missing userId", description: "Staff row is missing a userId.", variant: "destructive" });
      return;
    }
    const roleName = pickHighestRole(selectedRoles);

    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`/api/cafes/${cafeId}/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ roleName }),
      });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || (json as { success?: boolean }).success === false) {
        throw new Error(((json as { message?: string }).message) || `HTTP ${res.status}`);
      }
      const data = (json as { data?: { roleName?: string; status?: string } }).data ?? {};
      toast({
        title: "Roles Updated",
        description: `${staffMember.name || staffMember.fullName || "Staff member"} is now ${data.roleName || roleName}.`,
      });
      if (onUpdated) onUpdated({ roleName: data.roleName ?? roleName, status: data.status ?? "active" });
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <div className="flex gap-2 items-center cursor-pointer w-full">
            <Shield className="h-4 w-4 text-muted-foreground" /> Change Role
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Permissions</DialogTitle>
          <DialogDescription>
            Assign one or more roles to {staffMember.name || staffMember.fullName || "this team member"}. The highest role you select will be saved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Assigned Roles</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "OWNER", label: "Owner (Full Access)" },
                { id: "MANAGER", label: "Manager" },
                { id: "CASHIER", label: "Cashier" },
                { id: "KITCHEN", label: "Kitchen / Barista" },
              ].map((roleOption) => (
                <div key={roleOption.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    id={`update-role-${roleOption.id}`}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedRoles.includes(roleOption.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedRoles((prev) => {
                        let newRoles = [...prev];
                        if (checked) {
                          if (!newRoles.includes(roleOption.id)) newRoles.push(roleOption.id);
                        } else {
                          newRoles = newRoles.filter((r) => r !== roleOption.id);
                        }
                        if (newRoles.length === 0) newRoles = ["KITCHEN"];
                        return newRoles;
                      });
                    }}
                  />
                  <Label htmlFor={`update-role-${roleOption.id}`} className="cursor-pointer flex-1 text-xs">
                    {roleOption.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Updating..." : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
