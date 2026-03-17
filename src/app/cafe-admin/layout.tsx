import { AdminSidebar } from "@/components/admin-sidebar";

export default function CafeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { title: "Dashboard", href: "/cafe-admin", icon: "LayoutDashboard" },
    { title: "Orders", href: "/cafe-admin/orders", icon: "ClipboardList" },
    { title: "Menu Categories", href: "/cafe-admin/menu", icon: "ChefHat" },
    { title: "Products", href: "/cafe-admin/products", icon: "Coffee" },
    { title: "Branches", href: "/cafe-admin/branches", icon: "MapPin" },
    { title: "Tables", href: "/cafe-admin/tables", icon: "LayoutGrid" },
    { title: "QR Codes", href: "/cafe-admin/qr-codes", icon: "QrCode" },
    { title: "Loyalty Program", href: "/cafe-admin/loyalty", icon: "Star" },
    { title: "Cafe Profile", href: "/cafe-admin/profile", icon: "User" },
    { title: "Settings", href: "/cafe-admin/settings", icon: "Settings" },
  ];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar items={navItems} portalName="CafeQR Admin" />
      <div className="flex-1 flex flex-col bg-background">
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="lg:hidden flex items-center gap-2">
             <span className="font-headline font-bold text-primary">CafeQR Admin</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
             <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-primary leading-tight">The Roast Coffee</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Administrator</p>
             </div>
            <div className="h-10 w-10 rounded-xl border bg-muted flex items-center justify-center overflow-hidden">
               <img src="https://picsum.photos/seed/cafe-admin-logo/40/40" alt="Cafe Logo" />
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
