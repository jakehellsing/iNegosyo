export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type DeliveryMethod = "PICKUP" | "LOCAL_RIDER" | "SELLER_DELIVERY";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone_number?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: PaymentStatus;
  delivery_method: DeliveryMethod;
  order_status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at?: string;
}
