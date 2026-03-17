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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  UserPlus, 
  ShieldCheck, 
  Users, 
  UserCog, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Lock,
  Trash2,
  Edit,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Key,
  Ban
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SYSTEM_USERS = [
  { id: "USR-001", name: "Super Admin", email: "admin@cafeqr.com", role: "Super Admin", status: "active", lastLogin: "Just now", created: "Dec 01, 2024", phone: "90000000" },
  { id: "USR-002", name: "Ahmed Al Balushi", email: "owner@demo-cafe.com", role: "Cafe Owner", status: "active", lastLogin: "1 hour ago", created: "Dec 01, 2024", phone: "91111111" },
];

const ROLES_PERMISSIONS = [
  { 
    role: "Super Admin", 
    description: "Full system access including platform settings and root security.",
    userCount: 1,
    permissions: ["all"]
  },
  { 
    role: "Admin", 
    description: "Platform management access, managing cafes and subscriptions.",
    userCount: 0,
    permissions: ["view_dashboard", "manage_cafes", "manage_subs", "view_reports"]
  },
  { 
    role: "Cafe Owner", 
    description: "Full access to their owned cafe and branches.",
    userCount: 1,
    permissions: ["view_dashboard", "manage_branches", "manage_menu"]
  },
  { 
    role: "Support", 
    description: "Handles customer support and support tickets.",
    userCount: 0,
    permissions: ["view_dashboard", "view_support_tickets", "manage_support_tickets"]
  },
];

const PERMISSION_LIST = [
  { id: "view_dashboard", label: "View Dashboard", desc: "Access to the main overview and live metrics." },
  { id: "manage_cafes", label: "Manage Cafes", desc: "Ability to add, edit, and suspend tenant cafes." },
  { id: "manage_subscriptions", label: "Manage Subscriptions", desc: "View and modify cafe billing cycles." },
  { id: "manage_plans", label: "Manage Plans", desc: "Configure subscription tiers and limits." },
  { id: "manage_payments", label: "Manage Payments", desc: "Handle card payments and financial data." },
  { id: "manage_invoices", label: "Manage Invoices", desc: "Generate and manage platform invoices." },
  { id: "manage_support_tickets", label: "Manage Support", desc: "Respond to and resolve tenant issues." },
  { id: "impersonate_cafe_admin", label: "Impersonate", desc: "Login as a cafe administrator for troubleshooting." },
];

export default function UsersRolesManagement() {
  const [activeTab, setActiveTab] = useState("users");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600 font-bold">Active</Badge>;
      case 'suspended': return <Badge variant="destructive" className="font-bold">Suspended</Badge>;
      case 'pending': return <Badge variant="secondary" className="font-bold">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin': return <Badge className="bg-primary border-none font-bold">Super Admin</Badge>;
      case 'Cafe Owner': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 font-bold">Cafe Owner</Badge>;
      case 'Admin': return <Badge variant="secondary" className="font-bold">Admin</Badge>;
      case 'Support': return <Badge variant="outline" className="border-blue-500 text-blue-600 font-bold">Support</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Users & Roles</h1>
          <p className="text-muted-foreground mt-1">Manage internal platform access, team members, and security permissions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2 bg-card">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" className="gap-2 bg-card">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <UserPlus className="h-4 w-4" /> Add New User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users", value: "2", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Active Users", value: "2", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { title: "Super Admins", value: "1", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/5" },
          { title: "Cafe Owners", value: "1", icon: Store, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                <p className="text-xl font-black mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-card border p-1 h-auto mb-6">
          <TabsTrigger value="users" className="gap-2 px-6 h-10"><Users className="h-4 w-4" /> User Directory</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 px-6 h-10"><ShieldCheck className="h-4 w-4" /> Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input placeholder="Search users by name or email..." className="pl-10" />
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
                      <Filter className="h-4 w-4" /> Filters
                   </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                    <TableHeader>
                       <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                          <TableHead className="font-bold whitespace-nowrap px-6">System User</TableHead>
                          <TableHead className="font-bold whitespace-nowrap">Contact Information</TableHead>
                          <TableHead className="font-bold whitespace-nowrap">Access Role</TableHead>
                          <TableHead className="font-bold whitespace-nowrap">Account Status</TableHead>
                          <TableHead className="font-bold whitespace-nowrap">Security History</TableHead>
                          <TableHead className="font-bold whitespace-nowrap text-right pr-6">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {SYSTEM_USERS.map((user) => (
                         <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                                     {user.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="font-bold text-foreground leading-tight">{user.name}</span>
                                     <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter mt-0.5">{user.id}</span>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {user.email}</span>
                                  <span className="text-muted-foreground text-[11px] flex items-center gap-1.5 mt-1"><Phone className="h-3 w-3" /> {user.phone}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               {getRoleBadge(user.role)}
                            </TableCell>
                            <TableCell>
                               {getStatusBadge(user.status)}
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> Last login: {user.lastLogin}</span>
                                  <span className="text-muted-foreground text-[11px] flex items-center gap-1.5 mt-1"><Calendar className="h-3 w-3" /> Created: {user.created}</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                               <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                     <Edit className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                           <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>User Management</DropdownMenuLabel>
                                        <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Full Profile</DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2"><UserCog className="h-4 w-4" /> Re-assign Role</DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2"><Lock className="h-4 w-4" /> Audit Login History</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="gap-2"><Key className="h-4 w-4" /> Send Password Reset</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {user.status === 'active' ? (
                                          <DropdownMenuItem className="text-destructive gap-2 font-bold"><Ban className="h-4 w-4" /> Suspend Account</DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem className="text-green-600 gap-2 font-bold"><CheckCircle2 className="h-4 w-4" /> Activate Account</DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="text-destructive gap-2"><Trash2 className="h-4 w-4" /> Delete Permanently</DropdownMenuItem>
                                     </DropdownMenuContent>
                                  </DropdownMenu>
                               </div>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
           <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4 space-y-4">
                 <h2 className="text-lg font-bold px-1">Seeded Roles</h2>
                 <div className="space-y-3">
                    {ROLES_PERMISSIONS.map((r, i) => (
                      <Card key={i} className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${i === 0 ? 'border-l-primary bg-primary/5' : 'border-l-transparent'}`}>
                         <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                               <h3 className="font-bold text-primary">{r.role}</h3>
                               <Badge variant="secondary" className="h-5 text-[10px]">{r.userCount} Users</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                         </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" className="w-full border-dashed h-12 gap-2">
                       <Plus className="h-4 w-4" /> Create Custom Role
                    </Button>
                 </div>
              </div>

              <div className="lg:col-span-8">
                 <Card className="border-none shadow-sm bg-card h-full">
                    <CardHeader className="border-b">
                       <div className="flex items-center justify-between">
                          <div>
                             <CardTitle>Permissions Matrix</CardTitle>
                             <CardDescription>Managing seeded permissions for the <span className="text-primary font-bold">Super Admin</span> role.</CardDescription>
                          </div>
                          <Button size="sm" className="bg-primary">Save Changes</Button>
                       </div>
                    </CardHeader>
                    <CardContent className="p-6">
                       <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10 mb-8">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                   <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                   <p className="font-bold">Full System Override</p>
                                   <p className="text-xs text-muted-foreground">This role has bypass-all permissions by default (Seeded).</p>
                                </div>
                             </div>
                             <Switch checked={true} />
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                             {PERMISSION_LIST.map((p) => (
                               <div key={p.id} className="flex items-start gap-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                                  <Checkbox id={p.id} checked={true} className="mt-1" />
                                  <div className="grid gap-0.5 leading-none">
                                     <label htmlFor={p.id} className="text-sm font-bold leading-none cursor-pointer">
                                        {p.label}
                                     </label>
                                     <p className="text-xs text-muted-foreground mt-1">
                                        {p.desc}
                                     </p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </CardContent>
                 </Card>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
