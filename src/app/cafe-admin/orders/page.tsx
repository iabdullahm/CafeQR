"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  Coffee, 
  Car, 
  Utensils, 
  ChevronRight, 
  AlertCircle 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INITIAL_ORDERS = [
  { id: "101", table: "T-04", type: "dine-in", status: "preparing", total: 24.50, items: ["2x Espresso", "1x Croissant"], time: "5m ago" },
  { id: "102", table: "Car-01", type: "car-order", status: "confirmed", total: 12.00, items: ["1x Iced Latte"], time: "8m ago" },
  { id: "103", table: "T-02", type: "dine-in", status: "ready", total: 31.20, items: ["1x Pancake Stack", "2x Orange Juice"], time: "12m ago" },
  { id: "104", table: "T-09", type: "dine-in", status: "pending", total: 8.50, items: ["1x Flat White"], time: "Just now" },
];

export default function OrderManagement() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'preparing': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'ready': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Order Management</h1>
        <p className="text-muted-foreground">Keep track of customer orders across all tables.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {orders.map((order) => (
          <Card key={order.id} className="relative overflow-hidden flex flex-col">
            {order.status === 'pending' && <div className="absolute top-0 left-0 w-full h-1 bg-accent animate-pulse" />}
            <CardHeader className="pb-3">
               <div className="flex items-center justify-between">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {order.type === 'dine-in' ? <Utensils className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                    {order.table}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {order.time}
                  </span>
               </div>
               <CardTitle className="text-lg flex items-center justify-between mt-2">
                 Order #{order.id}
                 <span className="text-primary font-bold">${order.total.toFixed(2)}</span>
               </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm font-medium">{item}</p>
                ))}
              </div>
              
              <div className="pt-4 border-t space-y-3">
                 <Label className="text-xs text-muted-foreground">Status</Label>
                 <Select defaultValue={order.status}>
                    <SelectTrigger className={getStatusColor(order.status)}>
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
                 <Button className="w-full bg-primary h-11 text-lg gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Next Phase
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
