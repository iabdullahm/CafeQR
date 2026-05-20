
"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { title: "Dashboard", href: "/super-admin", icon: "LayoutDashboard", group: "Analytics" },
    { title: "Leads", href: "/super-admin/leads", icon: "Users", group: "Management" },
    { title: "Cafes", href: "/super-admin/cafes", icon: "Store", group: "Management" },
    { title: "Subscriptions", href: "/super-admin/subscriptions", icon: "CreditCard", group: "Management" },
    { title: "Plans & Pricing", href: "/super-admin/plans", icon: "Layers", group: "Management" },
    { title: "Payments", href: "/super-admin/payments", icon: "Wallet", group: "Management" },
    { title: "Reports", href: "/super-admin/reports", icon: "BarChart3", group: "Analytics" },
    { title: "Users & Roles", href: "/super-admin/users-roles", icon: "UserCog", group: "System" },
    { title: "Support Tickets", href: "/super-admin/support", icon: "LifeBuoy", group: "System" },
    { title: "Notifications", href: "/super-admin/notifications", icon: "Bell", group: "System" },
    { title: "System Settings", href: "/super-admin/settings", icon: "Settings", group: "System" },
    { title: "Audit Logs", href: "/super-admin/audit-logs", icon: "FileSearch", group: "System" },
  ];

  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="flex min-h-screen bg-muted/30 relative">
        <AdminSidebar 
          items={navItems} 
          portalName="CafeQR Super" 
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between lg:justify-end sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 lg:hidden mr-auto">
               <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                 <Menu className="h-6 w-6" />
               </Button>
               <span className="font-headline font-bold text-primary">CafeQR Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground leading-none">Platform Admin</p>
                <p className="text-xs text-muted-foreground mt-1">Super Admin Role</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                AD
              </div>
            </div>
          </header>
          <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
