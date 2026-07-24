import { AuthGuard } from "@/lib/auth/context";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="min-h-screen bg-background pb-20">{children}</main>
      <MobileNav />
    </AuthGuard>
  );
}
