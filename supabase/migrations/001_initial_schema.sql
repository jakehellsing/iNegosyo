-- iNegosyo initial schema
-- Run this in your Supabase SQL editor or with `supabase db push`.

-- Enums
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
CREATE TYPE delivery_method AS ENUM ('PICKUP', 'LOCAL_RIDER', 'SELLER_DELIVERY');
CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- Customers
CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone_number text,
    address text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_name text NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    total_amount numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    delivery_method delivery_method NOT NULL DEFAULT 'PICKUP',
    order_status order_status NOT NULL DEFAULT 'PENDING',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own rows
CREATE POLICY "Users can CRUD own customers" ON customers
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own orders" ON orders
    FOR ALL USING (auth.uid() = user_id);

-- Updated at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
