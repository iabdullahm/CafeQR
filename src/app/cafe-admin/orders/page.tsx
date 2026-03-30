"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Clock, 
  Car, 
  Utensils, 
  Search,
  Download,
  RefreshCcw,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Timer,
  Ban,
  Receipt,
  FileText,
  MapPin,
  CheckCircle2,
  PackageOpen,
  Printer,
  Phone,
  Banknote
} from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, updateDoc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function OrderManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Safely grab the corresponding cafe Profile doc string connected to this user.
  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const cafeId = userProfile?.cafeId;

  // Retrieve matching cafe orders automatically 
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'cafes', cafeId, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, cafeId]);
  const { data: orders, isLoading } = useCollection(ordersQuery);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'ready': return 'bg-green-500/10 text-green-700 border-green-300';
      case 'completed': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'New';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  const getOrderType = (order: any) => {
    if (order.serviceType === 'CAR' || (order.tableId || '').toLowerCase().includes('car')) return 'From Car';
    if (order.serviceType === 'TAKEAWAY' || order.tableId === 'takeaway') return 'Pickup';
    return 'Dine-in';
  };

  const getPaymentStatus = (order: any) => {
    return order.paymentStatus || 'Paid'; // Defaulting for simple mock logic if empty
  };

  const getTimeAgo = (timestamp?: any) => {
    if (!timestamp) return "Just now";
    const dateValue = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    const minDiff = Math.floor((Date.now() - dateValue.getTime()) / 60000);
    
    if (minDiff < 1) return `Just now`;
    if (minDiff < 60) return `${minDiff} min ago`;
    const hrs = Math.floor(minDiff/60);
    const mins = minDiff % 60;
    return `${hrs}h ${mins}m ago`;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!db || !cafeId) return;
    try {
       setUpdatingId(orderId);
       const orderRef = doc(db, 'cafes', cafeId, 'orders', orderId);
       await updateDoc(orderRef, { status: newStatus });
       toast({ title: `Order ${newStatus}`, description: `Order status has been updated successfully.` });
    } catch (e: any) {
       toast({ title: "Error updating order", description: e.message, variant: "destructive" });
    } finally {
       setUpdatingId(null);
    }
  };

  const handlePrint = (type: string) => {
    toast({ title: `Printing ${type}...`, description: "Job sent to connected printer." });
  };

  const handleContactCustomer = (order: any) => {
    if (order.customerPhone) {
      window.open(`tel:${order.customerPhone}`, '_self');
    } else {
      toast({ title: "Cannot Contact", description: "No customer phone number available on this order.", variant: "destructive" });
    }
  };

  // KPIs & Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = useMemo(() => {
    let newOrd = 0, prep = 0, ready = 0, compToday = 0, canc = 0, revToday = 0;
    orders?.forEach(o => {
      const oDate = o.createdAt ? (typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt)) : new Date();
      const isToday = oDate >= today;
      const stat = o.status?.toLowerCase() || 'pending';

      if (stat === 'pending') newOrd++;
      if (stat === 'preparing') prep++;
      if (stat === 'ready') ready++;
      if (stat === 'cancelled') canc++;
      if (stat === 'completed' && isToday) {
        compToday++;
        revToday += (o.total || 0);
      }
    });

    return {
      newOrders: newOrd,
      preparing: prep,
      ready: ready,
      completedToday: compToday,
      cancelled: canc,
      revenueToday: revToday
    };
  }, [orders]);

  // Filtering
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      // Status
      if (statusFilter !== 'all' && (o.status?.toLowerCase() || 'pending') !== statusFilter) return false;
      
      // Type
      const rType = getOrderType(o);
      if (typeFilter !== 'all') {
        if (typeFilter === 'dine-in' && rType !== 'Dine-in') return false;
        if (typeFilter === 'car' && rType !== 'From Car') return false;
        if (typeFilter === 'pickup' && rType !== 'Pickup') return false;
      }

      // Payment Status (naive implementation assuming field exists)
      const pStatus = getPaymentStatus(o).toLowerCase();
      if (paymentFilter !== 'all' && pStatus !== paymentFilter.toLowerCase()) return false;

      // Date Filter
      const oDate = o.createdAt ? (typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt)) : new Date();
      const isToday = oDate >= today;
      if (dateFilter === 'today' && !isToday) return false;

      // Search (id, plate, notes, customer name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(query);
        const matchesPlate = o.carPlateNumber?.toLowerCase().includes(query);
        return matchesId || matchesPlate;
      }

      return true;
    });
  }, [orders, statusFilter, typeFilter, paymentFilter, dateFilter, searchQuery]);


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-primary flex items-center gap-3">
            Orders Management
            {isRefreshing && <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-muted-foreground">Track live, scheduled, and completed orders across your cafe.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-bold" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
          <Button className="gap-2 font-bold bg-primary text-primary-foreground">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/20 shadow-none cursor-pointer hover:bg-amber-500/20 transition-colors" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
            <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">New Orders</p>
            <h3 className="text-3xl font-black text-amber-900">{stats.newOrders}</h3>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-500/10 border-orange-500/20 shadow-none cursor-pointer hover:bg-orange-500/20 transition-colors" onClick={() => setStatusFilter('preparing')}>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
            <p className="text-orange-800 text-xs font-bold uppercase tracking-wider mb-1">Preparing</p>
            <h3 className="text-3xl font-black text-orange-900">{stats.preparing}</h3>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20 shadow-none cursor-pointer hover:bg-green-500/20 transition-colors" onClick={() => setStatusFilter('ready')}>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
            <p className="text-green-800 text-xs font-bold uppercase tracking-wider mb-1">Ready</p>
            <h3 className="text-3xl font-black text-green-900">{stats.ready}</h3>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none cursor-pointer hover:bg-emerald-500/20 transition-colors" onClick={() => setStatusFilter('completed')}>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
            <p className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">Completed Today</p>
            <h3 className="text-3xl font-black text-emerald-900">{stats.completedToday}</h3>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20 shadow-none cursor-pointer hover:bg-red-500/20 transition-colors" onClick={() => setStatusFilter('cancelled')}>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
            <p className="text-red-800 text-xs font-bold uppercase tracking-wider mb-1">Cancelled</p>
            <h3 className="text-3xl font-black text-red-900">{stats.cancelled}</h3>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20 shadow-none">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
            <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Revenue Today</p>
            <h3 className="text-xl md:text-2xl font-black text-primary">{stats.revenueToday.toFixed(3)} <span className="text-sm">OMR</span></h3>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filter Bar */}
      <Card className="shadow-sm border-muted">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by Order ID or Car Plate..." 
              className="pl-9 font-medium" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] font-medium">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dine-in">Dine-in</SelectItem>
              <SelectItem value="car">From Car</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">New</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] font-medium">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            className="font-bold text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
              setPaymentFilter("all");
              setDateFilter("today");
            }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* 4. Main Content Area - Table */}
      <Card className="shadow-sm border-muted overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">Order ID</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">Time / Ago</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap min-w-[150px]">Customer / Source</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">Type</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap text-right">Total</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap">Payment</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider whitespace-nowrap text-right min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>
                     <TableCell colSpan={8} className="py-6">
                        <div className="flex animate-pulse items-center space-x-4">
                          <div className="h-6 w-full bg-muted rounded-md" />
                        </div>
                     </TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                       <PackageOpen className="h-10 w-10 opacity-30" />
                       <span className="font-medium text-lg">No orders found matching filters</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map(order => {
                  const oDate = order.createdAt ? (typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate() : new Date(order.createdAt)) : new Date();
                  const timeStr = oDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const oType = getOrderType(order);
                  
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/40 transition-colors group">
                      <TableCell className="font-bold whitespace-nowrap text-emerald-700">
                        #{order.id.slice(-6).toUpperCase()}
                      </TableCell>
                      
                      <TableCell className="whitespace-nowrap">
                        <div className="font-bold text-sm">{timeStr}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                          <Clock className="w-3 h-3" /> {getTimeAgo(order.createdAt)}
                        </div>
                      </TableCell>

                      <TableCell>
                         <div className="font-bold text-sm">Guest Customer</div>
                         {oType === 'From Car' ? (
                            <div className="flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 rounded-sm w-fit px-1.5 py-0.5 mt-1 border border-amber-200">
                              <Car className="w-3 h-3" /> 
                              {order.carPlateNumber || order.tableId || 'N/A'} - Spot {order.parkingSpot}
                            </div>
                         ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium bg-muted/50 rounded-sm w-fit px-1.5 py-0.5 mt-1">
                              {oType === 'Dine-in' ? <Utensils className="w-3 h-3" /> : <PackageOpen className="w-3 h-3" />}
                              Table {order.table || order.tableId || 'Takeaway'}
                            </div>
                         )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm font-semibold">{oType}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">{order.items?.length || 0} items</div>
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-black text-primary">{(order.total || 0).toFixed(3)} OMR</span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={`font-bold uppercase tracking-wider px-2.5 py-1 ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {getPaymentStatus(order) === 'Paid' ? (
                            <div className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</div>
                          ) : (
                             <span className="text-muted-foreground">Unpaid</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={updatingId === order.id}>
                              {updatingId === order.id ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 font-medium">
                            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground tracking-wider font-bold">Manage Order</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => setSelectedOrderDetails(order)} className="cursor-pointer gap-2 font-bold focus:bg-muted">
                              <Eye className="w-4 h-4 text-muted-foreground" /> View Details
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {(order.status === 'pending' || !order.status) && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')} className="text-emerald-600 font-bold cursor-pointer gap-2 focus:bg-emerald-50 focus:text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" /> Accept Order
                              </DropdownMenuItem>
                            )}
                            {order.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'preparing')} className="text-orange-600 font-bold cursor-pointer gap-2 focus:bg-orange-50 focus:text-orange-700">
                                <Timer className="w-4 h-4" /> Start Preparing
                              </DropdownMenuItem>
                            )}
                            {order.status === 'preparing' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ready')} className="text-blue-600 font-bold cursor-pointer gap-2 focus:bg-blue-50 focus:text-blue-700">
                                <CheckCircle className="w-4 h-4" /> Mark as Ready
                              </DropdownMenuItem>
                            )}
                            {order.status === 'ready' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'completed')} className="text-emerald-600 font-bold cursor-pointer gap-2 focus:bg-emerald-50 focus:text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" /> Complete Order
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handlePrint('Receipt')} className="cursor-pointer gap-2">
                              <Receipt className="w-4 h-4 text-muted-foreground" /> Print Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrint('Kitchen Ticket')} className="cursor-pointer gap-2">
                              <Printer className="w-4 h-4 text-muted-foreground" /> Print Kitchen Ticket
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleContactCustomer(order)} className="cursor-pointer gap-2">
                              <Phone className="w-4 h-4 text-blue-500" /> Contact Customer
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')} className="text-red-600 font-bold cursor-pointer gap-2 focus:bg-red-50 focus:text-red-700">
                                <Ban className="w-4 h-4" /> Cancel Order
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'completed' || order.status === 'cancelled') && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'refunded')} className="text-red-600 font-bold cursor-pointer gap-2 focus:bg-red-50 focus:text-red-700">
                                <Banknote className="w-4 h-4" /> Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 5. Order Details Dialog */}
      <Dialog open={!!selectedOrderDetails} onOpenChange={(open) => !open && setSelectedOrderDetails(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrderDetails?.id?.slice(-6).toUpperCase()}</DialogTitle>
            <DialogDescription>
              Placed {selectedOrderDetails && getTimeAgo(selectedOrderDetails.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderDetails && (
             <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b pb-4">
                   <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Type</p>
                      <Badge variant="outline" className="font-bold">{getOrderType(selectedOrderDetails)}</Badge>
                   </div>
                   <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</p>
                      <Badge variant="outline" className={`font-bold ${getStatusColor(selectedOrderDetails.status)}`}>{getStatusLabel(selectedOrderDetails.status)}</Badge>
                   </div>
                </div>

                {getOrderType(selectedOrderDetails) === 'From Car' && (
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 pb-1 border-b border-amber-200/50">
                      <Car className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Car Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm pt-1">
                      <div><span className="text-muted-foreground text-xs font-bold uppercase">Plate:</span> <span className="font-bold">{selectedOrderDetails.carPlateNumber}</span></div>
                      <div><span className="text-muted-foreground text-xs font-bold uppercase">Spot:</span> <span className="font-bold text-amber-700">{selectedOrderDetails.parkingSpot}</span></div>
                      {(selectedOrderDetails.carModel || selectedOrderDetails.carColor) && (
                        <div className="col-span-2"><span className="text-muted-foreground text-xs font-bold uppercase">Vehicle:</span> <span className="font-medium text-xs">{selectedOrderDetails.carColor} {selectedOrderDetails.carModel}</span></div>
                      )}
                    </div>
                    {selectedOrderDetails.carNotes && (
                      <div className="pt-1 text-xs font-medium text-amber-800 italic border-t border-amber-200/30 mt-1">
                        "{selectedOrderDetails.carNotes}"
                      </div>
                    )}
                  </div>
                )}

                <div>
                   <h4 className="font-bold mb-3 text-sm border-b pb-2">Order Items</h4>
                   <div className="space-y-3">
                     {selectedOrderDetails.items?.map((item: any, i: number) => (
                       <div key={i} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                             <span className="font-bold">{item.quantity || item.qty}x {item.nameEn || item.name}</span>
                             {item.notes && <p className="text-xs text-amber-600 mt-0.5">Note: {item.notes}</p>}
                          </div>
                          <span className="font-medium font-bold text-primary">{(item.price * (item.quantity || item.qty)).toFixed(3)} OMR</span>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t">
                   <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Subtotal</span>
                      <span className="font-bold">{(selectedOrderDetails.subtotal || selectedOrderDetails.total || 0).toFixed(3)} OMR</span>
                   </div>
                   {(selectedOrderDetails.tax > 0) && (
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Tax</span>
                        <span className="font-bold">{(selectedOrderDetails.tax || 0).toFixed(3)} OMR</span>
                     </div>
                   )}
                   <div className="flex justify-between text-lg font-black pt-2 border-t mt-2">
                      <span>Total</span>
                      <span className="text-primary">{selectedOrderDetails.total?.toFixed(3)} OMR</span>
                   </div>
                </div>

                <div className="pt-4 flex gap-3 w-full border-t">
                   <Button variant="outline" className="flex-1 font-bold" onClick={() => handlePrint('Receipt')}>
                      <Receipt className="w-4 h-4 mr-2" /> Print
                   </Button>
                   <Button className="flex-1 font-bold bg-zinc-900 border-zinc-900 shadow-none text-white hover:bg-zinc-800" onClick={() => setSelectedOrderDetails(null)}>
                      Close
                   </Button>
                </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
