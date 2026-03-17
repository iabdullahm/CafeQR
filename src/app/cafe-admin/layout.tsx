import { AdminSidebar } from "@/components/admin-sidebar";
import { Search, Bell, User, Coffee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar items={navItems} portalName="CafeQR Admin" />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search orders, tables, or products..." 
                className="pl-10 h-10 border-none bg-muted focus-visible:ring-primary/20" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:text-primary transition-colors">
               <Bell className="h-5 w-5" />
               <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-accent border-2 border-card" />
            </Button>
            
            <div className="h-8 w-px bg-border mx-2" />

             <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-primary leading-tight">The Roast Coffee</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Admin Portal</p>
             </div>
             
            <Button variant="ghost" className="h-10 w-10 rounded-xl border bg-muted p-0 overflow-hidden hover:border-primary/50 transition-all">
               <img src="https://picsum.photos/seed/cafe-admin-logo/40/40" alt="Cafe Logo" className="object-cover h-full w-full" />
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}