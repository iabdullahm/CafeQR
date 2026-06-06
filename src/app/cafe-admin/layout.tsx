
"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CafeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [impersonation, setImpersonation] = useState<{ active: boolean; cafeId?: string; by?: string }>({ active: false });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const superAdminToken = localStorage.getItem("superAdminToken");
    if (token && superAdminToken) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.impersonatedBy) {
          setImpersonation({ active: true, cafeId: payload.cafeId, by: payload.impersonatedBy });
        }
      } catch (e) {
        console.error("Failed to parse token for impersonation", e);
      }
    }
  }, []);

  const handleExitImpersonation = () => {
    const superToken = localStorage.getItem("superAdminToken");
    if (superToken) {
      localStorage.setItem("token", superToken);
      localStorage.removeItem("superAdminToken");
      window.location.href = "/super-admin/cafes";
    }
  };

  // JWT migration: role + cafeId come from useUser() directly; no Firestore profile lookup.
  const userProfileRef = useMemoFirebase(() => null, []);
  const { data: profile } = useDoc(userProfileRef);

  // If impersonating, use the cafeId from token. Otherwise use profile.cafeId
  const activeCafeId = impersonation.active ? impersonation.cafeId : profile?.cafeId;

  const configRef = useMemoFirebase(() => db && activeCafeId ? doc(db, 'cafes', activeCafeId, 'config', 'settings') : null, [db, activeCafeId]);
  const { data: configDoc } = useDoc(configRef);
  const isArabic = configDoc?.language === 'ar';

  const navItemsRaw = isArabic ? [
    { title: "الرئيسية", href: "/cafe-admin", icon: "LayoutDashboard", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "فريق العمل", href: "/cafe-admin/staff", icon: "Users", allowed: ["OWNER", "SUPER_ADMIN"] },
    { title: "ملف المقهى", href: "/cafe-admin/profile", icon: "User", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "الفروع", href: "/cafe-admin/branches", icon: "MapPin", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "الطاولات", href: "/cafe-admin/tables", icon: "LayoutGrid", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "أكواد QR", href: "/cafe-admin/qr-codes", icon: "QrCode", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "القائمة", href: "/cafe-admin/menu", icon: "ChefHat", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "الطلبات", href: "/cafe-admin/orders", icon: "ClipboardList", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER", "BARISTA", "STAFF"] },
    { title: "شاشة المطبخ", href: "/cafe-admin/kds", icon: "MonitorPlay", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "BARISTA", "KITCHEN"] },
    { title: "التقارير", href: "/cafe-admin/reports", icon: "BarChart3", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "برنامج الولاء", href: "/cafe-admin/loyalty", icon: "Star", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "الزبائن", href: "/cafe-admin/customers", icon: "Users", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "الإعدادات", href: "/cafe-admin/settings", icon: "Settings", allowed: ["OWNER", "SUPER_ADMIN"] },
  ] : [
    { title: "Dashboard", href: "/cafe-admin", icon: "LayoutDashboard", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Staff", href: "/cafe-admin/staff", icon: "Users", allowed: ["OWNER", "SUPER_ADMIN"] },
    { title: "Cafe Profile", href: "/cafe-admin/profile", icon: "User", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Branches", href: "/cafe-admin/branches", icon: "MapPin", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Tables", href: "/cafe-admin/tables", icon: "LayoutGrid", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "QR Codes", href: "/cafe-admin/qr-codes", icon: "QrCode", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Menu", href: "/cafe-admin/menu", icon: "ChefHat", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Orders", href: "/cafe-admin/orders", icon: "ClipboardList", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER", "BARISTA", "STAFF"] },
    { title: "Kitchen Display", href: "/cafe-admin/kds", icon: "MonitorPlay", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER", "BARISTA", "KITCHEN"] },
    { title: "Reports", href: "/cafe-admin/reports", icon: "BarChart3", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Loyalty Program", href: "/cafe-admin/loyalty", icon: "Star", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Customers", href: "/cafe-admin/customers", icon: "Users", allowed: ["OWNER", "SUPER_ADMIN", "MANAGER"] },
    { title: "Settings", href: "/cafe-admin/settings", icon: "Settings", allowed: ["OWNER", "SUPER_ADMIN"] },
  ];

  const userRole = impersonation.active ? "OWNER" : (profile?.role?.toUpperCase() || "STAFF");
  const navItems = navItemsRaw.filter(item => item.allowed.includes(userRole));
  
  const cafeName = configDoc?.name || profile?.cafeName || "Demo Cafe"; // fallback name

  return (
    <AuthGuard allowedRoles={["OWNER", "SUPER_ADMIN", "MANAGER", "CASHIER", "BARISTA", "STAFF", "KITCHEN"]}>
      {impersonation.active && (
        <div className="bg-indigo-600 px-4 py-2 text-white flex items-center justify-between text-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
             <span className="animate-pulse h-2 w-2 rounded-full bg-red-400 block" />
             <span className="font-semibold">Impersonation Mode:</span> You are logged in as <b className="underline decoration-indigo-400">{cafeName}</b>
          </div>
          <Button variant="outline" size="sm" onClick={handleExitImpersonation} className="h-7 text-indigo-700 hover:bg-indigo-50 border-white hover:text-indigo-800 font-bold">
            Exit Impersonation
          </Button>
        </div>
      )}
      <div dir={isArabic ? 'rtl' : 'ltr'} className="flex min-h-screen bg-muted/30 font-sans relative">
        <AdminSidebar 
          items={navItems} 
          portalName={isArabic ? "مدير المقهى" : "CafeQR Admin"} 
          isArabic={isArabic} 
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 lg:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex-1 max-w-md hidden md:block lg:ml-0">
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
