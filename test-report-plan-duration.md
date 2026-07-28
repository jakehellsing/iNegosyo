# iNegosyo Plan Duration Feature – End-to-End Test Report

## Summary
I ran the local Next.js dev server on branch `devin/1785216596-plan-duration` and tested the plan-expiry feature through the UI with the provided test account (`jakehellsing@gmail.com`), which is an admin on a `Custom` plan. I verified that the `/admin` plan-expiry date input persists and clears, that `/settings` displays the expiry date for paid plans, and that an expired paid plan correctly falls back to `Free` (limit reset, analytics locked) while clearing the expiry restores the paid plan.

The Supabase migration `003_plan_duration.sql` was **not verified** because it has not been applied to the live project and we did not have service-role access.

## Tested Environment
- Local dev server: `http://localhost:3000`
- Branch: `devin/1785216596-plan-duration`
- Supabase project: `xyqfpszxoyjksywmdlpj` (from `README.md`)
- Test user: `jakehellsing@gmail.com` / `123456` (admin, `Custom` plan)

## Test Assertions

- ✅ **Login & dashboard plan badge** – Logged in successfully; dashboard showed `Custom` plan badge.
- ✅ **Admin plan-expiry input appears for non-free plans** – `/admin` showed the `Plan expires` date input for the `Custom` user.
- ✅ **Future expiry date persists** – Setting `2030-12-31` on a `Custom` user saved and still appeared after refresh; `/settings` showed `Plan expires on 12/31/2030.` with `Custom` badge, unlimited usage, and unlocked Advanced Analytics.
- ✅ **Cleared expiry keeps paid plan active** – Clearing the date, saving, and returning to `/settings` restored the `Custom` plan with `3 / 100` customers, `2 / 100` orders, and unlocked analytics.
- ✅ **Expired paid plan falls back to Free** – Changing the expiry to `2020-01-01` and returning to `/settings` showed `Free` plan, `3 / 20` customers, `2 / 50` orders, and the Advanced Analytics upgrade-lock message.
- ✅ **Custom overrides work** – With the `Custom` plan and `max_customers = 100`, `max_orders = 100`, `/settings` rendered `3 / 100` and `2 / 100`.
- ⚠️ **Plan switch pro → free hides but does not clear expiry** – In `/admin`, switching a `Pro` user to `Free` hides the expiry input. However, the expiry value is left in `profiles.plan_expires_at`; switching back to `Pro` causes the old expiry date (`2030-12-31`) to reappear. This is a potential data-surprise behavior.
- ❌ **Migration `003_plan_duration.sql` not verified** – No service-role access; could not apply or query `effective_plan_for()` in the database.

## Visual Evidence

### 1. Admin: expiry date set and saved
![/admin with future expiry 2030-12-31 saved](https://app.devin.ai/attachments/e57d894f-1dce-498d-aaeb-67d55c92b8c9/ss_5b310fe8.png)

### 2. Admin: expiry cleared and saved
![/admin after clearing expiry](https://app.devin.ai/attachments/e0b61678-7a23-44a0-b563-79638430c942/ss_f6182aa6.png)

### 3. Settings: paid plan with future expiry (Custom + expiry text)
![/settings Custom with expiry 12/31/2030](https://app.devin.ai/attachments/ac16714d-4517-4f5d-b71f-f0a1872d47c7/ss_c89d20c7.png)

### 4. Settings: expired paid plan downgraded to Free
![/settings Free with 3/20 and 2/50 limits and locked analytics](https://app.devin.ai/attachments/4b05401b-c9f7-46ca-9c19-48cfd88266d4/ss_3f551cdc.png)

### 5. Settings: clearing expiry restores Custom plan and overrides
![/settings Custom restored with 3/100 and 2/100 and unlocked analytics](https://app.devin.ai/attachments/392e4785-4f48-49fc-bf04-fc70d17bf92f/ss_63bac7b6.png)

### 6. Dashboard: plan badge shows Custom
![/dashboard Custom badge](https://app.devin.ai/attachments/3cf2460c-43b1-4286-8619-6aa9e5aafca9/ss_6ea14464.png)

### 7. Edge case: switching Pro → Free hides the expiry input
![/admin Pro user switched to Free; expiry input hidden](https://app.devin.ai/attachments/7ca9bd1a-f73c-4460-af10-202a4de03b32/ss_373f2161.png)

### 8. Edge case: switching back to Pro re-surfaces the old expiry (not cleared)
![/admin Pro re-selected; old expiry 2030-12-31 reappears](https://app.devin.ai/attachments/99845207-3744-4cc5-a5f1-227c732b991d/ss_09dd0601.png)

## Not Verified / Blocked
- **SQL migration `003_plan_duration.sql`**: Could not apply or verify because service-role access was not available. The frontend tests covered the same downgrade logic in `lib/plans.ts`, but the `effective_plan_for()` database function was not exercised.
- **DB-level limit triggers** for expired plans: not tested directly for the same reason.

## Artifacts
- Screen recording: `/home/ubuntu/screencasts/plan-duration-test/plan-duration-test-edited.mp4`
- Test plan: `/home/ubuntu/repos/iNegosyo/test-plan-plan-duration.md`

## Suggested PR Comment

```markdown
Tested the plan-duration PR locally on `devin/1785216596-plan-duration` with the provided test admin account.

**What passed**
- Admin `/admin` shows the `Plan expires` date input for `pro`/`custom` plans and the date persists after save.
- Clearing the date in `/admin` keeps the `Custom` plan active and `/settings` shows `Custom` + unlimited limits + unlocked Advanced Analytics.
- Setting the date to the past downgrades the user to `Free` in `/settings` (`3 / 20` customers, `2 / 50` orders, analytics locked).
- Dashboard plan badge updates to `Free`/`Custom` accordingly.
- Custom plan overrides (max 100) are reflected as `3 / 100` and `2 / 100` in `/settings`.

**Concern / edge case**
- Switching a plan from `pro` to `free` hides the expiry input but does **not** clear `profiles.plan_expires_at`. When the plan is later switched back to `pro`, the old expiry date reappears. If the intent is to clear the expiry on downgrade, `updateUserPlan` should null `plan_expires_at` when `plan` becomes `free`.

**Not verified**
- `supabase/migrations/003_plan_duration.sql` could not be applied or tested; the Supabase project did not have it applied and we had no service-role key.

![Free downgrade](https://app.devin.ai/attachments/4b05401b-c9f7-46ca-9c19-48cfd88266d4/ss_3f551cdc.png)
![Custom restore](https://app.devin.ai/attachments/392e4785-4f48-49fc-bf04-fc70d17bf92f/ss_63bac7b6.png)
```

## SKILL.md Suggestion
`/home/ubuntu/repos/iNegosyo/.agents/skills/testing-inegosyo/SKILL.md` – captures how to run the local dev server, the need for a pre-confirmed test account (email confirmation is enabled), and how to request service-role access for admin/SQL tests.

## Blueprint Suggestions
- Add a note to the repo blueprint that `npm run dev` requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or a `.env.local` file).
- Consider adding `.env.example` to the repo; `README.md` references it but the file does not exist.
- For automated testing, a pre-confirmed test user or a way to disable email confirmation would avoid the login blocker we hit.
