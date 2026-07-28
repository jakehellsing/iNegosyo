-- iNegosyo admin-only profile updates
-- Run this in your Supabase SQL editor or with `supabase db push`
-- AFTER 004_profile_details.sql.

-- Only admins may update profile rows. Users can still read their own profile.
DROP POLICY IF EXISTS "Users can update own profile, admins can update any" ON profiles;

CREATE POLICY "Only admins can update profiles" ON profiles
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
