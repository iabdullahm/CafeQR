"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Plus, Filter, MoreHorizontal, Store, ExternalLink, Mail, MapPin } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const CAFES = [
  { id: "1", name: "Coffee Haven", owner: "John Doe", email: "john@haven.com", plan: "Premium", status: "active", branches: 3, joinDate: "Jan 12, 2024", location: "New York, USA" },
  { id: "2", name: "The Bean Sprout", owner: "Sarah Smith", email: "sarah@bean.com", plan: "Basic", status: "active", branches: 1, joinDate: "Feb 05, 2024", location: "London, UK" },
  { id: "3", name: "Rustic Roast", owner: "Mike Brown", email: "mike@roast.co", plan: "Pro", status: "suspended", branches: 2, joinDate: "Mar 01, 2024", location: "Dubai, UAE" },
  { id: "4", name: "Urban Brew", owner: "Elena Rossi", email: "elena@urban.net", plan: "Enterprise", status: "active", branches: 12, joinDate: "Mar 15, 2024", location: "Milan, Italy" },
  { id: "5", name: "Zen Coffee", owner: "Kenji Sato", email: "kenji@zen.jp", plan: "Pro", status: "active", branches: 5, joinDate: "Apr 02, 2024", location: "Tokyo, Japan" },
];

export default function CafeManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Cafe Management</h1>
          <p className="text-muted-foreground mt-1">Manage all registered cafes and their platform access.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> Add New Cafe
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by cafe name, owner, or email..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="gap-2 flex-1 md:flex-none">
                   <Filter className="h-4 w-4" /> Filters
                </Button>
                <Button variant="outline" className="flex-1 md:flex-none"> Export CSV </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
             <TableHeader>
               <TableRow className="bg-muted/50 hover:bg-muted/50">
                 <TableHead className="font-bold">Cafe & Owner</TableHead>
                 <TableHead className="font-bold">Location</TableHead>
                 <TableHead className="font-bold text-center">Branches</TableHead>
                 <TableHead className="font-bold">Plan</TableHead>
                 <TableHead className="font-bold">Status</TableHead>
                 <TableHead className="font-bold text-right">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {CAFES.map((cafe) => (
                 <TableRow key={cafe.id} className="hover:bg-muted/20">
                   <TableCell>
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border">
                            <Store className="h-5 w-5" />
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold">{cafe.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                               <Mail className="h-3 w-3" /> {cafe.email}
                            </span>
                         </div>
                      </div>
                   </TableCell>
                   <TableCell>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                         <MapPin className="h-3 w-3" /> {cafe.location}
                      </span>
                   </TableCell>
                   <TableCell className="text-center">
                      <Badge variant="secondary" className="font-bold">{cafe.branches}</Badge>
                   </TableCell>
                   <TableCell>
                      <Badge variant="outline" className="border-primary/20 text-primary font-bold">{cafe.plan}</Badge>
                   </TableCell>
                   <TableCell>
                      <Badge 
                        variant={cafe.status === 'active' ? 'default' : 'destructive'}
                        className={`font-bold ${cafe.status === 'active' ? 'bg-green-600' : ''}`}
                      >
                        {cafe.status}
                      </Badge>
                   </TableCell>
                   <TableCell className="text-right">
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                               <MoreHorizontal className="h-4 w-4" />
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2">
                               <ExternalLink className="h-4 w-4" /> View Portal
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                               <Store className="h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive gap-2">
                               Suspend Access
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
           <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Showing 5 of 1,240 cafes</p>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" disabled>Previous</Button>
                 <Button variant="outline" size="sm">Next</Button>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
