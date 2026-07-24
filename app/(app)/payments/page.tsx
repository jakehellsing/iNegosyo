"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import { getCustomers, getOrders, paymentStatusLabels } from "@/lib/store";
import { Customer, Order, PaymentStatus } from "@/lib/types";
import { formatPeso } from "@/lib/utils";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!user) return;
    setOrders(getOrders(user.id));
    setCustomers(getCustomers(user.id));
  }, [user]);

  const customerMap = useMemo(() => {
    return Object.fromEntries(customers.map((c) => [c.id, c]));
  }, [customers]);

  const summary = useMemo(() => {
    const unpaid = orders.filter((o) => o.payment_status === "UNPAID");
    const partial = orders.filter((o) => o.payment_status === "PARTIAL");
    const total = orders
      .filter((o) => o.payment_status !== "PAID")
      .reduce((sum, o) => sum + o.total_amount, 0);
    return { unpaid: unpaid.length, partial: partial.length, total };
  }, [orders]);

  const receivables = useMemo(() => {
    let list = orders.filter((o) => o.payment_status !== "PAID");
    if (filter !== "ALL") list = list.filter((o) => o.payment_status === filter);
    return list.map((o) => ({
      ...o,
      customer_name: customerMap[o.customer_id]?.name ?? "Unknown",
      remaining: o.total_amount,
    }));
  }, [orders, filter, customerMap]);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">Track unpaid and partial payments.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard title="Unpaid" value={summary.unpaid} />
        <SummaryCard title="Partial" value={summary.partial} />
        <SummaryCard title="Receivables" value={formatPeso(summary.total)} />
      </div>

      <div className="flex gap-2">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          All
        </FilterChip>
        <FilterChip active={filter === "UNPAID"} onClick={() => setFilter("UNPAID")}>
          Unpaid
        </FilterChip>
        <FilterChip active={filter === "PARTIAL"} onClick={() => setFilter("PARTIAL")}>
          Partial
        </FilterChip>
      </div>

      <div className="space-y-3">
        {receivables.length === 0 ? (
          <p className="text-sm text-muted-foreground">No receivables found.</p>
        ) : (
          receivables.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{r.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{r.product_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPeso(r.remaining)}</p>
                  <Badge variant={r.payment_status === "PAID" ? "default" : "outline"}>
                    {paymentStatusLabels[r.payment_status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
