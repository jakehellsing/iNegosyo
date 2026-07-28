"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Users, CreditCard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";

const userTabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

const adminTabs = [
  { href: "/admin", label: "Admin", icon: Shield },
];

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const tabs = role === "admin" ? adminTabs : userTabs;
  const cols = tabs.length === 1 ? "grid-cols-1" : "grid-cols-4";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe">
      <div className={`grid h-16 ${cols} items-center`}>
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
