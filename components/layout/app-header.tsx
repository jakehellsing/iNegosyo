"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";

export function AppHeader() {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
      <span className="text-lg font-bold">iNegosyo</span>
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
}
