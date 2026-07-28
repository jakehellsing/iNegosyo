"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard, useAuth } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { MobileNav } from "@/components/layout/mobile-nav";

const adminAllowedPaths = ["/admin", "/profile", "/settings"];

function RoleRedirect({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || role !== "admin") return;
    const allowed = adminAllowedPaths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (!allowed) router.replace("/admin");
  }, [isLoading, role, pathname, router]);

  return <>{children}</>;
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <RoleRedirect>
        <AppHeader />
        <main className="flex min-h-screen flex-col bg-background pb-20">
          <div className="flex-1">{children}</div>
          <AppFooter />
        </main>
        <MobileNav />
      </RoleRedirect>
    </AuthGuard>
  );
}
