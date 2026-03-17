"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
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
  ExternalLink, 
  Mail, 
  MapPin, 
  Download, 
  RefreshCw, 
  Phone, 
  Calendar, 
  ChevronRight, 
  Clock, 
  User, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2,
  Trash2,
  Lock,
  LogIn,
  ClipboardList,
  QrCode,
  Users,
  ChefHat,
  MessageSquare,
  History,
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
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Mock Data for the Cafe Table
const CAFES = [
  { 
    id: "CAF-001", 
    name: "The Roast Coffee", 
    owner: "John Doe", 
    email: "john@roast.com", 
    phone: "+1 234 567 890",
    city: "New York",
    plan: "Premium", 
    status: "active", 
    paymentStatus: "paid",
    branches: 3, 
    tables: 24,
    orders: 1240,
    subStart: "Jan 12, 2024", 
    expiryDate: "Jan 12, 2025", 
    lastActivity: "2 mins ago",
    location: "Manhattan, NY"
  },
  { 
    id: "CAF-002", 
    name: "Bean & Brew", 
    owner: "Sarah Smith", 
    email: "sarah@bean.com", 
    phone: "+44 7700 900000",
    city: "London",
    plan: "Basic", 
    status: "active", 
    paymentStatus: "paid",
    branches: 1, 
    tables: 8,
    orders: 450,
    subStart: "Feb 05, 2024", 
    expiryDate: "Feb 05, 2025", 
    lastActivity: "15 mins ago",
    location: "Soho, London"
  },
  { 
    id: "CAF-003", 
    name: "Rustic Roast", 
    owner: "Mike Brown", 
    email: "mike@roast.co", 
    phone: "+971 50 123 4567",
    city: "Dubai",
    plan: "Pro", 
    status: "suspended", 
    paymentStatus: "past_due",
    branches: 2, 
    tables: 15,
    orders: 890,
    subStart: "Mar 01, 2023", 
    expiryDate: "Mar 01, 2024", 
    lastActivity: "3 days ago",
    location: "Downtown, Dubai"
  },
  { 
    id: "CAF-004", 
    name: "Urban Brew", 
    owner: "Elena Rossi", 
    email: "elena@urban.net", 
    phone: "+39 02 1234567",
    city: "Milan",
    plan: "Enterprise", 
    status: "active", 
    paymentStatus: "paid",
    branches: 12, 
    tables: 150,
    orders: 15400,
    subStart: "Mar 15, 2024", 
    expiryDate: "Mar 15, 2025", 
    lastActivity: "Just now",
    location: "Brera, Milan"
  },
  { 
    id: "CAF-005", 
    name: "Zen Coffee", 
    owner: "Kenji Sato", 
    email: "kenji@zen.jp", 
    phone: "+81 3 1234 5678",
    city: "Tokyo",
    plan: "Pro", 
    status: "active", 
    paymentStatus: "unpaid",
    branches: 5, 
    tables: 45,
    orders: 3200,
    subStart: "Apr 02, 2024", 
    expiryDate: "Apr 02, 2025", 
    lastActivity: "1 hour ago",
    location: "Shibuya, Tokyo"
  },
];

export default function CafeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCafe, setSelectedCafe] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600 font-bold">Active</Badge>;
      case 'suspended': return <Badge variant="destructive" className="font-bold">Suspended</Badge>;
      case 'pending': return <Badge variant="secondary" className="font-bold">Pending</Badge>;
      case 'trial': return <Badge variant="outline" className="border-blue-500 text-blue-500 font-bold">Trial</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-bold">Paid</Badge>;
      case 'unpaid': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 font-bold">Unpaid</Badge>;
      case 'past_due': return <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-bold">Past Due</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header section */}
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
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> Add New Cafe
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
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

      {/* Filter and Search Bar */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by cafe name, owner, email, city or phone..." 
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] h-11 bg-muted/30">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] h-11 bg-muted/30">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-11 gap-2 bg-card">
                <Filter className="h-4 w-4" /> Filters
              </Button>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[160px] h-11 bg-card">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="orders">Highest Orders</SelectItem>
                  <SelectItem value="revenue">Highest Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                   <TableHead className="font-bold whitespace-nowrap px-6">Cafe Name</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Owner & Contact</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">City</TableHead>
                   <TableHead className="font-bold whitespace-nowrap text-center">Plan</TableHead>
                   <TableHead className="font-bold whitespace-nowrap text-center">Branches/Tables</TableHead>
                   <TableHead className="font-bold whitespace-nowrap text-center">Total Orders</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Expiry Date</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Status</TableHead>
                   <TableHead className="font-bold whitespace-nowrap">Payment</TableHead>
                   <TableHead className="font-bold whitespace-nowrap text-right pr-6">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {CAFES.map((cafe) => (
                   <TableRow key={cafe.id} className="hover:bg-muted/10 group transition-colors">
                     <TableCell className="px-6">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                              {cafe.name.substring(0, 2).toUpperCase()}
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-foreground leading-tight">{cafe.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter mt-0.5">{cafe.id}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col text-sm">
                           <span className="font-medium flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" /> {cafe.owner}</span>
                           <span className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" /> {cafe.email}</span>
                           <span className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5"><Phone className="h-3 w-3" /> {cafe.phone}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <span className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {cafe.city}</span>
                     </TableCell>
                     <TableCell className="text-center">
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-2.5">{cafe.plan}</Badge>
                     </TableCell>
                     <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <span className="text-sm font-bold">{cafe.branches} B</span>
                           <span className="text-[10px] text-muted-foreground">{cafe.tables} Tables</span>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <span className="font-bold text-sm">{cafe.orders.toLocaleString()}</span>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col">
                           <span className="text-sm font-medium">{cafe.expiryDate}</span>
                           <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Last: {cafe.lastActivity}</span>
                        </div>
                     </TableCell>
                     <TableCell>{getStatusBadge(cafe.status)}</TableCell>
                     <TableCell>{getPaymentBadge(cafe.paymentStatus)}</TableCell>
                     <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                           <Sheet>
                              <SheetTrigger asChild>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => setSelectedCafe(cafe)}
                                 >
                                    <ChevronRight className="h-5 w-5" />
                                 </Button>
                              </SheetTrigger>
                              <SheetContent className="w-full sm:max-w-3xl p-0 flex flex-col" side="right">
                                 <SheetHeader className="p-6 border-b bg-muted/20">
                                    <div className="flex items-start justify-between">
                                       <div className="flex items-center gap-4">
                                          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary">
                                             {selectedCafe?.name.substring(0, 2).toUpperCase()}
                                          </div>
                                          <div>
                                             <SheetTitle className="text-2xl font-black text-primary">{selectedCafe?.name}</SheetTitle>
                                             <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-green-600">Active</Badge>
                                                <Badge variant="outline">{selectedCafe?.plan} Plan</Badge>
                                                <span className="text-xs text-muted-foreground font-medium">ID: {selectedCafe?.id}</span>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <Button size="sm" variant="outline" className="gap-2"><LogIn className="h-4 w-4" /> Login as Admin</Button>
                                          <DropdownMenu>
                                             <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="ghost" className="h-9 w-9 p-0"><MoreHorizontal className="h-5 w-5" /></Button>
                                             </DropdownMenuTrigger>
                                             <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2"><ExternalLink className="h-4 w-4" /> View Live Site</DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2"><Lock className="h-4 w-4" /> Reset Password</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive gap-2"><Trash2 className="h-4 w-4" /> Delete Cafe</DropdownMenuItem>
                                             </DropdownMenuContent>
                                          </DropdownMenu>
                                       </div>
                                    </div>
                                 </SheetHeader>
                                 <ScrollArea className="flex-1">
                                    <div className="p-6">
                                       <Tabs defaultValue="overview" className="w-full">
                                          <TabsList className="bg-muted p-1 h-auto flex flex-wrap mb-6">
                                             <TabsTrigger value="overview" className="gap-2"><LayoutGrid className="h-4 w-4" /> Overview</TabsTrigger>
                                             <TabsTrigger value="subscription" className="gap-2"><CreditCard className="h-4 w-4" /> Subscription</TabsTrigger>
                                             <TabsTrigger value="branches" className="gap-2"><Store className="h-4 w-4" /> Branches</TabsTrigger>
                                             <TabsTrigger value="tables" className="gap-2"><LayoutGrid className="h-4 w-4" /> Tables</TabsTrigger>
                                             <TabsTrigger value="menu" className="gap-2"><ChefHat className="h-4 w-4" /> Menu</TabsTrigger>
                                             <TabsTrigger value="orders" className="gap-2"><ClipboardList className="h-4 w-4" /> Orders</TabsTrigger>
                                             <TabsTrigger value="qr" className="gap-2"><QrCode className="h-4 w-4" /> QR Codes</TabsTrigger>
                                             <TabsTrigger value="loyalty" className="gap-2"><Users className="h-4 w-4" /> Loyalty</TabsTrigger>
                                             <TabsTrigger value="payments" className="gap-2"><Wallet className="h-4 w-4" /> Payments</TabsTrigger>
                                             <TabsTrigger value="support" className="gap-2"><MessageSquare className="h-4 w-4" /> Tickets</TabsTrigger>
                                             <TabsTrigger value="logs" className="gap-2"><History className="h-4 w-4" /> Logs</TabsTrigger>
                                          </TabsList>
                                          
                                          <TabsContent value="overview" className="space-y-6">
                                             <div className="grid gap-4 md:grid-cols-2">
                                                <Card className="shadow-none bg-muted/30 border-dashed">
                                                   <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase text-muted-foreground">Owner Information</CardTitle></CardHeader>
                                                   <CardContent className="space-y-3">
                                                      <div className="flex items-center justify-between text-sm">
                                                         <span className="text-muted-foreground">Full Name</span>
                                                         <span className="font-bold">{selectedCafe?.owner}</span>
                                                      </div>
                                                      <div className="flex items-center justify-between text-sm">
                                                         <span className="text-muted-foreground">Email Address</span>
                                                         <span className="font-bold underline text-primary">{selectedCafe?.email}</span>
                                                      </div>
                                                      <div className="flex items-center justify-between text-sm">
                                                         <span className="text-muted-foreground">Phone Number</span>
                                                         <span className="font-bold">{selectedCafe?.phone}</span>
                                                      </div>
                                                   </CardContent>
                                                </Card>
                                                <Card className="shadow-none bg-muted/30 border-dashed">
                                                   <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase text-muted-foreground">Location Details</CardTitle></CardHeader>
                                                   <CardContent className="space-y-3">
                                                      <div className="flex items-center justify-between text-sm">
                                                         <span className="text-muted-foreground">City</span>
                                                         <span className="font-bold">{selectedCafe?.city}</span>
                                                      </div>
                                                      <div className="flex items-center justify-between text-sm">
                                                         <span className="text-muted-foreground">Location</span>
                                                         <span className="font-bold">{selectedCafe?.location}</span>
                                                      </div>
                                                   </CardContent>
                                                </Card>
                                             </div>
                                             
                                             <div className="grid grid-cols-3 gap-4">
                                                <div className="p-4 rounded-xl border bg-card text-center">
                                                   <p className="text-xs font-bold text-muted-foreground uppercase">Revenue</p>
                                                   <p className="text-xl font-black mt-1">$45.2k</p>
                                                </div>
                                                <div className="p-4 rounded-xl border bg-card text-center">
                                                   <p className="text-xs font-bold text-muted-foreground uppercase">Orders</p>
                                                   <p className="text-xl font-black mt-1">1.2k</p>
                                                </div>
                                                <div className="p-4 rounded-xl border bg-card text-center">
                                                   <p className="text-xs font-bold text-muted-foreground uppercase">Avg. Ticket</p>
                                                   <p className="text-xl font-black mt-1">$32.5</p>
                                                </div>
                                             </div>
                                          </TabsContent>
                                          <TabsContent value="subscription" className="p-12 text-center space-y-4">
                                             <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                                             <p className="text-muted-foreground">Subscription management details for <b>{selectedCafe?.name}</b></p>
                                             <Button className="bg-primary">Manage Billing</Button>
                                          </TabsContent>
                                          {/* Add placeholders for other tabs to keep the UI clean */}
                                          {["branches", "tables", "menu", "orders", "qr", "loyalty", "payments", "support", "logs"].map(tab => (
                                             <TabsContent key={tab} value={tab} className="p-12 text-center text-muted-foreground italic">
                                                Details for {tab} will appear here.
                                             </TabsContent>
                                          ))}
                                       </Tabs>
                                    </div>
                                 </ScrollArea>
                              </SheetContent>
                           </Sheet>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <MoreHorizontal className="h-4 w-4" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                 <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                 <DropdownMenuItem className="gap-2"><LayoutGrid className="h-4 w-4" /> View Details</DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2"><Store className="h-4 w-4" /> Edit Cafe</DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2"><CreditCard className="h-4 w-4" /> View Subscription</DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2"><RefreshCw className="h-4 w-4" /> Renew Subscription</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem className="gap-2"><LogIn className="h-4 w-4" /> Login as Admin</DropdownMenuItem>
                                 <DropdownMenuItem className="gap-2"><ClipboardList className="h-4 w-4" /> View Orders</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 {cafe.status === 'active' ? (
                                    <DropdownMenuItem className="text-destructive gap-2 font-bold"><AlertCircle className="h-4 w-4" /> Suspend Account</DropdownMenuItem>
                                 ) : (
                                    <DropdownMenuItem className="text-green-600 gap-2 font-bold"><CheckCircle2 className="h-4 w-4" /> Activate Account</DropdownMenuItem>
                                 )}
                                 <DropdownMenuItem className="text-destructive gap-2"><Trash2 className="h-4 w-4" /> Delete Cafe</DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
           
           <div className="p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Showing 5 of 1,240 registered cafes</p>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" className="h-9 px-4 font-bold" disabled>Previous</Button>
                 <div className="flex items-center gap-1">
                    <Button variant="secondary" size="sm" className="h-9 w-9 p-0 font-bold">1</Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 font-bold">2</Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 font-bold">3</Button>
                    <span className="mx-1 text-muted-foreground">...</span>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 font-bold">124</Button>
                 </div>
                 <Button variant="outline" size="sm" className="h-9 px-4 font-bold">Next</Button>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Wallet } from "lucide-react";
