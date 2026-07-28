---
name: Testing iNegosyo end-to-end
description: How to run the iNegosyo Next.js app locally, authenticate, and test plan/admin features.
---

## Devin Secrets Needed
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, only if you need to set admin roles or run SQL migrations)

## Running the app
- `npm install` if `node_modules` is stale.
- Start dev server with the Supabase env vars visible:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=<...> NEXT_PUBLIC_SUPABASE_ANON_KEY=<...> npm run dev
  ```
- Open `http://localhost:3000`.

## Authentication notes
- The Supabase project has email confirmation enabled. A freshly signed-up user cannot log in until the email is confirmed.
- For end-to-end testing, request a **pre-confirmed test account** from the user/lead, or request service-role access to confirm a user manually.
- To make a user an admin, run in the Supabase SQL editor:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE id = '<auth-user-id>';
  ```
  This requires service-role / dashboard access.

## Key routes
- `/login`, `/signup` – auth
- `/settings` – plan badge, usage limits, Advanced Analytics gating
- `/dashboard` – plan badge in top-right
- `/admin` – admin-only user plan management (requires `role = 'admin'`)

## Testing gotchas
- The plan-expiry UI only appears in `/admin` when the target plan is `pro` or `custom`.
- `/settings` shows the expiry text only when the effective plan is non-free and `plan_expires_at` is set.
- An expired paid plan is computed by `lib/plans.ts` `effectivePlan()` on the client and by `effective_plan_for()` in Postgres; both should match.
- Supabase migrations in `supabase/migrations/` are not applied automatically by Vercel. Verify migrations are applied before claiming SQL-side behavior works.
