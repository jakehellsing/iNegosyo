# Plan Duration Feature Test Plan

## Objective
Verify that the plan-expiry date controls on `/admin` and the effective-plan downgrade logic on `/settings` and `/dashboard` behave as specified in PR https://github.com/jakehellsing/iNegosyo/pull/2.

## Environment
- Local Next.js dev server: `http://localhost:3000` (branch `devin/1785216596-plan-duration`)
- Supabase project: configured via `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Test account: `jakehellsing@gmail.com` / `123456`
- Migration `003_plan_duration.sql` is assumed **not applied** to the live project (per lead note) and will be reported as not verified.

## Code References
- Admin plan-expiry UI: `app/(app)/admin/page.tsx` lines 140-165 (`formatDateInput`, `parseExpiryDate`, conditional expiry input).
- Settings plan/expiry display: `app/(app)/settings/page.tsx` lines 36-60 (plan badge + usage), lines 51-55 (expiry text), lines 68-70 (`RequirePlan` advanced analytics gate).
- Effective plan downgrade: `lib/plans.ts` lines 49-58 (`effectivePlan` downgrades expired non-free plans to free).
- Plan limits/features: `lib/plans.ts` lines 20-34 (`PLAN_LIMITS`, `PLAN_FEATURES`).
- SQL migration: `supabase/migrations/003_plan_duration.sql` (not applied; not tested).

## Test Cases

### T1: Non-admin authenticated user sees correct plan and analytics gating
1. Open `http://localhost:3000/login`.
2. Log in with `jakehellsing@gmail.com` / `123456`.
3. Navigate to `/settings`.
4. **Pass criteria:**
   - Plan card shows a badge labeled `Free`, `Pro`, or `Custom` (whatever is the effective plan for this user).
   - If the effective plan is non-free, the text "Plan expires on <date>." is visible; if free, the free-plan upgrade prompt is visible.
   - Usage rows show `count / limit` values consistent with `PLAN_LIMITS` for that plan (`Free` = 20 customers / 50 orders, `Pro`/`Custom` = `Unlimited`).
   - The "Advanced Analytics" section shows either analytics cards (unlocked) or the upgrade lock message: "This feature is available on the Pro plan. Contact an admin to upgrade."
5. Navigate to `/dashboard`.
6. **Pass criteria:** The plan badge in the top-right corner matches the badge shown on `/settings`.

### T2: /admin access and plan-expiry input (only if logged-in user is admin)
1. From `/settings`, click "Manage user plans" / navigate to `/admin`.
2. **Pass criteria:** `/admin` loads and displays user profile cards with a `Plan` select.
3. Select a non-free plan (`Pro` or `Custom`) for any profile.
4. **Pass criteria:** A "Plan expires" date input appears; the "Clear" button is disabled when the input is empty and enabled when a date is present.
5. Enter a future date, click Save, and refresh `/admin`.
6. **Pass criteria:** The date input still contains the selected future date (persisted to `profiles.plan_expires_at`).
7. Clear the date and save.
8. **Pass criteria:** The input is empty and the paid plan remains selected.

### T3: Expired paid plan falls back to free (only if admin access is available)
1. In `/admin`, set a target user's plan to `Pro` or `Custom` with a future expiry date and save.
2. Open `/settings` for the target user (or observe the same user if self-modifying).
3. Confirm the plan badge is non-free and analytics are unlocked.
4. Return to `/admin`, change the expiry date to a past date, and save.
5. Return to `/settings` for that user and refresh.
6. **Pass criteria:**
   - The plan badge now shows `Free`.
   - Usage limits on `/settings` reset to `20` customers / `50` orders (or `Free` limits).
   - Advanced Analytics shows the locked upgrade prompt.
   - `/dashboard` plan badge shows `Free`.

### T4: Edge cases (admin-only, if T2 passes)
1. **Plan switch from paid to free:** In `/admin`, change a profile from `Pro`/`Custom` to `Free`. Verify the expiry input disappears and the saved profile has `plan_expires_at` cleared.
2. **Custom plan with overrides:** Set a profile to `Custom`, enter override values for Max customers/Max orders, set an expiry date, save. Verify `/settings` for that user shows `Custom` plan and the specified limits.

## Not Verified / Blocked (to report)
- Migration `003_plan_duration.sql` cannot be applied or verified without service role.
- SQL function `effective_plan_for()` behavior cannot be queried directly without admin DB access.
- Any `/admin` or SQL-level behavior is blocked if the supplied test account is not an admin.
