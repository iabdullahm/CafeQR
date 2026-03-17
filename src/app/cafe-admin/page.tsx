import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardList, ShoppingBag, Users, TrendingUp, Coffee, QrCode, Star, Utensils, Car, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatCard } from "@/components/dashboard/stat-card";
import Link from "next/link";

export default function CafeAdminDashboard() {
  const stats = [
    { title: "Active Orders", value: "12", icon: <ClipboardList />, color: "text-blue-600", trend: "+2 now" },
    { title: "Today's Sales", value: "$842.50", icon: <ShoppingBag />, color: "text-green-600", trend: "+15% vs yesterday" },
    { title: "Active Tables", value: "18 / 24", icon: <Utensils />, color: "text-primary", trend: "75% occupancy" },
    { title: "New Loyalty Users", value: "8", icon: <Star />, color: "text-accent", trend: "+12% this week" },
  ];

  const recentOrders = [
    { id: "105", table: "T-04", type: "dine-in", status: "preparing", total: "$24.50", items: "2x Espresso, 1x Croissant" },
    { id: "104", table: "Car-01", type: "car-order", status: "confirmed", total: "$12.00", items: "1x Iced Latte" },
    { id: "103", table: "T-02", type: "dine-in", status: "ready", total: "$31.20", items: "1x Pancake Stack, 1x Orange Juice" },
  ];

  const topSelling = [
    { name: "House Blend Coffee", count: 124, revenue: "$558.00" },
    { name: "Caramel Macchiato", count: 98, revenue: "$539.00" },
    { name: "Avocado Toast", count: 45, revenue: "$540.00" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Operations Overview" 
        description="Monitor your cafe's performance and manage live orders."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <Link href="/cafe-admin/qr-codes"><QrCode className="h-4 w-4" /> Print QRs</Link>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2" asChild>
              <Link href="/cafe-admin/products"><Plus className="h-4 w-4" /> Add Product</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard 
            key={stat.title} 
            title={stat.title} 
            value={stat.value} 
            icon={stat.icon} 
            iconColor={stat.color}
            description={stat.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-none shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Live Order Stream</CardTitle>
              <CardDescription>Real-time updates from scan-to-order.</CardDescription>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href="/cafe-admin/orders" className="text-primary font-bold">View Full Board</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">#{order.id}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{order.table}</p>
                        {order.type === 'dine-in' ? <Utensils className="h-3 w-3 text-muted-foreground" /> : <Car className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{order.items}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.total}</p>
                    <Badge variant={order.status === 'ready' ? 'default' : 'secondary'} className="capitalize text-[10px] h-5 px-2">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Top Selling Today</CardTitle>
              <CardDescription>Most ordered items by customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topSelling.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">{i+1}</div>
                      <p className="text-sm font-medium">{item.name}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold">{item.count} orders</p>
                       <p className="text-[10px] text-muted-foreground">{item.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coffee className="h-24 w-24 text-white" />
             </div>
             <CardHeader>
                <CardTitle className="text-lg">Quick Tip</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-sm opacity-90 italic">
                  "Your peak hours are between 9:00 AM and 11:00 AM. Ensure you have extra staff on the Floor branch."
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
