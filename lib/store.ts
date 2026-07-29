import { createClient } from "@/lib/supabase/client";
import {
  Customer,
  DeliveryMethod,
  Order,
  OrderStatus,
  PaymentStatus,
  PlanTier,
  Profile,
} from "./types";
import {
  effectiveLimit,
  effectivePlan,
  hasFeature,
  isUnlimited,
  LimitedResource,
  PLAN_LABELS,
} from "./plans";

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

export async function getProfile(): Promise<Profile | null> {
  const user = await currentUser();
  if (!user) return null;
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export type ProfileUpdate = Partial<
  Pick<Profile, "business_name" | "full_name" | "contact_number" | "address">
>;

export async function updateProfileDetails(
  userId: string,
  update: ProfileUpdate
): Promise<Profile> {
  const payload: ProfileUpdate = {};
  for (const [key, value] of Object.entries(update)) {
    (payload as Record<string, unknown>)[key] =
      typeof value === "string" && value.trim() === "" ? null : value;
  }

  const { data, error } = await getSupabase()
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

async function countRows(table: "customers" | "orders", userId: string): Promise<number> {
  const { count } = await getSupabase()
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

/**
 * Application-level limit check (the DB triggers are the hard backstop).
 * Throws a friendly, upgrade-oriented error when the plan limit is reached.
 */
async function assertWithinLimit(
  profile: Profile | null,
  resource: LimitedResource,
  userId: string
) {
  const limit = effectiveLimit(profile, resource);
  if (isUnlimited(limit)) return;
  const current = await countRows(resource, userId);
  if (current >= limit) {
    const planName = PLAN_LABELS[effectivePlan(profile)];
    const noun = resource === "customers" ? "customers" : "orders";
    throw new Error(
      `${planName} plan limit reached — you can have up to ${limit} ${noun}. Upgrade to Pro to add more.`
    );
  }
}

export interface PlanUsage {
  plan: PlanTier;
  customers: { count: number; limit: number | null };
  orders: { count: number; limit: number | null };
}

export async function getPlanUsage(): Promise<PlanUsage | null> {
  const user = await currentUser();
  if (!user) return null;
  const profile = await getProfile();
  const [customers, orders] = await Promise.all([
    countRows("customers", user.id),
    countRows("orders", user.id),
  ]);
  return {
    plan: effectivePlan(profile),
    customers: { count: customers, limit: effectiveLimit(profile, "customers") },
    orders: { count: orders, limit: effectiveLimit(profile, "orders") },
  };
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
  await assertWithinLimit(await getProfile(), "customers", user.id);
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
  await assertWithinLimit(await getProfile(), "orders", user.id);
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

export interface AdvancedAnalytics {
  topProducts: { product_name: string; revenue: number; orders: number }[];
  topCustomers: { customer_name: string; revenue: number; orders: number }[];
  totalRevenue: number;
}

/**
 * Pro-only advanced analytics. Gated behind the `advanced_analytics` feature;
 * throws when the current plan does not unlock it.
 */
export async function getAdvancedAnalytics(): Promise<AdvancedAnalytics> {
  const profile = await getProfile();
  if (!hasFeature(profile, "advanced_analytics")) {
    throw new Error("Advanced analytics is a Pro feature. Upgrade to unlock.");
  }
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await getSupabase()
    .from("orders")
    .select("product_name, total_amount, payment_status, customers(name)")
    .eq("user_id", user.id)
    .eq("payment_status", "PAID");
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    product_name: string;
    total_amount: number;
    customers?: { name: string } | null;
  }>;

  const byProduct = new Map<string, { revenue: number; orders: number }>();
  const byCustomer = new Map<string, { revenue: number; orders: number }>();
  let totalRevenue = 0;

  for (const row of rows) {
    totalRevenue += row.total_amount;
    const p = byProduct.get(row.product_name) ?? { revenue: 0, orders: 0 };
    p.revenue += row.total_amount;
    p.orders += 1;
    byProduct.set(row.product_name, p);

    const name = row.customers?.name ?? "Unknown";
    const c = byCustomer.get(name) ?? { revenue: 0, orders: 0 };
    c.revenue += row.total_amount;
    c.orders += 1;
    byCustomer.set(name, c);
  }

  const rank = <T extends { revenue: number }>(entries: T[]) =>
    entries.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return {
    totalRevenue,
    topProducts: rank(
      [...byProduct.entries()].map(([product_name, v]) => ({ product_name, ...v }))
    ),
    topCustomers: rank(
      [...byCustomer.entries()].map(([customer_name, v]) => ({ customer_name, ...v }))
    ),
  };
}

// ---------------------------------------------------------------------------
// Admin: manage which plan each user is on. RLS restricts updates to admins.
// ---------------------------------------------------------------------------
export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

export interface PlanUpdate {
  plan: PlanTier;
  max_customers?: number | null;
  max_orders?: number | null;
  features?: Record<string, boolean> | null;
  plan_expires_at?: string | null;
}

/**
 * Set a user's plan and (for `custom`) their overrides. Admin-only; the DB RLS
 * policy rejects the update for non-admin callers.
 */
export async function updateUserPlan(
  userId: string,
  update: PlanUpdate
): Promise<Profile> {
  const patch: Record<string, unknown> = { plan: update.plan };
  if (update.plan === "custom") {
    patch.max_customers = update.max_customers ?? null;
    patch.max_orders = update.max_orders ?? null;
    if (update.features !== undefined) patch.features = update.features ?? {};
  } else {
    // Clear custom overrides when leaving the custom tier.
    patch.max_customers = null;
    patch.max_orders = null;
  }
  if (update.plan === "free") {
    // Free plans don't carry an expiry; clear it to avoid surprising resurrections.
    patch.plan_expires_at = null;
  } else if (update.plan_expires_at !== undefined) {
    patch.plan_expires_at = update.plan_expires_at;
  }

  const { data, error } = await getSupabase()
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
