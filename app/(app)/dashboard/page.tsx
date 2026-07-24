"use client";

import { useEffect, useState } from "react";
import { Clock, Package, Receipt, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, orderStatusLabels, paymentStatusLabels } from "@/lib/store";
import { formatPeso } from "@/lib/utils";
import { Order } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    pendingOrders: number;
    ordersToday: number;
    unpaidOrders: number;
    totalSalesToday: number;
    recentOrders: Order[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    getDashboardStats().then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of today’s business.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard title="Pending" value={stats.pendingOrders} icon={Clock} />
        <KpiCard title="Today" value={stats.ordersToday} icon={Package} />
        <KpiCard title="Unpaid" value={stats.unpaidOrders} icon={Receipt} />
        <KpiCard title="Sales" value={formatPeso(stats.totalSalesToday)} icon={Wallet} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent Orders</h2>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{order.product_name}</p>
                      <p className="text-sm text-muted-foreground">{formatPeso(order.total_amount)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary">{orderStatusLabels[order.order_status]}</Badge>
                      <Badge variant={order.payment_status === "PAID" ? "default" : "outline"}>
                        {paymentStatusLabels[order.payment_status]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
