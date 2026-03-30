
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function TablesManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [qrTable, setQrTable] = useState<any>(null);
  
  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const cafeId = userProfile?.cafeId;

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
    
    const token = Math.random().toString(36).substring(2, 8) + Date.now().toString(36);

    await setDoc(tableRef, {
      number: Number(number),
      name: `Table ${number}`,
      type: "DINE_IN",
      status: "AVAILABLE",
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      cafeId,
      isActive: true,
      qrToken: token,
      createdAt: new Date().toISOString()
    });

    // Also store globally for instant token resolution
    const tokenRef = doc(db, 'qr_tokens', token);
    await setDoc(tokenRef, {
      cafeId,
      branchId: selectedBranch.id,
      tableId,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Table Added", description: `Table ${number} is now active at ${selectedBranch.name}.` });
  };

  const handleGenerateLegacyToken = async (table: any) => {
    if (!db || !cafeId) return;
    const token = Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
    
    // Update existing table
    const tableRef = doc(db, 'cafes', cafeId, 'tables', table.id);
    await setDoc(tableRef, { qrToken: token }, { merge: true });

    // Store in global lookup
    const tokenRef = doc(db, 'qr_tokens', token);
    await setDoc(tokenRef, {
      cafeId,
      branchId: table.branchId || 'default',
      tableId: table.id,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Token Generated", description: "Successfully upgraded table QR token." });
    setQrTable({ ...table, qrToken: token });
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
                      <DropdownMenuItem className="gap-2" onClick={() => setQrTable(table)}><QrCode className="h-4 w-4" /> View QR</DropdownMenuItem>
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
                    <Button variant="secondary" size="sm" className="w-full gap-2 text-xs font-bold rounded-xl" onClick={() => setQrTable(table)}>
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

      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-3xl overflow-hidden p-0">
          <div className="bg-primary/5 p-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Scan to Order</DialogTitle>
              <DialogDescription className="font-medium">
                Customer QR Code for {qrTable?.name}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex flex-col items-center justify-center p-8 bg-card">
             <div className="p-4 bg-white rounded-3xl shadow-lg border-4 border-muted/50 mb-6">
               {qrTable && cafeId && qrTable.qrToken ? (
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/t/${qrTable.qrToken}`)}`} 
                   alt={`QR Code for ${qrTable.name}`} 
                   className="w-[200px] h-[200px] object-contain"
                 />
               ) : (
                 <div className="w-[200px] h-[200px] flex flex-col gap-4 items-center justify-center text-center text-muted-foreground p-4">
                   <p className="text-sm font-bold">Legacy Table Detected</p>
                   <Button onClick={() => handleGenerateLegacyToken(qrTable)} size="sm" className="font-bold">
                     Generate Secure QR
                   </Button>
                 </div>
               )}
             </div>
             
             <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">{qrTable?.branchName}</Badge>
             <p className="text-xl font-black">{qrTable?.name}</p>
             <p className="text-sm font-medium text-muted-foreground mt-1">Place on table for instant ordering</p>
          </div>
          <div className="p-4 bg-muted/20 border-t flex gap-2">
             <Button variant="outline" className="flex-1 font-bold rounded-xl" onClick={() => setQrTable(null)}>Close</Button>
             <Button className="flex-1 gap-2 font-bold rounded-xl" onClick={() => window.print()}>
               <QrCode className="h-4 w-4" /> Print Marker
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
