"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
   Settings,
   Wallet,
   Percent,
   Bell,
   Globe,
   ShieldAlert,
   Key,
   Smartphone,
   CheckCircle2,
   Save
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function CafeSettings() {
   const { user } = useUser();
   const db = useFirestore();
   const { toast } = useToast();

   const userProfileRef = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
   const { data: userProfile } = useDoc(userProfileRef);
   const cafeId = userProfile?.cafeId;

   const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
   const { data: configDoc } = useDoc(configRef);

   const [settings, setSettings] = useState({
      currency: "USD",
      language: "en",
      timezone: "est",
      activeOrderTypes: { dineIn: true, carService: true, pickup: true },
      taxes: { vat: "5", serviceCharge: "0" },
      notifications: { soundAlert: true, dailySummary: true, staffPush: true }
   });

   const [isSaving, setIsSaving] = useState(false);

   useEffect(() => {
      if (configDoc) {
         setSettings(prev => ({ ...prev, ...configDoc }));
      }
   }, [configDoc]);

   const handleSave = async () => {
      if (!db || !cafeId) return;
      setIsSaving(true);
      try {
         await setDoc(doc(db, 'cafes', cafeId, 'config', 'settings'), settings, { merge: true });
         toast({ title: "Settings Saved", description: "Your cafe configuration has been updated successfully." });
      } catch (e: any) {
         toast({ title: "Error", description: e.message || "Failed to save settings.", variant: "destructive" });
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
         <SectionHeader
            title="Settings & Configuration"
            description="Global platform settings, financial rules, and operational preferences."
            actions={
               <Button className="bg-primary gap-2" onClick={handleSave} disabled={isSaving || !cafeId}>
                  <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
                  {isSaving ? "Saving..." : "Save All Changes"}
               </Button>
            }
         />

         <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-card border p-1 h-auto flex flex-wrap mb-8">
               <TabsTrigger value="general" className="gap-2 h-10 px-6"><Settings className="h-4 w-4" /> General</TabsTrigger>
               <TabsTrigger value="finance" className="gap-2 h-10 px-6"><Wallet className="h-4 w-4" /> Finance & Tax</TabsTrigger>
               <TabsTrigger value="notifications" className="gap-2 h-10 px-6"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
               <TabsTrigger value="security" className="gap-2 h-10 px-6"><ShieldAlert className="h-4 w-4" /> Roles & Security</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
               <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                     <CardTitle>Global Preferences</CardTitle>
                     <CardDescription>Configure how your cafe operates on the platform.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                           <Label>Default Currency</Label>
                           <Select value={settings.currency} onValueChange={(val) => setSettings({ ...settings, currency: val })}>
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                                 <SelectItem value="OMR">OMR - Omani Rial</SelectItem>
                                 <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label>Dashboard Language</Label>
                           <Select value={settings.language} onValueChange={(val) => setSettings({ ...settings, language: val })}>
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="en">English (US)</SelectItem>
                                 <SelectItem value="ar">العربية (Arabic)</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label>Timezone</Label>
                           <Select value={settings.timezone} onValueChange={(val) => setSettings({ ...settings, timezone: val })}>
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="est">EST - New York (GMT-5)</SelectItem>
                                 <SelectItem value="gulf">GST - Gulf (GMT+4)</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

                     <div className="pt-4 border-t space-y-4">
                        <Label className="font-bold">Active Order Types</Label>
                        <div className="grid gap-4 md:grid-cols-3">
                           <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                              <div className="flex items-center gap-3">
                                 <CheckCircle2 className="h-4 w-4 text-primary" />
                                 <span className="text-sm font-medium">Dine-in</span>
                              </div>
                              <Switch
                                 checked={settings.activeOrderTypes.dineIn}
                                 onCheckedChange={(c) => setSettings({ ...settings, activeOrderTypes: { ...settings.activeOrderTypes, dineIn: c } })}
                              />
                           </div>
                           <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                              <div className="flex items-center gap-3">
                                 <CheckCircle2 className="h-4 w-4 text-primary" />
                                 <span className="text-sm font-medium">Car Service</span>
                              </div>
                              <Switch
                                 checked={settings.activeOrderTypes.carService}
                                 onCheckedChange={(c) => setSettings({ ...settings, activeOrderTypes: { ...settings.activeOrderTypes, carService: c } })}
                              />
                           </div>
                           <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                              <div className="flex items-center gap-3">
                                 <CheckCircle2 className="h-4 w-4 text-primary" />
                                 <span className="text-sm font-medium">Pickup / Takeaway</span>
                              </div>
                              <Switch
                                 checked={settings.activeOrderTypes.pickup}
                                 onCheckedChange={(c) => setSettings({ ...settings, activeOrderTypes: { ...settings.activeOrderTypes, pickup: c } })}
                              />
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="finance" className="space-y-6">
               <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                     <CardTitle>Taxes & Fees</CardTitle>
                     <CardDescription>Manage how taxes and service fees are calculated on orders.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                           <Label className="flex items-center gap-2"><Percent className="h-3 w-3" /> Sales Tax (VAT)</Label>
                           <div className="flex items-center gap-2">
                              <Input
                                 type="number"
                                 value={settings.taxes.vat}
                                 onChange={(e) => setSettings({ ...settings, taxes: { ...settings.taxes, vat: e.target.value } })}
                                 className="w-24"
                              />
                              <span className="text-sm font-medium">% Percentage</span>
                           </div>
                           <p className="text-xs text-muted-foreground italic">Applied to all product sub-totals.</p>
                        </div>
                        <div className="space-y-2">
                           <Label className="flex items-center gap-2"><Percent className="h-3 w-3" /> Service Charge</Label>
                           <div className="flex items-center gap-2">
                              <Input
                                 type="number"
                                 value={settings.taxes.serviceCharge}
                                 onChange={(e) => setSettings({ ...settings, taxes: { ...settings.taxes, serviceCharge: e.target.value } })}
                                 className="w-24"
                              />
                              <span className="text-sm font-medium">% Percentage</span>
                           </div>
                           <p className="text-xs text-muted-foreground italic">Optional fee for staff service.</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
               <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                     <CardTitle>System Notifications</CardTitle>
                     <CardDescription>Choose how you want to be alerted for new activity.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {[
                        { id: "soundAlert", label: "New Order Sound Alert", desc: "Plays a sound in the admin dashboard for every scan.", icon: Bell },
                        { id: "dailySummary", label: "Email Daily Summary", desc: "Send a sales report to the owner email every night.", icon: Globe },
                        { id: "staffPush", label: "Staff Mobile Push", desc: "Send push notifications to staff via browser API.", icon: Smartphone },
                     ].map((n: any, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                 <n.icon className="h-5 w-5" />
                              </div>
                              <div>
                                 <p className="font-bold">{n.label}</p>
                                 <p className="text-xs text-muted-foreground">{n.desc}</p>
                              </div>
                           </div>
                           <Switch
                              checked={settings.notifications[n.id as keyof typeof settings.notifications]}
                              onCheckedChange={(c) => setSettings({ ...settings, notifications: { ...settings.notifications, [n.id]: c } })}
                           />
                        </div>
                     ))}
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
               <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <div>
                           <CardTitle>Staff Roles</CardTitle>
                           <CardDescription>Manage who has access to your admin dashboard.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 font-bold"><Key className="h-4 w-4" /> Add Staff Account</Button>
                     </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground font-medium">
                        No staff accounts configured yet.
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>
         </Tabs>
      </div>
   );
}
