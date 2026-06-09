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
import { 
  UserPlus, 
  UserX, 
  KeyRound, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

interface AdminManagementModalProps {
  cafe: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminManagementModal({ cafe, open, onOpenChange }: AdminManagementModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();
  const handleAction = async (action: string, data?: any) => {
    if (!cafe) return;
    setLoadingAction(action);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      switch (action) {
        case "save_admin": {
          // Create the user (or no-op) + link them as OWNER on this cafe.
          const res = await fetch(`/api/cafes/${cafe.id}/staff`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              fullName: data.name,
              email: data.email,
              password: (data.password && String(data.password).trim()) || `Cafe!${Math.random().toString(36).slice(2, 10)}`,
              roleName: "OWNER",
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || `Save failed (${res.status})`);
          }
          toast({ title: "Admin Assigned", description: `${data.email} is now an OWNER of ${cafe.name}.` });
          onOpenChange(false);
          break;
        }
        case "reset_password":
          await new Promise((r) => setTimeout(r, 400));
          toast({
            title: "Not implemented yet",
            description: "Password reset emails are not wired up on the Postgres backend yet.",
            variant: "destructive",
          });
          break;
        case "resend_creds":
          await new Promise((r) => setTimeout(r, 400));
          toast({
            title: "Not implemented yet",
            description: "Resending credentials by email is not wired up yet.",
            variant: "destructive",
          });
          break;
        case "suspend_access":
        case "restore_access": {
          const isActive = action === "restore_access";
          const res = await fetch(`/api/super-admin/cafes/${cafe.id}`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({ isActive }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || `Update failed (${res.status})`);
          }
          toast({
            title: isActive ? "Access Restored" : "Access Suspended",
            description: isActive
              ? "Cafe admin access is now active."
              : "Cafe admin access has been suspended.",
            variant: isActive ? "default" : "destructive",
          });
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "An action error occurred.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const onSubmitNewAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    handleAction("save_admin", {
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("tempPassword"),
    });
  };

  if (!cafe) return null;

  const hasAdmin = !!cafe.owner_name || !!cafe.owner_email;
  const accessStatus = cafe.adminAccessStatus || "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] md:h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Admin Access: {cafe.name}
            {accessStatus === "suspended" && <Badge variant="destructive">Suspended</Badge>}
            {accessStatus === "active" && hasAdmin && <Badge className="bg-green-600">Active</Badge>}
          </DialogTitle>
          <DialogDescription>
            Manage the primary administrator credentials and access control for this tenant.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={hasAdmin ? "manage" : "assign"} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign">{hasAdmin ? "Change Admin" : "Assign Admin"}</TabsTrigger>
            <TabsTrigger value="manage" disabled={!hasAdmin}>Manage Access</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-4 pt-4">
            <form onSubmit={onSubmitNewAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label>Admin Full Name</Label>
                <Input name="name" defaultValue={cafe.owner_name} placeholder="e.g. John Doe" required />
              </div>
              <div className="space-y-2">
                <Label>Admin Login ID (Username or Email)</Label>
                <Input name="email" type="text" defaultValue={cafe.owner_email || cafe.email} placeholder="e.g. ibrahim123 or admin@cafe.com" required />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input name="tempPassword" type="password" placeholder="Leave blank to keep current password" />
                <p className="text-xs text-muted-foreground mt-1">If specified, this will update the admin&apos;s login password.</p>
              </div>
              <Button type="submit" disabled={loadingAction === "save_admin"} className="w-full mt-2">
                {loadingAction === "save_admin" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {hasAdmin ? "Overwrite Admin Record" : "Create & Assign Admin"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 pt-4">
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold">Current Admin</span>
                <span className="text-sm text-muted-foreground">{cafe.owner_name} ({cafe.owner_email || cafe.email})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleAction("reset_password")}
                  disabled={loadingAction === "reset_password"}
                >
                  {loadingAction === "reset_password" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  Send Password Reset
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleAction("resend_creds")}
                  disabled={loadingAction === "resend_creds"}
                >
                  {loadingAction === "resend_creds" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Resend Login Creds
                </Button>
              </div>

              <div className="pt-2 mt-4 border-t">
                {accessStatus === "active" ? (
                  <Button 
                    variant="destructive" 
                    className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                    onClick={() => handleAction("suspend_access")}
                    disabled={loadingAction === "suspend_access"}
                  >
                    {loadingAction === "suspend_access" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
                    Suspend Admin Access
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleAction("restore_access")}
                    disabled={loadingAction === "restore_access"}
                  >
                    {loadingAction === "restore_access" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Restore Admin Access
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Suspending access prevents the admin from logging into the Cafe Dashboard, but their menus and QR codes remain active online.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
