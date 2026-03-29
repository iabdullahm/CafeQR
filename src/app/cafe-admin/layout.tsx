
"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

export default function CafeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    return (db && user) ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  const configRef = useMemoFirebase(() => db && profile?.cafeId ? doc(db, 'cafes', profile.cafeId, 'config', 'settings') : null, [db, profile?.cafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';

  const navItemsRaw = isArabic ? [
    { title: "الرئيسية", href: "/cafe-admin", icon: "LayoutDashboard", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "فريق العمل", href: "/cafe-admin/staff", icon: "Users", allowed: ["OWNER", "SUPER_ADMIN"] },
    { title: "ملف المقهى", href: "/cafe-admin/profile", icon: "User", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "الفروع", href: "/cafe-admin/branches", icon: "MapPin", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "الطاولات", href: "/cafe-admin/tables", icon: "LayoutGrid", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "أكواد QR", href: "/cafe-admin/qr-codes", icon: "QrCode", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "القائمة", href: "/cafe-admin/menu", icon: "ChefHat", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER"] },
    { title: "الطلبات", href: "/cafe-admin/orders", icon: "ClipboardList", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER", "BARISTA", "STAFF"] },
    { title: "برنامج الولاء", href: "/cafe-admin/loyalty", icon: "Star", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER"] },
    { title: "الإعدادات", href: "/cafe-admin/settings", icon: "Settings", allowed: ["OWNER", "SUPER_ADMIN"] },
  ] : [
    { title: "Dashboard", href: "/cafe-admin", icon: "LayoutDashboard", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Staff", href: "/cafe-admin/staff", icon: "Users", allowed: ["OWNER", "SUPER_ADMIN"] },
    { title: "Cafe Profile", href: "/cafe-admin/profile", icon: "User", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Branches", href: "/cafe-admin/branches", icon: "MapPin", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Tables", href: "/cafe-admin/tables", icon: "LayoutGrid", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "QR Codes", href: "/cafe-admin/qr-codes", icon: "QrCode", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Menu", href: "/cafe-admin/menu", icon: "ChefHat", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER"] },
    { title: "Orders", href: "/cafe-admin/orders", icon: "ClipboardList", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER", "BARISTA", "STAFF"] },
    { title: "Loyalty Program", href: "/cafe-admin/loyalty", icon: "Star", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER"] },
    { title: "Settings", href: "/cafe-admin/settings", icon: "Settings", allowed: ["OWNER", "SUPER_ADMIN"] },
  ];

  const userRole = profile?.role || "STAFF";
  const navItems = navItemsRaw.filter(item => item.allowed.includes(userRole));

  return (
    <AuthGuard allowedRoles={["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER", "BARISTA", "STAFF"]}>
      <div dir={isArabic ? 'rtl' : 'ltr'} className="flex min-h-screen bg-muted/30 font-sans">
        <AdminSidebar items={navItems} portalName={isArabic ? "مدير المقهى" : "CafeQR Admin"} isArabic={isArabic} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={isArabic ? "بحث في اللوحة..." : "Search dashboard..."} 
                  className="ps-10 h-10 border-none bg-muted focus-visible:ring-primary/20" 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 ms-auto">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:text-primary transition-colors">
                 <Bell className="h-5 w-5" />
                 <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-accent border-2 border-card" />
              </Button>
              
              <div className="h-8 w-px bg-border mx-2" />

               <div className="hidden md:block text-end">
                  <p className="text-sm font-bold text-primary leading-tight">{profile?.fullName || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{profile?.role?.replace('_', ' ') || 'Staff'}</p>
               </div>
               
              <Button variant="ghost" className="h-10 w-10 rounded-xl border bg-muted p-0 overflow-hidden hover:border-primary/50 transition-all">
                 <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold text-xs">
                   {profile?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                 </div>
              </Button>
            </div>
          </header>
          <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
