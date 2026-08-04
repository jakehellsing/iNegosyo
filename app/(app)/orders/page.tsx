"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn, formatPeso } from "@/lib/utils";

const filters: OrderStatus[] = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"];

type SortOption = "newest" | "oldest" | "amount-high" | "amount-low";

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
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

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "amount-high":
          return b.total_amount - a.total_amount;
        case "amount-low":
          return a.total_amount - b.total_amount;
      }
    });
  }, [orders, activeFilter, query, customerMap, sortBy]);

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
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and share your orders here.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customer or product"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Link href="/orders/new">
            <Button size="icon" aria-label="Add order">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          <FilterTab active={activeFilter === "ALL"} onClick={() => setActiveFilter("ALL")}>
            All
          </FilterTab>
          {filters.map((f) => (
            <FilterTab key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
              {orderStatusLabels[f]}
            </FilterTab>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-8 w-44 gap-2 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Newest first" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="amount-high">Amount: high to low</SelectItem>
              <SelectItem value="amount-low">Amount: low to high</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 && activeFilter === "ALL" && query === "" ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewOrderCard />
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              customer={customerMap[order.customer_id]}
              onUpdateStatus={updateStatus}
              onUpdatePayment={updatePayment}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({
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
      className={cn(
        "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="font-medium">No orders yet</h3>
      <p className="mb-4 text-sm text-muted-foreground">Create your first order to get started.</p>
      <Link href="/orders/new">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New order
        </Button>
      </Link>
    </div>
  );
}

function NewOrderCard() {
  return (
    <Link href="/orders/new" className="group">
      <Card className="flex h-full min-h-[180px] flex-col items-start justify-between border-dashed bg-background py-0 transition-colors hover:bg-muted/30">
        <CardContent className="flex h-full flex-col items-start justify-between p-5">
          <div>
            <p className="font-medium">Create</p>
            <p className="text-sm text-muted-foreground">a new order</p>
          </div>
          <Button size="icon" className="rounded-full" aria-label="Add order">
            <Plus className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>
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
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-sky-50 to-white py-0 ring-1 ring-foreground/5 transition-shadow hover:shadow-md dark:from-sky-950/30 dark:to-card dark:ring-foreground/10">
      <div className="absolute left-5 top-0 h-4 w-16 rounded-b-md bg-sky-100/80 dark:bg-sky-900/40" />
      <CardContent className="relative p-5 pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight">{order.product_name}</p>
            <p className="text-sm text-muted-foreground">{customer?.name ?? "Unknown"}</p>
          </div>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8" onClick={() => onDelete(order.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <p className="mt-3 text-lg font-semibold">{formatPeso(order.total_amount)}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-white/70 dark:bg-background/40">
            {orderStatusLabels[order.order_status]}
          </Badge>
          <Badge variant={order.payment_status === "PAID" ? "default" : "outline"}>
            {paymentStatusLabels[order.payment_status]}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
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

        <p className="mt-3 text-xs text-muted-foreground">
          {deliveryMethodLabels[order.delivery_method]}
        </p>
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
      <SelectTrigger className="h-8 bg-white/70 text-xs dark:bg-background/40">
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

