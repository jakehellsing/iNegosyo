import { createClient } from "@/lib/supabase/client";
import { Customer, DeliveryMethod, Order, OrderStatus, PaymentStatus } from "./types";

let supabaseClient: ReturnType<typeof createClient> | undefined;

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

async function currentUser() {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user ?? null;
}

export async function getCustomers(): Promise<Customer[]> {
  const user = await currentUser();
  if (!user) return [];
  const { data, error } = await getSupabase()
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Customer[]) ?? [];
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const user = await currentUser();
  if (!user) return undefined;
  const { data, error } = await getSupabase()
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) return undefined;
  return data as Customer;
}

export async function addCustomer(
  data: Omit<Customer, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Customer> {
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");
  const { data: row, error } = await getSupabase()
    .from("customers")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return row as Customer;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
  const user = await currentUser();
  if (!user) return undefined;
  const { data: row, error } = await getSupabase()
    .from("customers")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return undefined;
  return row as Customer;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const { error } = await getSupabase().from("customers").delete().eq("id", id).eq("user_id", user.id);
  return !error;
}

export async function getOrders(): Promise<Order[]> {
  const user = await currentUser();
  if (!user) return [];
  const { data, error } = await getSupabase()
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Order[]) ?? [];
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const user = await currentUser();
  if (!user) return undefined;
  const { data, error } = await getSupabase()
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) return undefined;
  return data as Order;
}

export async function addOrder(
  data: Omit<Order, "id" | "user_id" | "total_amount" | "created_at" | "updated_at">
): Promise<Order> {
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");
  const { data: row, error } = await getSupabase()
    .from("orders")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return row as Order;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
  const user = await currentUser();
  if (!user) return undefined;
  const { data: row, error } = await getSupabase()
    .from("orders")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return undefined;
  return row as Order;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const { error } = await getSupabase().from("orders").delete().eq("id", id).eq("user_id", user.id);
  return !error;
}

export async function getDashboardStats() {
  const orders = await getOrders();
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

export async function getReceivables(filter?: PaymentStatus | "ALL") {
  const user = await currentUser();
  if (!user) return [];
  let query = getSupabase()
    .from("orders")
    .select("*, customers(name)")
    .eq("user_id", user.id)
    .neq("payment_status", "PAID");
  if (filter && filter !== "ALL") {
    query = query.eq("payment_status", filter);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Order & { customers?: { name: string } | null }) => ({
    ...row,
    customer_name: row.customers?.name ?? "Unknown",
    remaining: row.total_amount,
  }));
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
