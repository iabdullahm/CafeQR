"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
}

interface AdminSidebarProps {
  items: SidebarItem[];
  portalName: string;
}

export function AdminSidebar({ items, portalName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex flex-col w-64 bg-card border-r h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2 border-b">
        <Coffee className="h-6 w-6 text-primary" />
        <span className="font-headline font-bold text-lg text-primary">{portalName}</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {items.map((item) => (
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
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground cursor-pointer">
          <Settings className="h-5 w-5" />
          <span className="font-medium">Settings</span>
        </div>
      </div>
    </div>
  );
}
