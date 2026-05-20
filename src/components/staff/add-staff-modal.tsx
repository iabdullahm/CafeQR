"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { setDoc, serverTimestamp, doc } from "firebase/firestore";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

interface AddStaffModalProps {
  onAdd: (staff: any) => void;
  defaultRole?: string;
  customTrigger?: React.ReactNode;
}

export function AddStaffModal({ onAdd, defaultRole = "BARISTA", customTrigger }: AddStaffModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { user } = useUser();
  const db = useFirestore();
  const userProfileRef = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const cafeId = userProfile?.cafeId;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roles: [defaultRole],
    password: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !cafeId) {
       toast({ title: "Error", description: "Could not find cafe context. Please try again.", variant: "destructive" });
       return;
    }
    
    setLoading(true);

    try {
      // Use a secondary Firebase app to create the user without logging out the current admin
      let secondaryApp;
      if (!getApps().some(app => app.name === 'Secondary')) {
         secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      } else {
         secondaryApp = getApp('Secondary');
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const userUid = userCredential.user.uid;
      
      // Sign out immediately so it doesn't persist or interfere
      await signOut(secondaryAuth);

      // Determine primary role based on hierarchy
      const hierarchy = ["OWNER", "MANAGER", "CASHIER", "BARISTA"];
      let primaryRole = "BARISTA";
      for (const r of hierarchy) {
        if (formData.roles.includes(r)) {
          primaryRole = r;
          break;
        }
      }

      // Create the user document in firestore with the actual Auth UID
      await setDoc(doc(db, "users", userUid), {
         name: formData.name,
         email: formData.email,
         role: primaryRole,
         roles: formData.roles,
         cafeId: cafeId,
         status: "Active",
         lastLogin: "Never",
         createdAt: serverTimestamp(),
      });

      onAdd({
        id: Math.random(),
        ...formData,
        role: primaryRole,
        status: "Active",
        lastLogin: "Never",
      });

      setLoading(false);
      setOpen(false);
      setFormData({ name: "", email: "", roles: [defaultRole], password: "" });
      
      toast({
        title: "Staff Member Added",
        description: `${formData.name} has been added to the team successfully.`,
      });
    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast({ title: "Error", description: "Failed to add staff member.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <Button className="bg-primary gap-2">
            <Plus className="h-4 w-4" /> Add Staff Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Create a new account for a team member and assign their role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. John Doe" 
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="e.g. john@cafe.com" 
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
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
                      id={`role-${roleOption.id}`}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.roles.includes(roleOption.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(prev => {
                          let newRoles = [...prev.roles];
                          if (checked) {
                            if (!newRoles.includes(roleOption.id)) newRoles.push(roleOption.id);
                          } else {
                            newRoles = newRoles.filter(r => r !== roleOption.id);
                          }
                          // Fallback
                          if (newRoles.length === 0) newRoles = ["BARISTA"];
                          return { ...prev, roles: newRoles };
                        });
                      }}
                    />
                    <Label htmlFor={`role-${roleOption.id}`} className="cursor-pointer flex-1">{roleOption.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          <div className="space-y-2">
            <Label htmlFor="password">Initial Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Enter a secure password" 
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              minLength={6}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Staff Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
