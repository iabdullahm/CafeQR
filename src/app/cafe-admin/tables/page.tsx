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

const TABLES_DATA = [
  { id: "1", number: "T-01", type: "dine-in", branch: "Main Downtown", seats: 4, status: "available" },
  { id: "2", number: "T-02", type: "dine-in", branch: "Main Downtown", seats: 2, status: "occupied" },
  { id: "3", number: "C-01", type: "car-order", branch: "Main Downtown", seats: 0, status: "available" },
  { id: "4", number: "O-01", type: "outdoor", branch: "Main Downtown", seats: 6, status: "available" },
  { id: "5", number: "T-03", type: "dine-in", branch: "Manhattan North", seats: 4, status: "disabled" },
];

export default function TablesManagement() {
  const [tables] = useState(TABLES_DATA);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'occupied': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'disabled': return 'bg-muted text-muted-foreground border-muted';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return <Utensils className="h-4 w-4" />;
      case 'car-order': return <Car className="h-4 w-4" />;
      case 'outdoor': return <TreePine className="h-4 w-4" />;
      default: return <LayoutGrid className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Tables Management" 
        description="Configure your dining areas and manage table availability across branches."
        actions={<Button className="bg-primary gap-2"><Plus className="h-4 w-4" /> Add Table</Button>}
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
              <SelectItem value="main">Main Downtown</SelectItem>
              <SelectItem value="north">Manhattan North</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => (
          <Card key={table.id} className="border-none shadow-sm overflow-hidden group">
            <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between space-y-0">
               <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                   {getTypeIcon(table.type)}
                 </div>
                 <CardTitle className="text-lg font-black">{table.number}</CardTitle>
               </div>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2"><QrCode className="h-4 w-4" /> View QR</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
               <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`capitalize ${getStatusColor(table.status)}`}>
                    {table.status}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">{table.seats} Seats</span>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Branch</p>
                  <p className="text-sm font-medium">{table.branch}</p>
               </div>
               <div className="pt-2">
                  <Button variant="secondary" size="sm" className="w-full gap-2 text-xs font-bold">
                    <QrCode className="h-3 w-3" /> Generate QR Code
                  </Button>
               </div>
            </CardContent>
          </Card>
        ))}
        
        <button className="border-2 border-dashed border-muted rounded-xl flex items-center justify-center p-8 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all group">
           <Plus className="h-5 w-5 mr-2" />
           <span className="font-bold">Add Table</span>
        </button>
      </div>
    </div>
  );
}
