
"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { title: "Dashboard", href: "/super-admin", icon: "LayoutDashboard" },
    { title: "Cafes", href: "/super-admin/cafes", icon: "Store" },
    { title: "Subscriptions", href: "/super-admin/subscriptions", icon: "CreditCard" },
    { title: "Plans", href: "/super-admin/plans", icon: "Layers" },
    { title: "Payments", href: "/super-admin/payments", icon: "Wallet" },
    { title: "Reports", href: "/super-admin/reports", icon: "BarChart3" },
    { title: "Users & Roles", href: "/super-admin/users-roles", icon: "UserCog" },
    { title: "Support Tickets", href: "/super-admin/support", icon: "LifeBuoy" },
    { title: "Notifications", href: "/super-admin/notifications", icon: "Bell" },
    { title: "System Settings", href: "/super-admin/settings", icon: "Settings" },
    { title: "Audit Logs", href: "/super-admin/audit-logs", icon: "FileSearch" },
  ];

  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar items={navItems} portalName="CafeQR Super" />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card px-6 flex items-center justify-between lg:justify-end sticky top-0 z-30">
            <div className="lg:hidden flex items-center gap-2">
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
