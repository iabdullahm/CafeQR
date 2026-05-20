"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChangeRoleModal } from "@/components/staff/change-role-modal";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const MOCK_STAFF: any[] = [];

export default function StaffManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const userProfileRef = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);
  const cafeId = userProfile?.cafeId;

  const configRef = useMemoFirebase(() => db && cafeId ? doc(db, 'cafes', cafeId, 'config', 'settings') : null, [db, cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

  const staffQuery = useMemoFirebase(() => {
    if (!db || !cafeId) return null;
    return query(collection(db, 'users'), where('cafeId', '==', cafeId));
  }, [db, cafeId]);

  const { data: firestoreStaff } = useCollection(staffQuery);
  const staffData = firestoreStaff || [];

  const { toast } = useToast();

  const handleAddStaff = (newStaff: any) => {
    // We don't need to do anything here because we will write to firestore directly in the modal
  };

  const handleRemoveAccess = async (staffId: string) => {
    if (confirm(t("Are you sure you want to remove this staff member's access?", "هل أنت متأكد من إزالة صلاحية هذا الموظف؟"))) {
       try {
         await deleteDoc(doc(db, 'users', staffId));
         toast({ title: t("Success", "نجاح"), description: t("Staff member removed.", "تم إزالة الموظف بنجاح.") });
       } catch (error) {
         toast({ title: t("Error", "خطأ"), description: t("Failed to remove staff.", "فشل في إزالة الموظف."), variant: "destructive" });
       }
    }
  };

  const getRoleCount = (role: string) => staffData.filter((s: any) => s.role === role).length;

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="font-bold text-lg mb-2 text-foreground">{t("No team members yet", "لا يوجد أعضاء في الفريق بعد")}</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm leading-relaxed">
          {t("Add your staff to start managing orders and operations.", "قم بإضافة موظفين لبدء إدارة الطلبات وتشغيل الكافيه")}
        </p>
        <AddStaffModal onAdd={handleAddStaff} customTrigger={
          <Button size="lg" className="bg-primary rounded-xl font-bold shadow-md">
            <Plus className="h-4 w-4 mr-2" /> {t("Add Staff Member", "إضافة موظف")}
          </Button>
        } />
    </div>
  );

  return (
    <AuthGuard allowedRoles={["OWNER", "SUPER_ADMIN"]}>
      <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title={t("Staff Roles & Permissions", "صلاحيات وأدوار الموظفين")} 
        description={t("Manage your team's access to the CafeQR portal.", "إدارة وصول فريقك إلى بوابة CafeQR.")}
        actions={
          <div className="flex items-center gap-3">
             <AddStaffModal onAdd={handleAddStaff} />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-purple-500 overflow-hidden flex flex-col">
          <CardHeader className="py-4 pb-2">
             <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex gap-2 items-center">
                   <ShieldAlert className="h-4 w-4 text-purple-500" /> {t("Owner", "المالك")}
                </CardTitle>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                   {getRoleCount('OWNER') || 1} {t("Assigned", "معينين")}
                </span>
             </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-xs text-muted-foreground pb-4 leading-relaxed tracking-tight">{t("Full control over system, billing, and global configuration.", "تحكم كامل في النظام والفوترة والإعدادات العامة.")}</p>
            <AddStaffModal onAdd={handleAddStaff} defaultRole="OWNER" customTrigger={
              <Button variant="secondary" size="sm" className="w-full text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100">
                {t("Assign Owner", "تعيين مالك")}
              </Button>
            } />
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-blue-500 overflow-hidden flex flex-col">
          <CardHeader className="py-4 pb-2">
             <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex gap-2 items-center">
                   <Shield className="h-4 w-4 text-blue-500" /> {t("Manager", "المدير")}
                </CardTitle>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                   {getRoleCount('MANAGER')} {t("Assigned", "معينين")}
                </span>
             </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-xs text-muted-foreground pb-4 leading-relaxed tracking-tight">{t("Oversees daily operations, shifts, reports, and menu edits.", "يشرف على العمليات اليومية، والورديات، والتقارير، والتعديلات على القائمة.")}</p>
            <AddStaffModal onAdd={handleAddStaff} defaultRole="MANAGER" customTrigger={
              <Button variant="secondary" size="sm" className="w-full text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100">
                {t("Assign Manager", "تعيين مدير")}
              </Button>
            } />
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-amber-500 overflow-hidden flex flex-col">
          <CardHeader className="py-4 pb-2">
             <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex gap-2 items-center">
                   <Users className="h-4 w-4 text-amber-500" /> {t("Cashier", "كاشير")}
                </CardTitle>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                   {getRoleCount('CASHIER')} {t("Assigned", "معينين")}
                </span>
             </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-xs text-muted-foreground pb-4 leading-relaxed tracking-tight">{t("Manages counter payments, customer checkout, and closing registers.", "يدير المدفوعات، ومحاسبة العملاء، وإغلاق الخزينة.")}</p>
            <AddStaffModal onAdd={handleAddStaff} defaultRole="CASHIER" customTrigger={
              <Button variant="secondary" size="sm" className="w-full text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100">
                {t("Assign Cashier", "تعيين محاسب")}
              </Button>
            } />
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-card border-t-4 border-t-green-500 overflow-hidden flex flex-col">
          <CardHeader className="py-4 pb-2">
             <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex gap-2 items-center">
                   <UserCog className="h-4 w-4 text-green-500" /> {t("Barista", "باريستا")}
                </CardTitle>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                   {getRoleCount('BARISTA')} {t("Assigned", "معينين")}
                </span>
             </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-xs text-muted-foreground pb-4 leading-relaxed tracking-tight">{t("Handles incoming orders directly and updates preparation fulfillment status.", "يتعامل مع الطلبات الواردة مباشرة ويقوم بتحديث حالة التجهيز.")}</p>
            <AddStaffModal onAdd={handleAddStaff} defaultRole="BARISTA" customTrigger={
              <Button variant="secondary" size="sm" className="w-full text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100">
                {t("Assign Barista", "تعيين باريستا")}
              </Button>
            } />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card pt-2">
         <CardHeader className="pb-4">
           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-1">
             <div>
               <CardTitle className="text-xl">{t("Team Members", "أعضاء الفريق")}</CardTitle>
               <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 opacity-80">
                  <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                  {t("You can start receiving orders without staff, but adding them helps split operations safely.", "يمكنك البدء في استقبال الطلبات بدون موظفين، ولكن إضافتهم تساعد في تقسيم العمليات بأمان.")}
               </p>
             </div>
             <div className="w-full sm:w-64">
                <Input placeholder={t("Search by name or email...", "البحث بالاسم أو البريد الإلكتروني...")} className="h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20" />
             </div>
           </div>
         </CardHeader>
         <CardContent className="p-0">
           <DataTableReusable 
             columns={[
               { key: "name", label: t("Name", "الاسم"), className: "font-semibold py-4 px-6" },
               { key: "email", label: t("Email Address", "البريد الإلكتروني"), className: "text-muted-foreground" },
               { 
                 key: "role", 
                 label: t("Assigned Role", "الدور المعين"),
                 render: (row) => {
                    const roles = row.roles || [row.role];
                    return (
                       <div className="flex flex-wrap gap-1">
                          {roles.map((r: string) => (
                             <Badge key={r} variant="outline" className={
                                r === 'OWNER' ? 'bg-purple-500/10 text-purple-600 border-purple-200' :
                                r === 'MANAGER' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                                r === 'CASHIER' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                'bg-green-500/10 text-green-600 border-green-200'
                             }>
                                {r}
                             </Badge>
                          ))}
                       </div>
                    );
                 }
               },
               { 
                 key: "status", 
                 label: t("Status", "الحالة"),
                 render: (row) => (
                    <div className="flex items-center gap-2">
                       <div className={`h-2 w-2 rounded-full ${row.status === 'Active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                       <span className="text-sm">{row.status}</span>
                    </div>
                 )
               },
               { key: "lastLogin", label: t("Last Login", "آخر تسجيل دخول"), className: "text-muted-foreground text-sm" },
               { 
                 key: "actions", 
                 label: t("Actions", "الإجراءات"),
                 className: "text-right pr-6",
                 render: (row) => (
                    <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                             <MoreHorizontal className="h-4 w-4" />
                          </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer p-0" onSelect={(e) => e.preventDefault()}>
                             <div className="w-full h-full px-2 py-1.5">
                                <ChangeRoleModal staffMember={row} customTrigger={
                                   <div className="flex gap-2 items-center cursor-pointer w-full text-sm">
                                      <Shield className="h-4 w-4 text-muted-foreground" /> {t("Change Role", "تغيير الصلاحية")}
                                   </div>
                                } />
                             </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                             <Key className="h-4 w-4 text-muted-foreground" /> {t("Reset Password", "إعادة ضبط كلمة المرور")}
                          </DropdownMenuItem>
                          {row.role !== 'OWNER' && (
                             <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => handleRemoveAccess(row.id)}
                                >
                                   {t("Remove Access", "إزالة الصلاحية")}
                                </DropdownMenuItem>
                             </>
                          )}
                       </DropdownMenuContent>
                    </DropdownMenu>
                 )
               }
             ]}
             data={staffData}
             emptyMessage={emptyState}
           />
         </CardContent>
      </Card>
    </div>
    </AuthGuard>
  );
}
