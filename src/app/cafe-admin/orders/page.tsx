"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  Car, 
  Utensils, 
  Coffee
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, updateDoc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function OrderManagement() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'preparing': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'ready': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'completed': return 'bg-teal-500/10 text-teal-600 border-teal-200';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getTimeAgo = (timestamp?: any) => {
    if (!timestamp) return "Just now";
    
    // Handle Firestore Timestamp or ISO string
    const dateValue = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    const minDiff = Math.floor((Date.now() - dateValue.getTime()) / 60000);
    
    if (minDiff < 1) return `Just now`;
    if (minDiff < 60) return `${minDiff}m ago`;
    const hrs = Math.floor(minDiff/60);
    return `${hrs}h ago`;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!db || !cafeId) return;
    try {
       setUpdatingId(orderId);
       const orderRef = doc(db, 'cafes', cafeId, 'orders', orderId);
       await updateDoc(orderRef, { status: newStatus });
       toast({ title: "Status Updated", description: `Order is now ${newStatus}.` });
    } catch (e: any) {
       toast({ title: "Error updating order", description: e.message, variant: "destructive" });
    } finally {
       setUpdatingId(null);
    }
  };

  const handleNextPhase = (orderId: string, currentStatus: string) => {
    const phases = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const idx = phases.indexOf(currentStatus?.toLowerCase() || 'pending');
    if (idx !== -1 && idx < phases.length - 1) {
      handleStatusChange(orderId, phases[idx + 1]);
    } else {
      toast({ title: "Order already completed" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Order Management</h1>
        <p className="text-muted-foreground">Keep track of customer orders across all tables.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
           [1,2,3,4].map(i => <div key={i} className="h-[300px] rounded-3xl bg-muted animate-pulse" />)
        ) : orders?.length === 0 ? (
           <div className="col-span-full border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-muted-foreground text-center">
             <Coffee className="h-12 w-12 mb-4 opacity-50" />
             <p className="text-xl font-bold">No Active Orders</p>
             <p className="text-sm">Wait for customers to place orders from their tables.</p>
           </div>
        ) : (
          orders?.map((order) => (
            <Card key={order.id} className="relative overflow-hidden flex flex-col shadow-sm border-none bg-card group">
              {order.status === 'pending' && <div className="absolute top-0 left-0 w-full h-1 bg-accent animate-pulse" />}
              <CardHeader className="pb-3 bg-muted/5 border-b">
                 <div className="flex items-center justify-between">
                    <Badge variant="outline" className="flex items-center gap-1 font-bold">
                      {(order.type === 'dine-in' || !order.type) ? <Utensils className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                      {order.table || order.tableId || 'N/A'}
                    </Badge>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="h-3 w-3" /> {getTimeAgo(order.createdAt)}
                    </span>
                 </div>
                 <CardTitle className="text-lg flex items-center justify-between mt-2 font-black">
                   <span className="text-muted-foreground text-sm uppercase">#{order.id.slice(-6)}</span>
                   <span className="text-primary font-bold">OMR {(order.total || 0).toFixed(3)}</span>
                 </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-4">
                <div className="space-y-2 min-h-[100px] bg-muted/10 p-3 rounded-xl border border-muted/20">
                  {order.items?.length > 0 ? order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-bold">{item.quantity || item.qty}x {item.name || item.nameEn}</span>
                      {item.notes && <span className="text-xs text-amber-600 block w-full mt-1">Note: {item.notes}</span>}
                    </div>
                  )) : (
                     <p className="text-sm italic text-muted-foreground">Order items empty</p>
                  )}
                </div>
                
                <div className="pt-2 space-y-3">
                   <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</Label>
                   <Select 
                     value={order.status?.toLowerCase()} 
                     onValueChange={(v) => handleStatusChange(order.id, v)}
                     disabled={updatingId === order.id}
                   >
                      <SelectTrigger className={`font-bold capitalize ${getStatusColor(order.status)}`}>
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="pending">Pending</SelectItem>
                         <SelectItem value="confirmed">Confirmed</SelectItem>
                         <SelectItem value="preparing">Preparing</SelectItem>
                         <SelectItem value="ready">Ready</SelectItem>
                         <SelectItem value="completed">Completed</SelectItem>
                         <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                   </Select>
                   {order.status !== 'completed' && order.status !== 'cancelled' && (
                     <Button 
                        disabled={updatingId === order.id}
                        onClick={() => handleNextPhase(order.id, order.status)}
                        className="w-full bg-primary h-11 font-bold gap-2 text-foreground rounded-xl"
                     >
                        <CheckCircle2 className="h-4 w-4" /> Next Phase
                     </Button>
                   )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
