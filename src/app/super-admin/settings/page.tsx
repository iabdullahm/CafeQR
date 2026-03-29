"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  UserCog, 
  Network, 
  Server, 
  Code2, 
  Save, 
  Upload, 
  RotateCcw, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ExternalLink,
  History
} from "lucide-react";
import Link from "next/link";

const TABS = [
  { id: "general", label: "General", icon: Settings, desc: "Manage platform identity and defaults." },
  { id: "billing", label: "Billing & Plans", icon: CreditCard, desc: "Configure subscriptions and payment gateways." },
  { id: "security", label: "Security", icon: ShieldCheck, desc: "Password policies, 2FA, and access control." },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "SMTP, push, and event alerts." },
  { id: "roles", label: "Roles & Permissions", icon: UserCog, desc: "Default roles and template access." },
  { id: "integrations", label: "Integrations", icon: Network, desc: "API keys for third-party services." },
  { id: "system", label: "System", icon: Server, desc: "Maintenance mode, backups, and rate limits." },
  { id: "developer", label: "Developer", icon: Code2, desc: "Environment flags, debug mode, and URLs." },
];

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmActionText, setConfirmActionText] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // System States
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    // If sensitive modes are being enabled, demand confirmation
    if (activeTab === "system" && maintenanceMode) {
      setConfirmActionText("You are about to enable Maintenance Mode. This will kick all active users out of the system. Are you sure?");
      setShowConfirmModal(true);
      return;
    }
    if (activeTab === "developer" && debugMode) {
      setConfirmActionText("Enabling Debug Mode might expose sensitive stack traces to users. Proceed?");
      setShowConfirmModal(true);
      return;
    }

    commitSave();
  };

  const commitSave = () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }, 1000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Platform Branding</CardTitle>
                <CardDescription>Upload your logos and set the platform URL.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold cursor-pointer">Platform Name</Label>
                    <Input placeholder="Platform Name" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold cursor-pointer">Platform URL</Label>
                    <Input placeholder="https://" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label className="font-bold block mb-1">Brand Logo</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors bg-muted/10">
                       <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
                       <p className="text-sm font-medium">Upload Logo</p>
                       <p className="text-xs text-muted-foreground mt-1">PNG, SVG (Max 2MB)</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold block mb-1">Favicon</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors bg-muted/10">
                       <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
                       <p className="text-sm font-medium">Upload Favicon</p>
                       <p className="text-xs text-muted-foreground mt-1">ICO, PNG (32x32px)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Localization Defaults</CardTitle>
                <CardDescription>Set the default language, timezone, and currency for new tenants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 grid sm:grid-cols-3 gap-6">
                <div className="space-y-2 w-full mt-0">
                  <Label className="font-bold">Default Timezone</Label>
                  <Select >
                    <SelectTrigger className="bg-muted/30 rounded-xl h-11 w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem><SelectItem value="gmt">GMT</SelectItem><SelectItem value="est">EST</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full mt-0">
                  <Label className="font-bold">Default Language</Label>
                  <Select >
                    <SelectTrigger className="bg-muted/30 rounded-xl h-11 w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="en">English</SelectItem><SelectItem value="ar">Arabic</SelectItem><SelectItem value="fr">French</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full mt-0">
                  <Label className="font-bold">Default Currency</Label>
                  <Select >
                    <SelectTrigger className="bg-muted/30 rounded-xl h-11 w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="aed">AED (د.إ)</SelectItem><SelectItem value="eur">EUR (€)</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Support Information</CardTitle>
                <CardDescription>Contact methods displayed globally for tenant help menus.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 grid sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="font-bold">Support Email</Label>
                    <Input placeholder="support@domain.com" className="bg-muted/30 rounded-xl h-11" />
                 </div>
                 <div className="space-y-2">
                    <Label className="font-bold">Support Phone (Optional)</Label>
                    <Input placeholder="+1 800 123 4567" className="bg-muted/30 rounded-xl h-11" />
                 </div>
              </CardContent>
            </Card>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Subscription Rules</CardTitle>
                <CardDescription>Configure how tenants are grouped and charged.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center p-4 border rounded-xl bg-primary/5 border-primary/20">
                  <div>
                    <h3 className="font-bold text-lg">Enable Paid Subscriptions</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[400px]">Enforce paywalls locking access to modules when subscriptions expire. If off, platform is 100% free.</p>
                  </div>
                  <Switch className="scale-125 origin-right" />
                </div>
                
                <div className="flex flex-col gap-6 pt-2">
                  <div className="flex items-center justify-between">
                     <div className="space-y-0.5"><Label className="font-bold text-base">Offer Free Trial</Label><p className="text-sm text-muted-foreground">Automatically enroll new cafes in a trial.</p></div>
                     <Switch />
                  </div>
                  <div className="flex items-center justify-between border-t pt-6">
                     <div className="space-y-0.5"><Label className="font-bold text-base">Auto Renew</Label><p className="text-sm text-muted-foreground">Charge saved cards automatically on expiry.</p></div>
                     <Switch />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 pt-6 border-t">
                  <div className="space-y-2">
                    <Label className="font-bold">Trial Duration (Days)</Label>
                    <Input type="number" placeholder="e.g. 14" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">VAT Percentage (%)</Label>
                    <Input type="number" placeholder="e.g. 5" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Invoice Prefix</Label>
                    <Input placeholder="e.g. INV-" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Stripe Config</CardTitle>
                <CardDescription>API Keys for your main payment gateway.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                 <div className="space-y-2">
                    <Label className="font-bold">Publishable Key</Label>
                    <Input placeholder="pk_live_..." className="bg-muted/30 rounded-xl h-11 font-mono text-sm" />
                 </div>
                 <div className="space-y-2">
                    <Label className="font-bold">Secret Key</Label>
                    <div className="relative">
                       <Input type={showSecret["stripe"] ? "text" : "password"} placeholder="sk_live_..." className="bg-muted/30 rounded-xl h-11 font-mono text-sm pr-10" />
                       <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-11 w-11 rounded-xl" onClick={() => toggleSecret("stripe")}>
                          {showSecret["stripe"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </Button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="font-bold">Webhook Secret</Label>
                    <div className="relative">
                       <Input type={showSecret["webhook"] ? "text" : "password"} placeholder="whsec_..." className="bg-muted/30 rounded-xl h-11 font-mono text-sm pr-10" />
                       <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-11 w-11 rounded-xl" onClick={() => toggleSecret("webhook")}>
                          {showSecret["webhook"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </Button>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Authentication Policy</CardTitle>
                <CardDescription>Control how users log in and session constraints.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2 border p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                       <Label className="font-bold text-base">Two-Factor Auth (2FA)</Label>
                       <Switch />
                    </div>
                    <p className="text-sm text-muted-foreground">Force Super Admins to use 2FA on login.</p>
                  </div>
                  <div className="space-y-2 border p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                       <Label className="font-bold text-base">Force Logout</Label>
                       <Switch />
                    </div>
                    <p className="text-sm text-muted-foreground">Evict sessions from other devices on password change.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Session Timeout (Mins)</Label>
                    <Input type="number" placeholder="120" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Login Attempt Limit</Label>
                    <Input type="number" placeholder="e.g. 5" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Lockout Duration (Mins)</Label>
                    <Input type="number" placeholder="30" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t mt-6">
                   <Label className="font-bold">IP Whitelist (For Super Admins)</Label>
                   <p className="text-xs text-muted-foreground mb-3">Leave empty to allow all IPs. separate IPs by commas.</p>
                   <Textarea placeholder="192.168.1.1, 10.0.0.1" className="min-h-[100px] bg-muted/30 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "system":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className={`shadow-sm rounded-2xl border-2 transition-colors ${maintenanceMode ? 'border-red-500 bg-red-50/10' : 'border-muted/50'}`}>
              <CardHeader className="pb-4 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Maintenance Mode</CardTitle>
                     <CardDescription className="mt-1">Disables the Cafe dashboards and displays a maintenance screen.</CardDescription>
                   </div>
                   <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} className="scale-125" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                 {maintenanceMode && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                       <Label className="font-bold">Maintenance Notice</Label>
                       <Textarea 
                          placeholder="Enter maintenance notice..." 
                          className="bg-white rounded-xl focus-visible:ring-red-500 border-red-200" 
                       />
                    </div>
                 )}
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>System Jobs & API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-xl">
                     <div className="space-y-0.5"><Label className="font-bold">Registration Enabled</Label><p className="text-xs text-muted-foreground">Allow new signups on homepage.</p></div>
                     <Switch />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-xl">
                     <div className="space-y-0.5"><Label className="font-bold">Run Cron Jobs</Label><p className="text-xs text-muted-foreground">Execute daily background billing checks.</p></div>
                     <Switch />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label className="font-bold">API Rate Limit (Req/min)</Label>
                    <Input type="number" placeholder="1000" className="bg-muted/30 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Log Level</Label>
                    <Select >
                      <SelectTrigger className="bg-muted/30 rounded-xl h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="rounded-xl"><SelectItem value="info">Info</SelectItem><SelectItem value="warn">Warn</SelectItem><SelectItem value="error">Error</SelectItem><SelectItem value="debug">Debug</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Auto Backup</Label>
                    <Select >
                      <SelectTrigger className="bg-muted/30 rounded-xl h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="rounded-xl"><SelectItem value="none">Disabled</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "developer":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-amber-500/10">
                <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="text-amber-600 flex items-center gap-2"><Code2 className="h-5 w-5" /> Developer Settings</CardTitle>
                     <CardDescription className="mt-1">Danger zone: only edit these if you understand the technical implications.</CardDescription>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                 <div className="flex items-center justify-between p-4 border rounded-xl border-amber-500/20 bg-amber-500/5">
                     <div className="space-y-0.5"><Label className="font-bold text-amber-900">Enable Debug Mode</Label><p className="text-xs text-amber-800/70">Exposes stack traces in API responses.</p></div>
                     <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                 </div>
                 <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                       <Label className="font-bold">Environment</Label>
                       <Select >
                         <SelectTrigger className="bg-muted/30 rounded-xl h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                         <SelectContent className="rounded-xl"><SelectItem value="development">Development</SelectItem><SelectItem value="staging">Staging</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold">Sandbox Payment Mode</Label>
                       <Select >
                         <SelectTrigger className="bg-muted/30 rounded-xl h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                         <SelectContent className="rounded-xl"><SelectItem value="off">Off (Live Processing)</SelectItem><SelectItem value="on">On (Mock Transactions)</SelectItem></SelectContent>
                       </Select>
                    </div>
                 </div>
                 <div className="space-y-2 pt-4 border-t mt-4">
                    <Label className="font-bold">Feature Flags (JSON)</Label>
                    <Textarea 
                       defaultValue='{&#10;  "beta_reports": true,&#10;  "new_billing_engine": false&#10;}' 
                       className="min-h-[140px] font-mono text-xs bg-[#1E1E1E] text-[#D4D4D4] rounded-xl border-0 p-4" 
                    />
                 </div>
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Delivery Channels</CardTitle>
                <CardDescription>Configure how platform messages are delivered to tenants and users.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border p-4 rounded-xl flex items-center justify-between">
                     <span className="font-bold flex items-center gap-2">Email</span>
                     <Switch />
                  </div>
                  <div className="border p-4 rounded-xl flex items-center justify-between">
                     <span className="font-bold flex items-center gap-2">SMS</span>
                     <Switch />
                  </div>
                  <div className="border p-4 rounded-xl flex items-center justify-between">
                     <span className="font-bold flex items-center gap-2">Push</span>
                     <Switch />
                  </div>
                  <div className="border p-4 rounded-xl flex items-center justify-between">
                     <span className="font-bold flex items-center gap-2">WhatsApp</span>
                     <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>Your outbound email server settings for platform emails.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                 <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="font-bold">Sender Name</Label>
                       <Input placeholder="e.g. CafeQR" className="bg-muted/30 rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold">Sender Email</Label>
                       <Input placeholder="noreply@domain.com" className="bg-muted/30 rounded-xl h-11" />
                    </div>
                 </div>
                 <div className="grid sm:grid-cols-3 gap-6 pt-2">
                    <div className="space-y-2">
                       <Label className="font-bold">SMTP Host</Label>
                       <Input placeholder="smtp.example.com" className="bg-muted/30 rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold">SMTP Port</Label>
                       <Input placeholder="587" className="bg-muted/30 rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold">Authentication</Label>
                       <Select >
                         <SelectTrigger className="bg-muted/30 rounded-xl h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                         <SelectContent className="rounded-xl"><SelectItem value="none">None</SelectItem><SelectItem value="tls">TLS</SelectItem><SelectItem value="ssl">SSL</SelectItem></SelectContent>
                       </Select>
                    </div>
                 </div>
                 <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                       <Label className="font-bold">SMTP Username</Label>
                       <Input placeholder="user@domain.com" className="bg-muted/30 rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold">SMTP Password</Label>
                       <div className="relative">
                          <Input type={showSecret["smtp"] ? "text" : "password"} placeholder="password" className="bg-muted/30 rounded-xl h-11 pr-10" />
                          <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-11 w-11 rounded-xl" onClick={() => toggleSecret("smtp")}>
                             {showSecret["smtp"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                       </div>
                    </div>
                 </div>
              </CardContent>
            </Card>

             <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>System Events</CardTitle>
                <CardDescription>Which events should trigger a notification to Super Admins?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                 <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-0.5"><Label className="font-bold">New Tenant Signup</Label><p className="text-sm text-muted-foreground">When a new cafe owner registers.</p></div>
                    <Switch />
                 </div>
                 <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-0.5"><Label className="font-bold">Subscription Cancellation</Label><p className="text-sm text-muted-foreground">When a tenant cancels their paid plan.</p></div>
                    <Switch />
                 </div>
                 <div className="flex items-center justify-between py-2 border-b">
                    <div className="space-y-0.5"><Label className="font-bold">Elevated Support Ticket</Label><p className="text-sm text-muted-foreground">Alert when a priority ticket is opened.</p></div>
                    <Switch />
                 </div>
                 <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5"><Label className="font-bold">Backup Failure</Label><p className="text-sm text-muted-foreground">Critical alert if database backup fails.</p></div>
                    <Switch />
                 </div>
              </CardContent>
            </Card>
          </div>
        );

      case "roles":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Default Roles & Permissions</CardTitle>
                <CardDescription>Set the baseline access scopes for new accounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                 <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2 w-full mt-0">
                      <Label className="font-bold">Default Cafe Owner Role</Label>
                      <Select >
                        <SelectTrigger className="bg-muted/30 rounded-xl h-11 w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="owner_basic">Basic Owner (Limited)</SelectItem>
                          <SelectItem value="owner_pro">Pro Owner (Full Access)</SelectItem>
                          <SelectItem value="manager">Manager (No Billing)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">The RBAC template assigned on registration.</p>
                    </div>
                    <div className="space-y-2 w-full mt-0">
                      <Label className="font-bold">Base Permission Template</Label>
                      <Select >
                        <SelectTrigger className="bg-muted/30 rounded-xl h-11 w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="v1_legacy">V1 Legacy Core</SelectItem>
                          <SelectItem value="v2_strict">V2 Strict Scopes (Recommended)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Determines the underlying policy engine version.</p>
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t mt-4">
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-orange-50/50 border-orange-200">
                       <div className="space-y-0.5"><Label className="font-bold text-orange-800">Restrict Sensitive Actions</Label><p className="text-sm text-orange-700/70">Require Super Admin approval for cafe deletion or domain changes.</p></div>
                       <Switch />
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-sm rounded-2xl border-muted/50">
              <CardHeader className="pb-4 border-b bg-muted/10">
                <CardTitle>Third-Party Integrations</CardTitle>
                <CardDescription>Manage API keys and connections to external systems.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                 
                 {/* Firebase */}
                 <div className="p-6 border rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                       <div>
                          <h4 className="font-bold text-lg flex items-center gap-2">Firebase</h4>
                          <p className="text-sm text-muted-foreground">Auth, Firestore, and Cloud Storage</p>
                       </div>
                       <Button variant="outline" size="sm" className="rounded-lg h-9 shadow-sm">Test Connection</Button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project ID</Label>
                          <Input placeholder="Project ID" className="bg-muted/30 h-10 rounded-xl" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Web API Key</Label>
                          <div className="relative">
                             <Input type={showSecret["firebase"] ? "text" : "password"} placeholder="AIza..." className="bg-muted/30 h-10 rounded-xl pr-10" />
                             <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10 rounded-xl" onClick={() => toggleSecret("firebase")}>
                                {showSecret["firebase"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             </Button>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* WhatsApp */}
                 <div className="p-6 border rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                       <div>
                          <h4 className="font-bold text-lg flex items-center gap-2">WhatsApp Business API</h4>
                          <p className="text-sm text-muted-foreground">For sending receipt and order updates</p>
                       </div>
                       <Button variant="outline" size="sm" className="rounded-lg h-9 shadow-sm">Test Connection</Button>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Access Token</Label>
                       <div className="relative">
                          <Input type={showSecret["whatsapp"] ? "text" : "password"} placeholder="EAAQ..." className="bg-muted/30 h-10 rounded-xl pr-10" />
                          <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10 rounded-xl" onClick={() => toggleSecret("whatsapp")}>
                             {showSecret["whatsapp"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                       </div>
                    </div>
                 </div>

                 {/* Google Maps / Analytics */}
                 <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-xl space-y-4">
                       <div className="border-b pb-4">
                          <h4 className="font-bold text-base">Google Maps API</h4>
                          <p className="text-xs text-muted-foreground">For cafe location finders</p>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">API Key</Label>
                          <Input type={showSecret["maps"] ? "text" : "password"} placeholder="AIza..." className="bg-muted/30 h-10 rounded-xl" />
                       </div>
                    </div>
                    <div className="p-6 border rounded-xl space-y-4">
                       <div className="border-b pb-4">
                          <h4 className="font-bold text-base">Google Analytics</h4>
                          <p className="text-xs text-muted-foreground">Platform tracking property</p>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Measurement ID</Label>
                          <Input placeholder="G-XXXX..." className="bg-muted/30 h-10 rounded-xl" />
                       </div>
                    </div>
                 </div>

              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
      
      {/* Top Banner Sticky */}
      <div className="sticky top-[64px] z-20 bg-white/80 backdrop-blur-md border-b shadow-sm -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            Platform-wide configuration and security defaults. 
            <span className="hidden sm:inline-flex items-center text-xs ml-2 px-2 py-0.5 rounded bg-muted">
              Last updated: Just now
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 rounded-xl shadow-sm hidden md:flex">
             <RotateCcw className="h-4 w-4 mr-2" /> Reset Section
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="h-11 rounded-xl px-8 shadow-md relative overflow-hidden group">
             {showSuccessToast ? (
                <span className="flex items-center gap-2 text-green-400 font-bold"><CheckCircle2 className="h-4 w-4" /> Saved!</span>
             ) : (
                <span className="flex items-center gap-2 font-bold"><Save className="h-4 w-4 group-hover:scale-110 transition-transform" /> {isSaving ? "Saving..." : "Save Changes"}</span>
             )}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
               <AlertTriangle className="h-5 w-5" /> Critical Change Warning
            </DialogTitle>
            <DialogDescription className="pt-3 text-base">
               {confirmActionText}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)} className="rounded-xl h-11">Cancel</Button>
            <Button variant="destructive" onClick={commitSave} className="rounded-xl h-11 shadow-md">Confirm & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-1">
          <nav className="flex flex-col space-y-1 block lg:sticky top-[180px]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground font-bold shadow-md"
                    : "hover:bg-muted/60 text-muted-foreground font-medium"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                <span>{tab.label}</span>
              </button>
            ))}
            
            <div className="border-t my-4"></div>
            
            <Link href="/super-admin/audit-logs">
              <button className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-left text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium group">
                <div className="flex items-center gap-3">
                   <History className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                   <span>Audit Logs</span>
                </div>
                <ExternalLink className="h-4 w-4 opacity-50" />
              </button>
            </Link>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-9">
           <div className="mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold font-headline">{TABS.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-muted-foreground mt-1">{TABS.find(t => t.id === activeTab)?.desc}</p>
           </div>
           {renderContent()}
        </div>

      </div>
    </div>
  );
}
