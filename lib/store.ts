"use client";

import { Customer, DeliveryMethod, Order, OrderStatus, PaymentStatus } from "./types";

const CUSTOMERS_KEY = "inegosyo_customers";
const ORDERS_KEY = "inegosyo_orders";

function isBrowser() {
  return typeof window !== "undefined";
}

function uid() {
  if (isBrowser() && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now() {
  return new Date().toISOString();
}

function read<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed sample data for a first-time user.
export function seedData(userId: string) {
  if (!isBrowser()) return;
  if (localStorage.getItem(CUSTOMERS_KEY) || localStorage.getItem(ORDERS_KEY)) return;

  const customer: Customer = {
    id: uid(),
    user_id: userId,
    name: "Sample Customer",
    phone_number: "09171234567",
    address: "Manila, Philippines",
    notes: "Loves ube halaya",
    created_at: now(),
    updated_at: now(),
  };

  const order: Order = {
    id: uid(),
    user_id: userId,
    customer_id: customer.id,
    product_name: "Ube Halaya Jar",
    quantity: 2,
    unit_price: 250,
    total_amount: 500,
    payment_status: "UNPAID",
    delivery_method: "PICKUP",
    order_status: "PENDING",
    notes: "Please message before pick-up.",
    created_at: now(),
    updated_at: now(),
  };

  write<Customer>(CUSTOMERS_KEY, [customer]);
  write<Order>(ORDERS_KEY, [order]);
}

export function getCustomers(userId: string): Customer[] {
  return read<Customer>(CUSTOMERS_KEY).filter((c) => c.user_id === userId);
}

export function getCustomer(userId: string, id: string): Customer | undefined {
  return getCustomers(userId).find((c) => c.id === id);
}

export function addCustomer(userId: string, data: Omit<Customer, "id" | "user_id" | "created_at" | "updated_at">): Customer {
  const customer: Customer = { ...data, id: uid(), user_id: userId, created_at: now(), updated_at: now() };
  const all = read<Customer>(CUSTOMERS_KEY);
  all.push(customer);
  write(CUSTOMERS_KEY, all);
  return customer;
}

export function updateCustomer(userId: string, id: string, data: Partial<Customer>): Customer | undefined {
  const all = read<Customer>(CUSTOMERS_KEY);
  const idx = all.findIndex((c) => c.id === id && c.user_id === userId);
  if (idx === -1) return undefined;
  all[idx] = { ...all[idx], ...data, updated_at: now() };
  write(CUSTOMERS_KEY, all);
  return all[idx];
}

export function deleteCustomer(userId: string, id: string): boolean {
  const all = read<Customer>(CUSTOMERS_KEY);
  const filtered = all.filter((c) => !(c.id === id && c.user_id === userId));
  if (filtered.length === all.length) return false;
  write(CUSTOMERS_KEY, filtered);
  return true;
}

export function getOrders(userId: string): Order[] {
  return read<Order>(ORDERS_KEY)
    .filter((o) => o.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getOrder(userId: string, id: string): Order | undefined {
  return getOrders(userId).find((o) => o.id === id);
}

export function addOrder(
  userId: string,
  data: Omit<Order, "id" | "user_id" | "total_amount" | "created_at" | "updated_at">
): Order {
  const order: Order = {
    ...data,
    total_amount: data.quantity * data.unit_price,
    id: uid(),
    user_id: userId,
    created_at: now(),
    updated_at: now(),
  };
  const all = read<Order>(ORDERS_KEY);
  all.push(order);
  write(ORDERS_KEY, all);
  return order;
}

export function updateOrder(userId: string, id: string, data: Partial<Order>): Order | undefined {
  const all = read<Order>(ORDERS_KEY);
  const idx = all.findIndex((o) => o.id === id && o.user_id === userId);
  if (idx === -1) return undefined;
  const updated = { ...all[idx], ...data, updated_at: now() };
  if (data.quantity !== undefined || data.unit_price !== undefined) {
    updated.total_amount = updated.quantity * updated.unit_price;
  }
  all[idx] = updated;
  write(ORDERS_KEY, all);
  return updated;
}

export function deleteOrder(userId: string, id: string): boolean {
  const all = read<Order>(ORDERS_KEY);
  const filtered = all.filter((o) => !(o.id === id && o.user_id === userId));
  if (filtered.length === all.length) return false;
  write(ORDERS_KEY, filtered);
  return true;
}

export function getDashboardStats(userId: string) {
  const orders = getOrders(userId);
  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter((o) => o.created_at.startsWith(today));
  const pendingOrders = orders.filter((o) => o.order_status === "PENDING");
  const unpaidOrders = orders.filter((o) => o.payment_status !== "PAID" && o.order_status !== "CANCELLED");
  const totalSalesToday = ordersToday
    .filter((o) => o.payment_status === "PAID")
    .reduce((sum, o) => sum + o.total_amount, 0);

  return {
    pendingOrders: pendingOrders.length,
    ordersToday: ordersToday.length,
    unpaidOrders: unpaidOrders.length,
    totalSalesToday,
    recentOrders: orders.slice(0, 10),
  };
}

export function getReceivables(userId: string, filter?: PaymentStatus | "ALL") {
  let orders = getOrders(userId).filter((o) => o.payment_status !== "PAID" && o.order_status !== "CANCELLED");
  if (filter && filter !== "ALL") {
    orders = orders.filter((o) => o.payment_status === filter);
  }
  return orders.map((o) => {
    const customer = getCustomer(userId, o.customer_id);
    return {
      ...o,
      customer_name: customer?.name ?? "Unknown",
      remaining: o.total_amount,
    };
  });
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  PICKUP: "Pickup",
  LOCAL_RIDER: "Local Rider",
  SELLER_DELIVERY: "Seller Delivery",
};
