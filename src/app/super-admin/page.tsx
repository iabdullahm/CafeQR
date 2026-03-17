import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, CreditCard, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminDashboard() {
  const stats = [
    { title: "Total Cafes", value: "124", icon: Store, trend: "+12%" },
    { title: "Active Users", value: "8.4k", icon: Users, trend: "+5%" },
    { title: "Revenue", value: "$45,231", icon: CreditCard, trend: "+18%" },
    { title: "Growth", value: "22%", icon: TrendingUp, trend: "+2%" },
  ];

  const recentCafes = [
    { name: "Coffee Haven", status: "active", plan: "Premium", joinDate: "2024-03-10" },
    { name: "The Bean Sprout", status: "active", plan: "Basic", joinDate: "2024-03-09" },
    { name: "Rustic Roast", status: "suspended", plan: "Pro", joinDate: "2024-03-08" },
    { name: "Urban Brew", status: "active", plan: "Enterprise", joinDate: "2024-03-07" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back, Platform Manager.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                {stat.trend} <span className="text-muted-foreground">vs last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Cafe Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cafe Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Join Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCafes.map((cafe) => (
                  <TableRow key={cafe.name}>
                    <TableCell className="font-medium">{cafe.name}</TableCell>
                    <TableCell>{cafe.plan}</TableCell>
                    <TableCell>
                      <Badge variant={cafe.status === 'active' ? 'default' : 'destructive'}>
                        {cafe.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{cafe.joinDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enterprise Plan</span>
              <span className="text-sm text-muted-foreground font-bold">12%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: '12%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pro Plan</span>
              <span className="text-sm text-muted-foreground font-bold">38%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: '38%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Basic Plan</span>
              <span className="text-sm text-muted-foreground font-bold">50%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: '50%' }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
