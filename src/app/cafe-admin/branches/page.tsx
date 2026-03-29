"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { MapPin, Phone, Plus, MoreVertical, Edit, Trash2, LayoutGrid, ChefHat, ToggleLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function BranchesManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const cafeId = userProfile?.cafeId;

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'branches'));
  }, [db, cafeId]);
  const { data: branches, isLoading } = useCollection(branchesQuery);

  const handleAddBranch = async () => {
    if (!db || !cafeId) return;
    const name = prompt("Enter Branch Name:");
    if (!name) return;

    const branchId = name.toLowerCase().replace(/\s+/g, '-');
    const branchRef = doc(db, 'cafes', cafeId, 'branches', branchId);
    
    await setDoc(branchRef, {
      name,
      code: branchId.substring(0, 6).toUpperCase(),
      city: "Muscat",
      address: "Sultan Qaboos St",
      phone: "+968 9000 0000",
      status: "ACTIVE",
      cafeId,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Branch Added", description: `${name} location has been registered.` });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Branch Management" 
        description="Manage your cafe locations and monitor regional performance."
        actions={<Button className="bg-primary gap-2" onClick={handleAddBranch}><Plus className="h-4 w-4" /> Add Branch</Button>}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />)
        ) : (
          branches?.map((branch) => (
            <Card key={branch.id} className="border-none shadow-sm flex flex-col group overflow-hidden bg-card">
              <CardHeader className="pb-4 relative">
                <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Branch Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" /> Edit Details</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><ChefHat className="h-4 w-4" /> Assign Menu</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><ToggleLeft className="h-4 w-4" /> Deactivate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive gap-2"
                        onClick={() => deleteDoc(doc(db!, 'cafes', cafeId!, 'branches', branch.id))}
                      >
                        <Trash2 className="h-4 w-4" /> Delete Branch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-3 w-3 rounded-full ${branch.status === 'ACTIVE' ? 'bg-green-500' : 'bg-muted'}`} />
                  <Badge variant="outline" className="text-[10px] font-mono tracking-tighter uppercase">{branch.code}</Badge>
                </div>
                <CardTitle className="text-xl font-black">{branch.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {branch.city}, {branch.address}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" /> {branch.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LayoutGrid className="h-3 w-3" /> Managed Operations
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/5 flex gap-2">
                 <Button variant="outline" size="sm" className="flex-1 font-bold rounded-xl" onClick={() => window.location.href = '/cafe-admin/tables'}>Manage Tables</Button>
                 <Button variant="secondary" size="sm" className="flex-1 font-bold rounded-xl" onClick={() => window.location.href = '/cafe-admin/orders'}>View Orders</Button>
              </CardFooter>
            </Card>
          ))
        )}

        <button 
          onClick={handleAddBranch}
          className="border-2 border-dashed border-muted rounded-3xl flex flex-col items-center justify-center p-12 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all group min-h-[250px]"
        >
           <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="h-6 w-6" />
           </div>
           <p className="font-bold">Add New Branch</p>
           <p className="text-xs mt-1 text-center max-w-[180px]">Expand your business with a new location in the region.</p>
        </button>
      </div>
    </div>
  );
}
