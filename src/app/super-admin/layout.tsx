import { AdminSidebar } from "@/components/admin-sidebar";
import { LayoutDashboard, Store, Layers, CreditCard } from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { title: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { title: "Cafes", href: "/super-admin/cafes", icon: Store },
    { title: "Plans", href: "/super-admin/plans", icon: Layers },
    { title: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar items={navItems} portalName="Super Admin" />
      <div className="flex-1 flex flex-col bg-background">
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between lg:justify-end">
          <div className="lg:hidden flex items-center gap-2">
             <span className="font-headline font-bold text-primary">CafeQR Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Admin@cafeqr.com</span>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">A</div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
