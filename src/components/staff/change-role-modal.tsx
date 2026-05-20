"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface ChangeRoleModalProps {
  staffMember: any;
  customTrigger?: React.ReactNode;
}

export function ChangeRoleModal({ staffMember, customTrigger }: ChangeRoleModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const initialRoles = staffMember.roles || [staffMember.role || "BARISTA"];
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setLoading(true);

    try {
      const hierarchy = ["OWNER", "MANAGER", "CASHIER", "BARISTA"];
      let primaryRole = "BARISTA";
      for (const r of hierarchy) {
        if (selectedRoles.includes(r)) {
          primaryRole = r;
          break;
        }
      }

      await updateDoc(doc(db, "users", staffMember.id), {
        roles: selectedRoles,
        role: primaryRole,
      });

      setLoading(false);
      setOpen(false);
      
      toast({
        title: "Roles Updated",
        description: `Permissions for ${staffMember.name || 'this member'} have been updated.`,
      });
    } catch (error: any) {
      console.error("Error updating roles:", error);
      toast({ title: "Error", description: "Failed to update permissions.", variant: "destructive" });
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
            Assign one or more roles to {staffMember.name || 'this team member'}.
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
                { id: "BARISTA", label: "Barista / Staff" }
              ].map((roleOption) => (
                <div key={roleOption.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <input 
                    type="checkbox" 
                    id={`update-role-${roleOption.id}`}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedRoles.includes(roleOption.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedRoles(prev => {
                        let newRoles = [...prev];
                        if (checked) {
                          if (!newRoles.includes(roleOption.id)) newRoles.push(roleOption.id);
                        } else {
                          newRoles = newRoles.filter(r => r !== roleOption.id);
                        }
                        if (newRoles.length === 0) newRoles = ["BARISTA"]; // Fallback
                        return newRoles;
                      });
                    }}
                  />
                  <Label htmlFor={`update-role-${roleOption.id}`} className="cursor-pointer flex-1 text-xs">{roleOption.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
