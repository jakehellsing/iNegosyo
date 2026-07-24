"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteOrder,
  deliveryMethodLabels,
  getCustomers,
  getOrders,
  orderStatusLabels,
  paymentStatusLabels,
  updateOrder,
} from "@/lib/store";
import { Order, OrderStatus, Customer, PaymentStatus } from "@/lib/types";
import { formatPeso } from "@/lib/utils";

const filters: OrderStatus[] = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "ALL">("ALL");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const refresh = useCallback(async () => {
    const [o, c] = await Promise.all([getOrders(), getCustomers()]);
    setOrders(o);
    setCustomers(c);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const customerMap = useMemo(() => {
    return Object.fromEntries(customers.map((c) => [c.id, c]));
  }, [customers]);

  const filtered = useMemo(() => {
    let list = orders;
    if (activeFilter !== "ALL") list = list.filter((o) => o.order_status === activeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (o) =>
          o.product_name.toLowerCase().includes(q) ||
          customerMap[o.customer_id]?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeFilter, query, customerMap]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await updateOrder(id, { order_status: status });
    refresh();
  };

  const updatePayment = async (id: string, status: PaymentStatus) => {
    await updateOrder(id, { payment_status: status });
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    await deleteOrder(id);
    refresh();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Track and update orders.</p>
        </div>
        <Link href="/orders/new">
          <Button size="icon" aria-label="Add order">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={activeFilter === "ALL"} onClick={() => setActiveFilter("ALL")}>
          All
        </FilterChip>
        {filters.map((f) => (
          <FilterChip key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
            {orderStatusLabels[f]}
          </FilterChip>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customer or product"
          className="pl-9"
          value={query}
          onValueChange={(v) => setQuery(v)}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders found.</p>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              customer={customerMap[order.customer_id]}
              onUpdateStatus={updateStatus}
              onUpdatePayment={updatePayment}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
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
      className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OrderCard({
  order,
  customer,
  onUpdateStatus,
  onUpdatePayment,
  onDelete,
}: {
  order: Order;
  customer: Customer | undefined;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onUpdatePayment: (id: string, status: PaymentStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{order.product_name}</p>
            <p className="text-sm text-muted-foreground">{customer?.name ?? "Unknown"}</p>
            <p className="text-sm font-medium">{formatPeso(order.total_amount)}</p>
            <p className="text-xs text-muted-foreground">{deliveryMethodLabels[order.delivery_method]}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDelete(order.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{orderStatusLabels[order.order_status]}</Badge>
          <Badge variant={order.payment_status === "PAID" ? "default" : "outline"}>
            {paymentStatusLabels[order.payment_status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatusSelect
            value={order.order_status}
            options={(["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"] as OrderStatus[]).map((s) => ({
              value: s,
              label: orderStatusLabels[s],
            }))}
            onChange={(v) => onUpdateStatus(order.id, v)}
          />
          <StatusSelect
            value={order.payment_status}
            options={(["UNPAID", "PARTIAL", "PAID"] as PaymentStatus[]).map((s) => ({
              value: s,
              label: paymentStatusLabels[s],
            }))}
            onChange={(v) => onUpdatePayment(order.id, v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
