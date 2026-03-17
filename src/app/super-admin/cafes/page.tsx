"use client";

import { useState } from "react";
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
  Phone, 
  Clock, 
  User, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2,
  Trash2,
  LogIn,
  ClipboardList,
  ChevronRight,
  LayoutGrid
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

const CAFES = [
  { 
    uuid: "8402-1240", 
    cafe_code: "ROAST-01",
    name: "The Roast Coffee", 
    owner: "John Doe", 
    email: "john@roast.com", 
    phone: "+1 234 567 890",
    city: "New York",
    plan: "Premium", 
    status: "active" as CafeStatus, 
    paymentStatus: "paid" as PaymentStatus,
    branches: 3, 
    tables: 24,
    orders: 1240,
    expiryDate: "Jan 12, 2025", 
    lastActivity: "2 mins ago"
  },
  { 
    uuid: "7291-450", 
    cafe_code: "BEAN-99",
    name: "Bean & Brew", 
    owner: "Sarah Smith", 
    email: "sarah@bean.com", 
    phone: "+44 7700 900000",
    city: "London",
    plan: "Basic", 
    status: "active" as CafeStatus, 
    paymentStatus: "paid" as PaymentStatus,
    branches: 1, 
    tables: 8,
    orders: 450,
    expiryDate: "Feb 05, 2025", 
    lastActivity: "15 mins ago"
  },
  { 
    uuid: "1042-890", 
    cafe_code: "RUSTIC-7",
    name: "Rustic Roast", 
    owner: "Mike Brown", 
    email: "mike@roast.co", 
    phone: "+971 50 123 4567",
    city: "Dubai",
    plan: "Pro", 
    status: "suspended" as CafeStatus, 
    paymentStatus: "overdue" as PaymentStatus,
    branches: 2, 
    tables: 15,
    orders: 890,
    expiryDate: "Mar 01, 2024", 
    lastActivity: "3 days ago"
  }
];

export default function CafeManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: CafeStatus) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600 font-bold">Active</Badge>;
      case 'suspended': return <Badge variant="destructive" className="font-bold">Suspended</Badge>;
      case 'trial': return <Badge variant="outline" className="border-blue-500 text-blue-500 font-bold">Trial</Badge>;
      case 'expired': return <Badge variant="secondary" className="font-bold">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-bold">Paid</Badge>;
      case 'unpaid': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 font-bold">Unpaid</Badge>;
      case 'overdue': return <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-bold">Overdue</Badge>;
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
          <Button variant="outline" className="gap-2 bg-card">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" className="gap-2 bg-card">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> Add New Cafe
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { title: "Total Cafes", value: "1,240", color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Active Cafes", value: "1,150", color: "text-green-600", bg: "bg-green-50" },
          { title: "Trial Cafes", value: "45", color: "text-orange-600", bg: "bg-orange-50" },
          { title: "Expired Subs", value: "12", color: "text-destructive", bg: "bg-red-50" },
          { title: "Suspended", value: "8", color: "text-gray-600", bg: "bg-gray-100" },
          { title: "New This Month", value: "124", color: "text-primary", bg: "bg-primary/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
              <div className="flex items-end justify-between mt-2">
                 <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                 <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                   <Store className={`h-4 w-4 ${stat.color}`} />
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            <Select defaultValue="all">
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
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/30">
                   <TableHead className="font-bold px-6">Cafe</TableHead>
                   <TableHead className="font-bold">Owner & Contact</TableHead>
                   <TableHead className="font-bold">City</TableHead>
                   <TableHead className="font-bold text-center">Plan</TableHead>
                   <TableHead className="font-bold text-center">Units</TableHead>
                   <TableHead className="font-bold">Expiry Date</TableHead>
                   <TableHead className="font-bold">Status</TableHead>
                   <TableHead className="font-bold">Payment</TableHead>
                   <TableHead className="font-bold text-right pr-6">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {CAFES.map((cafe) => (
                   <TableRow key={cafe.uuid} className="hover:bg-muted/10 group transition-colors">
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
                           <span className="font-medium flex items-center gap-1.5"><User className="h-3 w-3" /> {cafe.owner}</span>
                           <span className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" /> {cafe.email}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <span className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {cafe.city}</span>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge variant="outline" className="border-primary/30 text-primary">{cafe.plan}</Badge>
                     </TableCell>
                     <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <span className="text-sm font-bold">{cafe.branches} Br</span>
                           <span className="text-[10px] text-muted-foreground">{cafe.tables} Tb</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col">
                           <span className="text-sm font-medium">{cafe.expiryDate}</span>
                           <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {cafe.lastActivity}</span>
                        </div>
                     </TableCell>
                     <TableCell>{getStatusBadge(cafe.status)}</TableCell>
                     <TableCell>{getPaymentBadge(cafe.paymentStatus)}</TableCell>
                     <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/super-admin/cafes/${cafe.uuid}`}>
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
                                    <Link href={`/super-admin/cafes/${cafe.uuid}`} className="flex gap-2"><LayoutGrid className="h-4 w-4" /> View Details</Link>
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
        </CardContent>
      </Card>
    </div>
  );
}
