"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/context";
import { deleteCustomer, getCustomers } from "@/lib/store";
import { Customer } from "@/lib/types";

export default function CustomersPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  const refresh = useCallback(() => {
    if (!user) return;
    setCustomers(getCustomers(user.id));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [customers, query]);

  const handleDelete = (id: string) => {
    if (!user) return;
    if (!confirm("Delete this customer?")) return;
    deleteCustomer(user.id, id);
    refresh();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your buyers.</p>
        </div>
        <Link href="/customers/new">
          <Button size="icon" aria-label="Add customer">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers found.</p>
        ) : (
          filtered.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{customer.name}</p>
                  {customer.phone_number && (
                    <p className="text-sm text-muted-foreground">{customer.phone_number}</p>
                  )}
                  {customer.address && (
                    <p className="text-sm text-muted-foreground">{customer.address}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
