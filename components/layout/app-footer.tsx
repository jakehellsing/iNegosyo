"use client";

import { Copyright } from "lucide-react";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-4 text-center text-xs text-muted-foreground">
      <p className="flex items-center justify-center gap-1">
        <Copyright className="h-3 w-3" />
        {year} Developed by JEK. Established {year}.
      </p>
    </footer>
  );
}
