"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useAuth, RequirePlan } from "@/lib/auth/context";
import { PLAN_LABELS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import {
  getAdvancedAnalytics,
  getPlanUsage,
  AdvancedAnalytics,
  PlanUsage,
} from "@/lib/store";
import { formatPeso } from "@/lib/utils";

export default function SettingsPage() {
  const { user, plan, role, profile } = useAuth();
  const [usage, setUsage] = useState<PlanUsage | null>(null);

  useEffect(() => {
    getPlanUsage().then(setUsage);
  }, []);

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Your Plan</CardTitle>
          <Badge variant={plan === "free" ? "outline" : "default"}>
            {PLAN_LABELS[plan]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageRow
            label="Customers"
            count={usage?.customers.count}
            limit={usage?.customers.limit}
          />
          <UsageRow
            label="Orders"
            count={usage?.orders.count}
            limit={usage?.orders.limit}
          />
          {plan !== "free" && profile?.plan_expires_at && (
            <p className="text-sm text-muted-foreground">
              Plan expires on {new Date(profile.plan_expires_at).toLocaleDateString()}.
            </p>
          )}
          {plan === "free" && (
            <p className="text-sm text-muted-foreground">
              Reached a limit? Contact an admin to upgrade to Pro for higher (unlimited) caps.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{profile?.full_name || user?.email}</span>
          </div>
          {profile?.business_name && (
            <p className="text-sm text-muted-foreground">{profile.business_name}</p>
          )}
          <Link
            href="/profile"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            View Profile
          </Link>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="h-5 w-5" /> Advanced Analytics
        </h2>
        <RequirePlan feature="advanced_analytics">
          <AnalyticsPanel />
        </RequirePlan>
      </section>

      {role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-lg border p-4 text-sm font-medium hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Manage user plans
          </span>
          <span className="text-muted-foreground">Admin →</span>
        </Link>
      )}
    </div>
  );
}

function UsageRow({
  label,
  count,
  limit,
}: {
  label: string;
  count?: number;
  limit?: number | null;
}) {
  const unlimited = limit === null || limit === undefined;
  const pct =
    unlimited || !count || !limit ? 0 : Math.min(100, Math.round((count / limit) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {count ?? "—"}
          {unlimited ? " / Unlimited" : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={pct >= 100 ? "h-full bg-destructive" : "h-full bg-primary"}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel() {
  const [data, setData] = useState<AdvancedAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdvancedAnalytics()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading analytics…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Paid Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatPeso(data.totalRevenue)}</p>
        </CardContent>
      </Card>

      <RankCard
        title="Top Products"
        rows={data.topProducts.map((p) => ({ label: p.product_name, revenue: p.revenue }))}
      />
      <RankCard
        title="Top Customers"
        rows={data.topCustomers.map((c) => ({ label: c.customer_name, revenue: c.revenue }))}
      />
    </div>
  );
}

function RankCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; revenue: number }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paid orders yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between text-sm">
                <span>{r.label}</span>
                <span className="font-medium">{formatPeso(r.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
