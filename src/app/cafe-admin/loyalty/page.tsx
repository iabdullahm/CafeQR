"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Star, Users, Gift, TrendingUp, ShieldCheck, History, Save, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DataTableReusable } from "@/components/tables/data-table-reusable";

export default function LoyaltyManagement() {
  const recentHistory = [
    { id: "1", customer: "Sarah Johnson", type: "Earned", points: "+45", date: "Today, 2:15 PM", spend: "$45.00" },
    { id: "2", customer: "Michael Chen", type: "Redeemed", points: "-100", date: "Today, 1:40 PM", spend: "1x Free Latte" },
    { id: "3", customer: "Elena Rodriguez", type: "Earned", points: "+12", date: "Today, 12:20 PM", spend: "$12.00" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Loyalty Program" 
        description="Configure how customers earn and redeem rewards to build lasting relationships."
        actions={<Button className="bg-primary gap-2"><Save className="h-4 w-4" /> Save Rules</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
         <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex flex-col items-center text-center">
               <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Users className="h-5 w-5" />
               </div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Members</p>
               <p className="text-2xl font-black mt-1">452</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex flex-col items-center text-center">
               <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
                  <Gift className="h-5 w-5" />
               </div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase">Rewards Claimed</p>
               <p className="text-2xl font-black mt-1">1,240</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex flex-col items-center text-center">
               <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 mb-2">
                  <Star className="h-5 w-5" />
               </div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase">Points in Circulation</p>
               <p className="text-2xl font-black mt-1">24.5k</p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex flex-col items-center text-center">
               <div className="h-10 w-10 rounded-full bg-green-600/10 flex items-center justify-center text-green-600 mb-2">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg. Member Spend</p>
               <p className="text-2xl font-black mt-1">$31.40</p>
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Loyalty Rules</CardTitle>
              <CardDescription>Configure point earning and redemption values.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
                  <div>
                    <p className="font-bold">Program Status</p>
                    <p className="text-xs text-muted-foreground">Enable or disable the entire loyalty system for customers.</p>
                  </div>
                  <Switch checked={true} />
               </div>

               <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Earning Rule</Label>
                    <div className="flex items-center gap-2">
                       <Input type="number" defaultValue="1" className="w-20" />
                       <span className="text-sm font-medium">Points for every</span>
                       <Input type="number" defaultValue="1" className="w-20" />
                       <span className="text-sm font-medium">USD spent</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Current: $1.00 = 1 Point</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Redemption Value</Label>
                    <div className="flex items-center gap-2">
                       <Input type="number" defaultValue="100" className="w-24" />
                       <span className="text-sm font-medium">Points =</span>
                       <Input type="number" defaultValue="5" className="w-24" />
                       <span className="text-sm font-medium">USD Discount</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Current: 20 Points = $1.00 Value</p>
                  </div>
               </div>

               <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">Tiered Benefits</Label>
                    <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-bold"><Plus className="h-3.5 w-3.5" /> Add Tier</Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                     <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-center">
                        <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary border-primary/30">Silver</Badge>
                        <p className="text-xs font-bold">0+ Points</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Standard Earning</p>
                     </div>
                     <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-center">
                        <Badge variant="secondary" className="mb-2 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Gold</Badge>
                        <p className="text-xs font-bold">1000+ Points</p>
                        <p className="text-[10px] text-muted-foreground mt-1">1.2x Earning Multiplier</p>
                     </div>
                     <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 text-center">
                        <Badge variant="secondary" className="mb-2 bg-sky-500/20 text-sky-600 border-sky-500/30">Platinum</Badge>
                        <p className="text-xs font-bold">5000+ Points</p>
                        <p className="text-[10px] text-muted-foreground mt-1">1.5x Multiplier + Free Birthday Drink</p>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" /> Recent Point Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <DataTableReusable 
                columns={[
                  { key: "customer", label: "Customer" },
                  { 
                    key: "points", 
                    label: "Points",
                    render: (row) => (
                      <span className={row.type === 'Earned' ? 'text-green-600 font-bold' : 'text-destructive font-bold'}>
                        {row.points}
                      </span>
                    )
                  },
                  { key: "spend", label: "Transaction" },
                  { key: "date", label: "Time", className: "text-right pr-6" },
                ]}
                data={recentHistory}
               />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <Card className="border-none shadow-sm bg-card border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Promotion Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label className="text-sm">Welcome Points</Label>
                    <Input type="number" defaultValue="50" className="w-16 h-8 text-xs" />
                 </div>
                 <div className="flex items-center justify-between">
                    <Label className="text-sm">Double Points Days</Label>
                    <Badge variant="outline" className="cursor-pointer">Manage Schedule</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                    <Label className="text-sm">Points Expiry (Days)</Label>
                    <Input type="number" defaultValue="365" className="w-16 h-8 text-xs" />
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-accent text-accent-foreground">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Fraud Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-xs opacity-80">Limits points per customer per day to prevent system abuse.</p>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Max Daily Points</span>
                    <Input type="number" defaultValue="500" className="w-20 bg-white/20 border-white/30 h-8 text-xs" />
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
