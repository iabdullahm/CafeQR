
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { LayoutGrid, Plus, Search, Filter, QrCode, Utensils, Car, TreePine, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function TablesManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const cafeId = user?.email?.includes('urban') ? 'urban-brew-cafe' : 'coastal-cup';

  // Optimized Scoped Query for Tables
  const tablesQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'tables'));
  }, [db, cafeId]);
  const { data: tables, isLoading } = useCollection(tablesQuery);

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'branches'));
  }, [db, cafeId]);
  const { data: branches } = useCollection(branchesQuery);

  const handleAddTable = async () => {
    if (!db || !cafeId || !branches?.length) {
      toast({ title: "No Branches", description: "Create a branch first before adding tables.", variant: "destructive" });
      return;
    }
    
    const number = prompt("Enter Table Number:");
    if (!number) return;
    
    const selectedBranch = branches[0]; // Default to first branch for demo
    const tableId = `T-${number}`;
    const tableRef = doc(db, 'cafes', cafeId, 'tables', tableId);
    
    await setDoc(tableRef, {
      number: Number(number),
      name: `Table ${number}`,
      type: "DINE_IN",
      status: "AVAILABLE",
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      cafeId,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Table Added", description: `Table ${number} is now active at ${selectedBranch.name}.` });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'OCCUPIED': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'OUT_OF_SERVICE': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'DINE_IN': return <Utensils className="h-4 w-4" />;
      case 'CAR_SERVICE': return <Car className="h-4 w-4" />;
      case 'OUTDOOR': return <TreePine className="h-4 w-4" />;
      default: return <LayoutGrid className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Tables Management" 
        description="Configure your dining areas and manage table availability across branches."
        actions={<Button className="bg-primary gap-2" onClick={handleAddTable}><Plus className="h-4 w-4" /> Add Table</Button>}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tables..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches?.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          [1,2,3,4].map(i => <div key={i} className="h-48 rounded-3xl bg-muted animate-pulse" />)
        ) : (
          tables?.map((table) => (
            <Card key={table.id} className="border-none shadow-sm overflow-hidden group bg-card">
              <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between space-y-0">
                 <div className="flex items-center gap-2">
                   <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                     {getTypeIcon(table.type)}
                   </div>
                   <CardTitle className="text-lg font-black">{table.name}</CardTitle>
                 </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><QrCode className="h-4 w-4" /> View QR</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-destructive"
                        onClick={() => deleteDoc(doc(db!, 'cafes', cafeId!, 'tables', table.id))}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                 <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`capitalize font-bold ${getStatusColor(table.status)}`}>
                      {table.status}
                    </Badge>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{table.type?.replace('_', ' ')}</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                    <p className="text-sm font-medium">{table.branchName || 'Unknown Branch'}</p>
                 </div>
                 <div className="pt-2">
                    <Button variant="secondary" size="sm" className="w-full gap-2 text-xs font-bold rounded-xl">
                      <QrCode className="h-3 w-3" /> Generate QR Code
                    </Button>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {!isLoading && (
          <button 
            onClick={handleAddTable}
            className="border-2 border-dashed border-muted rounded-3xl flex items-center justify-center p-8 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all group"
          >
             <Plus className="h-5 w-5 mr-2" />
             <span className="font-bold">Add Table</span>
          </button>
        )}
      </div>
    </div>
  );
}
