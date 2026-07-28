"use client";

import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";

export function AppHeader() {
  const { signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
      <span className="text-lg font-bold">iNegosyo</span>
      <div className="flex items-center gap-1">
        <Link
          href="/profile"
          aria-label="Profile"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <User className="h-5 w-5" />
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Settings className="h-5 w-5" />
        </Link>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Log out">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
