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
  X,
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

export interface SidebarItem {
  title: string;
  href: string;
  icon: string;
  group?: string; // Add optional grouping
}

export interface AdminSidebarProps {
  items: SidebarItem[];
  portalName: string;
  isArabic?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ items, portalName, isArabic = false, isMobileOpen = false, onCloseMobile }: AdminSidebarProps) {
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

  // Group items
  const groupedItems = items.reduce((acc, item) => {
     const g = item.group || "MAIN";
     if (!acc[g]) acc[g] = [];
     acc[g].push(item);
     return acc;
  }, {} as Record<string, SidebarItem[]>);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      <div className={cn(
        "flex flex-col w-[280px] bg-card border-e h-screen fixed lg:sticky top-0 shrink-0 z-50 transition-transform duration-300",
        isMobileOpen ? "translate-x-0" : (isArabic ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"),
        isArabic ? "right-0" : "left-0"
      )}>
        <div className="h-16 flex items-center justify-between gap-3 px-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Coffee className="h-6 w-6 text-primary" />
            <span className="font-headline font-black text-lg text-primary">{portalName}</span>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {Object.keys(groupedItems).map((groupName, i) => (
           <div key={i}>
             {groupName !== "MAIN" && (
                <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest mb-3 px-2">
                   {groupName}
                </p>
             )}
             <nav className="space-y-1">
               {groupedItems[groupName].map((item) => {
                 const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
                 const isActive = pathname === item.href;
                 return (
                   <Link
                     key={item.href}
                     href={item.href} onClick={() => { if (onCloseMobile) onCloseMobile(); }}
                     className={cn(
                       "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                       isActive
                         ? "bg-primary/10 text-primary font-bold"
                         : "text-muted-foreground hover:bg-muted font-medium hover:text-foreground"
                     )}
                   >
                     {isActive && (
                        <div className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary", isArabic ? "right-0" : "left-0")} />
                     )}
                     <IconComponent className={cn("h-[18px] w-[18px] transition-transform group-hover:scale-110", isActive && "text-primary")} />
                     <span className="text-sm">{item.title}</span>
                   </Link>
                 );
               })}
             </nav>
           </div>
        ))}
      </div>
      <div className="p-4 border-t shrink-0">
        <div 
          className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl cursor-pointer transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span className="font-bold text-sm">{isArabic ? "تسجيل الخروج" : "Sign Out"}</span>
        </div>
      </div>
      </div>
    </>
  );
}
