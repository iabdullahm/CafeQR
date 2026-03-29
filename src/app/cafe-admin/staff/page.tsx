"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { DataTableReusable } from "@/components/tables/data-table-reusable";
import { Plus, Users, Shield, ShieldAlert, Key, MoreHorizontal, UserCog } from "lucide-react";
import { 
   DropdownMenu, 
   DropdownMenuTrigger, 
   DropdownMenuContent, 
   DropdownMenuItem,
   DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { AuthGuard } from "@/components/auth-guard";
import { AddStaffModal } from "@/components/staff/add-staff-modal";

const MOCK_STAFF: any[] = [];

export default function StaffManagementPage() {
  const [staffData, setStaffData] = useState(MOCK_STAFF);

  const handleAddStaff = (newStaff: any) => {
    setStaffData(prev => [...prev, newStaff]);
  };

  return (
    <AuthGuard allowedRoles={["OWNER", "SUPER_ADMIN"]}>
      <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Staff Roles & Permissions" 
        description="Manage your team's access to the CafeQR portal."
        actions={<AddStaffModal onAdd={handleAddStaff} />}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-purple-500">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex gap-2 items-center">
               <ShieldAlert className="h-4 w-4 text-purple-500" /> Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground pb-2">Full system access, billing, and staff management.</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-blue-500">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex gap-2 items-center">
               <Shield className="h-4 w-4 text-blue-500" /> Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground pb-2">Daily operations, reports, menu, and loyalty.</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-amber-500">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex gap-2 items-center">
               <Users className="h-4 w-4 text-amber-500" /> Cashier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground pb-2">Orders, payments, and loyalty rewards.</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-green-500">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex gap-2 items-center">
               <UserCog className="h-4 w-4 text-green-500" /> Barista / Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground pb-2">Incoming orders and fulfillment status only.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card">
         <CardHeader>
           <div className="flex justify-between items-center mb-2">
             <CardTitle>Team Members</CardTitle>
             <div className="w-64">
                <Input placeholder="Search by name or email..." className="h-9" />
             </div>
           </div>
         </CardHeader>
         <CardContent className="p-0">
           <DataTableReusable 
             columns={[
               { key: "name", label: "Name", className: "font-semibold py-4 px-6" },
               { key: "email", label: "Email Address", className: "text-muted-foreground" },
               { 
                 key: "role", 
                 label: "Assigned Role",
                 render: (row) => (
                    <Badge variant="outline" className={
                       row.role === 'OWNER' ? 'bg-purple-500/10 text-purple-600 border-purple-200' :
                       row.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                       row.role === 'CASHIER' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                       'bg-green-500/10 text-green-600 border-green-200'
                    }>
                       {row.role}
                    </Badge>
                 )
               },
               { 
                 key: "status", 
                 label: "Status",
                 render: (row) => (
                    <div className="flex items-center gap-2">
                       <div className={`h-2 w-2 rounded-full ${row.status === 'Active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                       <span className="text-sm">{row.status}</span>
                    </div>
                 )
               },
               { key: "lastLogin", label: "Last Login", className: "text-muted-foreground text-sm" },
               { 
                 key: "actions", 
                 label: "Actions",
                 className: "text-right pr-6",
                 render: (row) => (
                    <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                             <MoreHorizontal className="h-4 w-4" />
                          </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                             <Shield className="h-4 w-4 text-muted-foreground" /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                             <Key className="h-4 w-4 text-muted-foreground" /> Reset Password
                          </DropdownMenuItem>
                          {row.role !== 'OWNER' && (
                             <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                   Remove Access
                                </DropdownMenuItem>
                             </>
                          )}
                       </DropdownMenuContent>
                    </DropdownMenu>
                 )
               }
             ]}
             data={staffData}
           />
         </CardContent>
      </Card>
    </div>
    </AuthGuard>
  );
}
