"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Layers,
  ShoppingBag,
  Users,
  Settings,
  Coffee,
  QrCode,
  MapPin,
  ClipboardList,
  CreditCard,
  Wallet,
  BarChart3,
  UserCog,
  LifeBuoy,
  Bell,
  FileSearch,
  ChefHat,
  LogOut,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Store,
  Layers,
  ShoppingBag,
  Users,
  Settings,
  Coffee,
  QrCode,
  MapPin,
  ClipboardList,
  CreditCard,
  Wallet,
  BarChart3,
  UserCog,
  LifeBuoy,
  Bell,
  FileSearch,
  ChefHat,
};

interface SidebarItem {
  title: string;
  href: string;
  icon: string;
}

interface AdminSidebarProps {
  items: SidebarItem[];
  portalName: string;
  isArabic?: boolean;
}

export function AdminSidebar({ items, portalName, isArabic = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      localStorage.removeItem("token");
      router.push("/login");
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-64 bg-card border-e h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2 border-b">
        <Coffee className="h-6 w-6 text-primary" />
        <span className="font-headline font-bold text-lg text-primary">{portalName}</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {items.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <IconComponent className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t space-y-1">
        <div 
          className="flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md cursor-pointer transition-colors mt-2"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{isArabic ? "تسجيل الخروج" : "Logout"}</span>
        </div>
      </div>
    </div>
  );
}
