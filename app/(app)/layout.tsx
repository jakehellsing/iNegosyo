import { AuthGuard } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="flex min-h-screen flex-col bg-background pb-20">
        <div className="flex-1">{children}</div>
        <AppFooter />
      </main>
      <MobileNav />
    </AuthGuard>
  );
}
