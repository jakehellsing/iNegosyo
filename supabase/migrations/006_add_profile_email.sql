-- iNegosyo add profile email
-- Adds an email column to profiles and backfills it from auth.users.
-- Run this in your Supabase SQL editor after all earlier migrations.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing profiles with the auth email.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Capture email when a new auth user signs up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        business_name,
        full_name,
        contact_number,
        address
    ) VALUES (
        NEW.id,
        NEW.email,
        NULLIF(NEW.raw_user_meta_data ->> 'business_name', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'contact_number', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'address', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
