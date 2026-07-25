-- iNegosyo plans / tiers schema
-- Introduces per-user plans (free / pro / custom), a profiles table, RLS,
-- effective-limit helpers, and DB-level limit enforcement.
-- Run this in your Supabase SQL editor or with `supabase db push`
-- AFTER 001_initial_schema.sql.

-- Plan tier enum
CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'custom');

-- Profiles: one row per auth user
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan plan_tier NOT NULL DEFAULT 'free',
    role text NOT NULL DEFAULT 'user',
    -- Custom-tier overrides. NULL means "use the plan default"
    -- (for the pro/custom base that is unlimited).
    max_customers int,
    max_orders int,
    -- Per-feature overrides for the custom tier, e.g. {"advanced_analytics": true}.
    features jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Optional expiry for the pro plan; an expired pro plan falls back to free.
    plan_expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create a profile row when a new auth user signs up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill profiles for users that already exist.
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
-- All helpers are SECURITY DEFINER so they can read profiles without tripping
-- RLS (and to avoid recursive policy evaluation).

-- True when the given user has the admin role.
CREATE OR REPLACE FUNCTION is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin'
    );
$$;

-- Effective plan for a user, downgrading expired pro plans to free.
CREATE OR REPLACE FUNCTION effective_plan_for(uid uuid)
RETURNS plan_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN p.plan = 'pro'
             AND p.plan_expires_at IS NOT NULL
             AND p.plan_expires_at < now()
            THEN 'free'::plan_tier
        ELSE p.plan
    END
    FROM public.profiles p
    WHERE p.id = uid;
$$;

-- Effective limit for a resource ('customers' | 'orders').
-- Returns NULL to mean "unlimited".
CREATE OR REPLACE FUNCTION plan_limit_for(uid uuid, resource text)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    p public.profiles;
    eff plan_tier;
BEGIN
    SELECT * INTO p FROM public.profiles WHERE id = uid;
    IF NOT FOUND THEN
        -- No profile yet: treat as the most restrictive (free) defaults.
        eff := 'free';
    ELSE
        eff := effective_plan_for(uid);
    END IF;

    IF eff = 'custom' THEN
        -- NULL override means unlimited for that resource.
        IF resource = 'customers' THEN RETURN p.max_customers; END IF;
        IF resource = 'orders' THEN RETURN p.max_orders; END IF;
        RETURN NULL;
    ELSIF eff = 'free' THEN
        IF resource = 'customers' THEN RETURN 20; END IF;
        IF resource = 'orders' THEN RETURN 50; END IF;
        RETURN 0;
    ELSE
        -- pro: unlimited
        RETURN NULL;
    END IF;
END;
$$;

-- Convenience wrappers keyed off the current user (task-required API).
CREATE OR REPLACE FUNCTION current_plan()
RETURNS plan_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT effective_plan_for(auth.uid());
$$;

CREATE OR REPLACE FUNCTION plan_limit(resource text)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT plan_limit_for(auth.uid(), resource);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security for profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read every profile.
CREATE POLICY "Read own profile or admin reads all" ON profiles
    FOR SELECT USING (auth.uid() = id OR is_admin());

-- Only admins may change plan / role / overrides.
-- Users can NOT update their own plan (no self-service upgrade).
CREATE POLICY "Only admins can update profiles" ON profiles
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- DB-level limit enforcement (hard backstop; can't be bypassed via the API)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_customer_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lim int;
    cnt int;
BEGIN
    lim := plan_limit_for(NEW.user_id, 'customers');
    IF lim IS NULL THEN
        RETURN NEW; -- unlimited
    END IF;
    SELECT count(*) INTO cnt FROM public.customers WHERE user_id = NEW.user_id;
    IF cnt >= lim THEN
        RAISE EXCEPTION 'Customer limit reached for your plan (max %). Upgrade to add more.', lim
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_order_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lim int;
    cnt int;
BEGIN
    lim := plan_limit_for(NEW.user_id, 'orders');
    IF lim IS NULL THEN
        RETURN NEW; -- unlimited
    END IF;
    SELECT count(*) INTO cnt FROM public.orders WHERE user_id = NEW.user_id;
    IF cnt >= lim THEN
        RAISE EXCEPTION 'Order limit reached for your plan (max %). Upgrade to add more.', lim
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER customers_enforce_limit BEFORE INSERT ON customers
    FOR EACH ROW EXECUTE FUNCTION enforce_customer_limit();

CREATE TRIGGER orders_enforce_limit BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION enforce_order_limit();

-- ---------------------------------------------------------------------------
-- Table privileges
-- ---------------------------------------------------------------------------
-- Hosted Supabase auto-grants these to the API roles, but a fresh local /
-- self-hosted stack does not, which yields "permission denied for table ..."
-- despite RLS. Granting explicitly keeps local and hosted in parity; RLS
-- policies (above and in 001) remain the actual row-level access control.
GRANT ALL ON TABLE profiles, customers, orders TO anon, authenticated, service_role;
