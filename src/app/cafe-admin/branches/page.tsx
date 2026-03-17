"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { MapPin, Phone, Mail, Plus, MoreVertical, Edit, Trash2, LayoutGrid, ChefHat, ToggleLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const INITIAL_BRANCHES = [
  { id: "1", name: "Main Downtown", code: "B-DT-01", city: "New York", address: "123 Coffee Ave", phone: "+1 234 567 890", status: "active", isMain: true, tables: 12 },
  { id: "2", name: "Manhattan North", code: "B-MN-02", city: "New York", address: "45 Broadway St", phone: "+1 234 567 891", status: "active", isMain: false, tables: 8 },
  { id: "3", name: "Brooklyn Heights", code: "B-BK-03", city: "Brooklyn", address: "89 Water St", phone: "+1 234 567 892", status: "inactive", isMain: false, tables: 4 },
];

export default function BranchesManagement() {
  const [branches] = useState(INITIAL_BRANCHES);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Branch Management" 
        description="Manage your cafe locations, assign menus and monitor table capacity."
        actions={<Button className="bg-primary gap-2"><Plus className="h-4 w-4" /> Add Branch</Button>}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="border-none shadow-sm flex flex-col group overflow-hidden">
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
                    <DropdownMenuItem className="text-destructive gap-2"><Trash2 className="h-4 w-4" /> Delete Branch</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-3 w-3 rounded-full ${branch.status === 'active' ? 'bg-green-500' : 'bg-muted'}`} />
                <Badge variant="outline" className="text-[10px] font-mono tracking-tighter uppercase">{branch.code}</Badge>
                {branch.isMain && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Main Branch</Badge>}
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
                  <LayoutGrid className="h-3 w-3" /> {branch.tables} Tables Assigned
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/5 flex gap-2">
               <Button variant="outline" size="sm" className="flex-1 font-bold">Manage Tables</Button>
               <Button variant="secondary" size="sm" className="flex-1 font-bold">View Orders</Button>
            </CardFooter>
          </Card>
        ))}

        <button className="border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center p-12 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all group min-h-[250px]">
           <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="h-6 w-6" />
           </div>
           <p className="font-bold">Add New Branch</p>
           <p className="text-xs mt-1 text-center max-w-[180px]">Expand your business with a new location.</p>
        </button>
      </div>
    </div>
  );
}
