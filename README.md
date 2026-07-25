# iNegosyo

A mobile-first order, customer, and payment tracker for small home-based PH businesses.

## Current System Status

| Area | Status | Notes |
|------|--------|-------|
| **Repo** | `main` branch, tag `v0.2.7` | Version tags are used instead of release branches. |
| **Local dev** | Working | `npm run dev` at `http://localhost:3000` with `.env.local` containing Supabase credentials. |
| **Database** | Supabase | `customers` and `orders` tables, enums, RLS policies, and triggers are applied via `supabase/migrations/001_initial_schema.sql`. |
| **Auth** | Supabase email/password | Sign-up, login, and protected routes via `lib/auth/context.tsx`. |
| **Vercel deployment** | Working | Live site is built from `main` on every push; requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings. |
| **Smoke tested** | Yes | Dashboard, customers, orders, and payments pages load and CRUD works. |

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui + Base UI
- **Backend:** Supabase (Auth + PostgreSQL)
- **Hosting:** Vercel

## Project Structure

```text
app/
  (app)/           Protected app shell (dashboard, orders, customers, payments)
  (auth)/          Login and sign-up screens
globals.css        Tailwind / shadcn theme
  layout.tsx       Root layout + providers
components/
  ui/              shadcn/ui components
  layout/          App header and mobile navigation
lib/
  auth/            Supabase-backed auth context
  supabase/        Browser, server, and middleware clients
  store.ts         Async data layer over Supabase
  types.ts         Shared TypeScript types
  utils.ts         Tailwind cn + peso formatter
supabase/
  migrations/      Database schema and RLS policies
  seed.sql         Sample data
```

## Getting Started

1. Copy the environment template and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Apply the Supabase migration before running the app:

   - Open your Supabase project → **SQL Editor**
   - Paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Click **Run**

4. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. Sign up with an email and password, then log in.

## Multi-Tenancy

Each user signs up with a unique email. `customers` and `orders` rows are scoped to `user_id` and protected by Row Level Security (RLS) so users can only access their own records.

## Roadmap / Future Plans

1. **Multi-user / organization support**
   - Add an `organizations` table and `organization_members(user_id, organization_id, role)` with roles such as `owner`, `staff`, `cashier`.
   - Replace `user_id` on `customers` and `orders` with `organization_id`.
   - Update RLS policies to check `organization_id` via `organization_members`.
   - Add owner-managed invites (email or invite code) in the app UI.

2. **Performance and offline resilience**
   - Reduce tab-switching latency with server-side prefetch or local caching.
   - Cache dashboard and list data for faster mobile experience.

3. **Mobile / PWA polish**
   - Add icons, splash screen, and a service worker for app-like install.
   - Improve touch targets and loading states.

4. **Operational features**
   - Order status workflow with notifications/reminders.
   - Printable receipts and SMS/WhatsApp share for orders.
   - Basic reporting (daily/weekly sales, top customers).

5. **Security / compliance**
   - Audit log table for data changes.
   - Soft-delete for customers and orders.

This roadmap should be prioritized based on user feedback and business size.

## Deployment Map

| Layer | Name / URL | Notes |
|-------|------------|-------|
| **Source code** | `github.com/jakehellsing/iNegosyo` | `main` branch, versioned with git tags. |
| **Local dev** | `http://localhost:3000` | Run `npm run dev` with `.env.local` values. |
| **Database + Auth** | Supabase project `xyqfpszxoyjksywmdlpj` | Apply `supabase/migrations/001_initial_schema.sql` in the SQL Editor before using the app. |
| **Production hosting** | Vercel (project `i-negosyo`) | Auto-deploys from every push to `main`. |

## Deployment

```bash
vercel
```

**Important:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must already exist in **Vercel → Project Settings → Environment Variables** when the build runs. If they are added after a deployment, trigger a redeploy (push a new commit or click **Redeploy**) so the values are baked into the bundle.

## Scripts

- `npm run dev` — Start local dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
