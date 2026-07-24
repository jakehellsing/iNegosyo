"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { addOrder, getCustomers } from "@/lib/store";
import { DeliveryMethod, PaymentStatus, OrderStatus } from "@/lib/types";

export default function NewOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const customers = useMemo(() => (user ? getCustomers(user.id) : []), [user]);

  const [customerId, setCustomerId] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("PENDING");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (customers.length && !customerId) setCustomerId(customers[0].id);
  }, [customers, customerId]);

  const total = quantity * unitPrice;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !customerId || !product.trim()) return;
    addOrder(user.id, {
      customer_id: customerId,
      product_name: product.trim(),
      quantity,
      unit_price: unitPrice,
      payment_status: paymentStatus,
      delivery_method: deliveryMethod,
      order_status: orderStatus,
      notes: notes.trim() || undefined,
    });
    router.push("/orders");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add Order</h1>
      </div>

      {customers.length === 0 && (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          Add a customer first before creating orders.
        </p>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Product Name</Label>
              <Input
                id="product"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. Ube Halaya Jar"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (PHP)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">₱{total.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(v) => v && setPaymentStatus(v as PaymentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <Select value={deliveryMethod} onValueChange={(v) => v && setDeliveryMethod(v as DeliveryMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PICKUP">Pickup</SelectItem>
                    <SelectItem value="LOCAL_RIDER">Local Rider</SelectItem>
                    <SelectItem value="SELLER_DELIVERY">Seller Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select value={orderStatus} onValueChange={(v) => v && setOrderStatus(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PREPARING">Preparing</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Special instructions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full gap-2" disabled={!customerId}>
          <Save className="h-4 w-4" />
          Save Order
        </Button>
      </form>
    </div>
  );
}
