-- iNegosyo user profile details
-- Adds editable business/personal fields to profiles and captures them during
-- sign-up from the auth user metadata sent by the registration form.
-- Run this in your Supabase SQL editor or with `supabase db push`
-- AFTER 003_plan_duration.sql.

-- Business and contact fields for each user profile.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS business_name text,
    ADD COLUMN IF NOT EXISTS full_name text,
    ADD COLUMN IF NOT EXISTS contact_number text,
    ADD COLUMN IF NOT EXISTS address text;

-- Auto-create / populate a profile row when a new auth user signs up,
-- reading the extra registration fields stored in raw_user_meta_data.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        business_name,
        full_name,
        contact_number,
        address
    ) VALUES (
        NEW.id,
        NULLIF(NEW.raw_user_meta_data ->> 'business_name', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'contact_number', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'address', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Allow users to update their own profile details. Admins can still update any
-- profile (needed for the admin plan-management UI).
DROP POLICY IF EXISTS "Only admins can update profiles" ON profiles;

CREATE POLICY "Users can update own profile, admins can update any" ON profiles
    FOR UPDATE USING (auth.uid() = id OR is_admin())
    WITH CHECK (auth.uid() = id OR is_admin());

-- Enforce that only admins can change plan/admin fields. Users editing their
-- own profile can only change business_name, full_name, contact_number, and address.
CREATE OR REPLACE FUNCTION enforce_profile_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin() THEN
        IF NEW.plan IS DISTINCT FROM OLD.plan
           OR NEW.role IS DISTINCT FROM OLD.role
           OR NEW.max_customers IS DISTINCT FROM OLD.max_customers
           OR NEW.max_orders IS DISTINCT FROM OLD.max_orders
           OR NEW.features IS DISTINCT FROM OLD.features
           OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
            RAISE EXCEPTION 'Only admins can change plan or role fields.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_admin_fields ON profiles;
CREATE TRIGGER profiles_enforce_admin_fields
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION enforce_profile_admin_fields();
