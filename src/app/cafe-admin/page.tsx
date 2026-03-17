import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CafeAdminDashboard() {
  const stats = [
    { title: "Active Orders", value: "8", icon: ClipboardList, color: "text-blue-600" },
    { title: "Today's Sales", value: "$1,432", icon: ShoppingBag, color: "text-green-600" },
    { title: "Loyalty Users", value: "452", icon: Users, color: "text-primary" },
    { title: "Avg. Wait Time", value: "12m", icon: TrendingUp, color: "text-accent" },
  ];

  const liveOrders = [
    { id: "101", table: "T-04", type: "dine-in", status: "preparing", total: "$24.50" },
    { id: "102", table: "Car-01", type: "car-order", status: "confirmed", total: "$12.00" },
    { id: "103", table: "T-02", type: "dine-in", status: "ready", total: "$31.20" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Cafe Dashboard</h1>
          <p className="text-muted-foreground">Monitor your business performance in real-time.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 border-primary text-primary">Main Branch</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Live Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center font-bold text-primary">#{order.id}</div>
                    <div>
                      <p className="font-bold">{order.table}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.total}</p>
                    <Badge variant={order.status === 'ready' ? 'default' : 'secondary'} className="capitalize text-[10px] h-5">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours (Today)</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-end justify-between gap-2 px-2">
             {[30, 45, 60, 90, 100, 80, 50, 40].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                   <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: `${h}%` }}>
                      {h > 80 && <div className="absolute inset-0 bg-accent/40 rounded-t-sm" />}
                   </div>
                   <span className="text-[10px] text-muted-foreground">{9+i}:00</span>
                </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
