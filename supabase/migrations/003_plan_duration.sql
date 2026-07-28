-- iNegosyo plan duration logic
-- Expands plan expiry handling so any paid plan (`pro` or `custom`) falls back
-- to `free` when `plan_expires_at` is in the past.

-- Update effective_plan_for to downgrade any expired paid plan to free.
CREATE OR REPLACE FUNCTION effective_plan_for(uid uuid)
RETURNS plan_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN p.plan <> 'free'
             AND p.plan_expires_at IS NOT NULL
             AND p.plan_expires_at < now()
            THEN 'free'::plan_tier
        ELSE p.plan
    END
    FROM public.profiles p
    WHERE p.id = uid;
$$;
