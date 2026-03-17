
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
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
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Store, 
  Mail, 
  MapPin, 
  Download, 
  RefreshCw, 
  Clock, 
  User, 
  AlertCircle, 
  ChevronRight,
  LayoutGrid,
  LogIn,
  ClipboardList
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import Link from "next/link";
import { CafeStatus, PaymentStatus } from "@/lib/db-types";

export default function CafeManagement() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCafes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/cafes', {
        params: {
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: 1,
          limit: 10
        }
      });
      setCafes(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error("Failed to fetch cafes", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCafes();
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: CafeStatus) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600 font-bold">Active</Badge>;
      case 'suspended': return <Badge variant="destructive" className="font-bold">Suspended</Badge>;
      case 'trial': return <Badge variant="outline" className="border-blue-500 text-blue-500 font-bold">Trial</Badge>;
      case 'expired': return <Badge variant="secondary" className="font-bold">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Cafe Management</h1>
          <p className="text-muted-foreground mt-1">Directly manage all registered tenants and platform access.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2 bg-card" onClick={fetchCafes}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" className="gap-2 bg-card">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> Add New Cafe
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, owner, email, city..." 
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-11 gap-2 bg-card">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
           {isLoading ? (
             <div className="p-20 text-center text-muted-foreground font-bold">Updating list...</div>
           ) : (
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-muted/30">
                     <TableHead className="font-bold px-6">Cafe</TableHead>
                     <TableHead className="font-bold">Owner & Contact</TableHead>
                     <TableHead className="font-bold">City</TableHead>
                     <TableHead className="font-bold text-center">Plan</TableHead>
                     <TableHead className="font-bold">Expiry Date</TableHead>
                     <TableHead className="font-bold">Status</TableHead>
                     <TableHead className="font-bold text-right pr-6">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {cafes.map((cafe) => (
                     <TableRow key={cafe.id} className="hover:bg-muted/10 group transition-colors">
                       <TableCell className="px-6">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {cafe.name.substring(0, 2).toUpperCase()}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-bold">{cafe.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-mono">{cafe.cafe_code}</span>
                             </div>
                          </div>
                       </TableCell>
                       <TableCell>
                          <div className="flex flex-col text-sm">
                             <span className="font-medium flex items-center gap-1.5"><User className="h-3 w-3" /> {cafe.owner_name}</span>
                             <span className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" /> {cafe.email}</span>
                          </div>
                       </TableCell>
                       <TableCell>
                          <span className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {cafe.city}</span>
                       </TableCell>
                       <TableCell className="text-center">
                          <Badge variant="outline" className="border-primary/30 text-primary">{cafe.plan_name}</Badge>
                       </TableCell>
                       <TableCell>
                          <div className="flex flex-col">
                             <span className="text-sm font-medium">{cafe.subscription_end_date}</span>
                             <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Recent</span>
                          </div>
                       </TableCell>
                       <TableCell>{getStatusBadge(cafe.status)}</TableCell>
                       <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/super-admin/cafes/${cafe.id}`}>
                                  <ChevronRight className="h-5 w-5" />
                                </Link>
                             </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                   <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                   <DropdownMenuItem asChild>
                                      <Link href={`/super-admin/cafes/${cafe.id}`} className="flex gap-2"><LayoutGrid className="h-4 w-4" /> View Details</Link>
                                   </DropdownMenuItem>
                                   <DropdownMenuItem className="gap-2"><LogIn className="h-4 w-4" /> Login as Admin</DropdownMenuItem>
                                   <DropdownMenuItem className="gap-2"><ClipboardList className="h-4 w-4" /> View Orders</DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem className="text-destructive gap-2 font-bold"><AlertCircle className="h-4 w-4" /> Suspend Account</DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
