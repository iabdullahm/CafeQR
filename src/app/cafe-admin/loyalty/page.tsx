"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Switch } from "@/components/ui/switch";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, Users, Gift, TrendingUp, History, Save, Edit3, Plus, Settings, Target, CheckCircle2, Ticket } from "lucide-react";
import { useState } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function LoyaltyManagement() {
  const [cupsReq, setCupsReq] = useState(5);
  const { user } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile } = useDoc(userProfileRef);
  const userRole = profile?.role || "STAFF";
  const isManagerOrAbove = ["OWNER", "SUPER_ADMIN", "MANAGER"].includes(userRole);
  const isOwnerOrSuperAdmin = ["OWNER", "SUPER_ADMIN"].includes(userRole);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Loyalty Program" 
        description="Manage your cup-based reward model to increase customer retention. Customers earn cups towards a free drink."
        actions={
          <div className="flex gap-2">
            {isOwnerOrSuperAdmin && (
               <Button variant="outline" className="gap-2"><Settings className="h-4 w-4" /> Enable/Disable Program</Button>
            )}
            <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Manual Adjustment</Button>
            {isManagerOrAbove && (
               <Button className="bg-primary gap-2"><Save className="h-4 w-4" /> Save Settings</Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-none shadow-sm bg-card">
           <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                 <Users className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Members</p>
              <p className="text-2xl font-black mt-1">0</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
           <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-600 mb-2">
                 <Coffee className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cups Collected</p>
              <p className="text-2xl font-black mt-1">0</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
           <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-green-600/10 flex items-center justify-center text-green-600 mb-2">
                 <Gift className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rewards Earned</p>
              <p className="text-2xl font-black mt-1">0</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
           <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 mb-2">
                 <Ticket className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rewards Redeemed</p>
              <p className="text-2xl font-black mt-1">0</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
           <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-rose-600/10 flex items-center justify-center text-rose-600 mb-2">
                 <Target className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Near Reward (1 Left)</p>
              <p className="text-2xl font-black mt-1">0</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
           <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-600 mb-2">
                 <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redemption Rate</p>
              <p className="text-2xl font-black mt-1">0%</p>
           </CardContent>
        </Card>
      </div>

      {isManagerOrAbove && (
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>Program Settings</CardTitle>
                    <CardDescription>Configure cup thresholds, applicability, and reward details.</CardDescription>
                 </div>
                 <div className="flex items-center gap-2">
                    <Label className="font-bold text-sm">Program Active</Label>
                    <Switch defaultChecked />
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 border rounded-2xl">
                  <div className="space-y-3">
                     <Label className="font-bold text-sm">Cups Required for Reward</Label>
                     <p className="text-xs text-muted-foreground">Number of cups to reach a free item</p>
                     <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={() => setCupsReq(prev => Math.max(1, prev - 1))}>-</Button>
                        <span className="text-lg font-black w-8 text-center">{cupsReq}</span>
                        <Button variant="outline" size="icon" onClick={() => setCupsReq(prev => prev + 1)}>+</Button>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <Label className="font-bold text-sm">Reward Item</Label>
                     <p className="text-xs text-muted-foreground">What the customer gets for free</p>
                     <Select defaultValue="any_coffee">
                       <SelectTrigger>
                         <SelectValue placeholder="Select reward" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="any_coffee">Any Standard Coffee</SelectItem>
                         <SelectItem value="any_drink">Any Drink (Including Cold)</SelectItem>
                         <SelectItem value="specific_item">Specific Item</SelectItem>
                         <SelectItem value="flat_discount">Flat Money Discount</SelectItem>
                       </SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <h4 className="font-bold text-sm flex items-center gap-2">
                        Eligible Purchases
                     </h4>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Count Only Coffee Items</Label>
                           <Switch defaultChecked />
                        </div>
                        <p className="text-[10px] text-muted-foreground">If disabled, any menu item purhcase grants a cup.</p>
                     </div>
                     <div className="space-y-3 pt-2">
                        <Label className="text-sm font-medium">Eligible Categories</Label>
                        <Select defaultValue="hot,cold">
                           <SelectTrigger>
                              <SelectValue placeholder="Select categories" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              <SelectItem value="hot,cold">Hot & Cold Drinks</SelectItem>
                              <SelectItem value="custom">Custom Selection...</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <h4 className="font-bold text-sm flex items-center gap-2">
                        Cycle & Branch Rules
                     </h4>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Auto-Reset Cycle</Label>
                           <Switch defaultChecked />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Restart tracking cups immediately after reward is earned.</p>
                     </div>
                     <div className="space-y-3 pt-2">
                        <Label className="text-sm font-medium">Branch Applicability</Label>
                        <Select defaultValue="all">
                           <SelectTrigger>
                              <SelectValue placeholder="Select branches" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Branches</SelectItem>
                              <SelectItem value="current">Current Branch Only</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <Card className="border-none shadow-sm bg-gradient-to-br from-primary/10 via-card to-accent/5">
              <CardHeader>
                <CardTitle className="flex flex-row items-center justify-between">
                   <span className="text-lg">Reward Preview</span>
                   <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active Logic</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="text-center p-4 bg-white/50 dark:bg-black/50 rounded-2xl border border-primary/20 shadow-sm backdrop-blur-md">
                    <h3 className="text-xl font-black mb-1">Buy {cupsReq} Coffees</h3>
                    <p className="text-primary font-bold">→ Get 1 Free</p>
                 </div>

                 <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase text-center tracking-widest">Customer View Example</p>
                    <div className="flex justify-center flex-wrap gap-3">
                       {Array.from({ length: cupsReq }).map((_, i) => (
                          <div key={i} className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 
                             ${i < 3 ? 'border-primary bg-primary/10' : 'border-dashed border-muted-foreground/30 bg-muted/10'}`}>
                             {i < 3 ? (
                                <Coffee className="h-5 w-5 text-primary" />
                             ) : (
                                <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>
                             )}
                             
                             {i === 2 && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full h-4 w-4 flex items-center justify-center border-2 border-card">
                                   <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                             )}
                          </div>
                       ))}
                       <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-500/10 scale-110 shadow-sm">
                          <Gift className="h-6 w-6 text-amber-600" />
                       </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground font-medium pt-2">
                      Customer needs {cupsReq - 3} more cups for a free coffee!
                    </p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
      )}

      <Card className="border-none shadow-sm bg-card">
         <Tabs defaultValue="members" className="w-full">
           <CardHeader className="pb-0 border-b">
              <div className="flex items-center justify-between mb-2">
                 <div>
                   <CardTitle>Loyalty Data</CardTitle>
                   <CardDescription>Track member progress and recent reward transactions.</CardDescription>
                 </div>
                 <TabsList className="bg-muted h-10">
                   <TabsTrigger value="members" className="flex gap-2"><Users className="h-4 w-4" /> Members</TabsTrigger>
                   <TabsTrigger value="transactions" className="flex gap-2"><History className="h-4 w-4" /> Transactions</TabsTrigger>
                 </TabsList>
              </div>
           </CardHeader>
           <CardContent className="p-0">
             <TabsContent value="members" className="m-0 border-none outline-none">
                <DataTableReusable 
                  columns={[
                     { key: "name", label: "Customer Name", className: "font-semibold" },
                     { 
                        key: "cups", 
                        label: "Collected Cups",
                        render: (row) => (
                           <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                             {row.cups} Cups
                           </Badge>
                        )
                     },
                     { 
                        key: "remaining", 
                        label: "Remaining",
                        render: (row) => (
                           <span className={row.remaining <= 1 ? "text-rose-600 font-bold" : "text-muted-foreground font-medium"}>
                             {row.remaining} Left
                           </span>
                        )
                     },
                     { key: "earned", label: "Free Rewards Earned" },
                     { key: "redeemed", label: "Rewards Redeemed" },
                     { key: "lastVisit", label: "Last Visit", className: "text-muted-foreground italic text-sm" },
                     { 
                        key: "actions", 
                        label: "Actions",
                        render: () => (
                           <Button variant="ghost" size="sm" className="h-8">Details</Button>
                        )
                     }
                  ]}
                  data={[] as any[]}
                />
             </TabsContent>
             <TabsContent value="transactions" className="m-0 border-none outline-none">
                <DataTableReusable 
                  columns={[
                     { key: "customer", label: "Customer", className: "font-semibold" },
                     { 
                        key: "action", 
                        label: "Action Type",
                        render: (row) => (
                           <div className="flex items-center gap-2">
                             {row.action === 'Cup Added' && <Coffee className="h-4 w-4 text-blue-500" />}
                             {row.action === 'Reward Earned' && <Gift className="h-4 w-4 text-green-500" />}
                             {row.action === 'Reward Redeemed' && <Ticket className="h-4 w-4 text-amber-500" />}
                             {row.action === 'Manual Adjustment' && <Edit3 className="h-4 w-4 text-purple-500" />}
                             <span>{row.action}</span>
                           </div>
                        )
                     },
                     { key: "count", label: "Cups Count", className: "font-bold" },
                     { key: "reward", label: "Reward Item" },
                     { key: "date", label: "Date", className: "text-muted-foreground text-sm" },
                     { 
                        key: "status", 
                        label: "Status",
                        render: (row) => (
                           <Badge variant="outline" className={
                             row.status === 'Completed' ? 'bg-blue-500/10 text-blue-600' :
                             row.status === 'Active' ? 'bg-green-500/10 text-green-600' :
                             'bg-gray-500/10 text-gray-600'
                           }>
                             {row.status}
                           </Badge>
                        )
                     }
                  ]}
                  data={[] as any[]}
                />
             </TabsContent>
           </CardContent>
         </Tabs>
      </Card>
    </div>
  );
}
