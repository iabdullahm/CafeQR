import { AdminSidebar } from "@/components/admin-sidebar";
import { LayoutDashboard, Store, QrCode, ClipboardList, Users, Settings, ChefHat, MapPin } from "lucide-react";

export default function CafeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { title: "Dashboard", href: "/cafe-admin", icon: LayoutDashboard },
    { title: "Orders", href: "/cafe-admin/orders", icon: ClipboardList },
    { title: "Menu", href: "/cafe-admin/menu", icon: ChefHat },
    { title: "Branches", href: "/cafe-admin/branches", icon: MapPin },
    { title: "Tables", href: "/cafe-admin/tables", icon: Store },
    { title: "QR Codes", href: "/cafe-admin/qr-codes", icon: QrCode },
    { title: "Loyalty", href: "/cafe-admin/loyalty", icon: Users },
  ];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar items={navItems} portalName="Cafe Admin" />
      <div className="flex-1 flex flex-col bg-background">
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between lg:justify-end">
          <div className="lg:hidden flex items-center gap-2">
             <span className="font-headline font-bold text-primary">CafeQR</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block">
                <p className="text-sm font-bold text-primary">The Roast Coffee</p>
                <p className="text-xs text-muted-foreground">Main Branch</p>
             </div>
            <div className="h-10 w-10 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
               <img src="https://picsum.photos/seed/cafe-logo/40/40" alt="Logo" />
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
