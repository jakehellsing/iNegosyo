# iNegosyo

A mobile-first order, customer, and payment tracker for small home-based PH businesses.

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

## Future: Multi-User / Organization Support

For larger sellers who need staff accounts or shared business data:

- Add an `organizations` table.
- Add `organization_members(user_id, organization_id, role)` with roles such as `owner`, `staff`, `cashier`.
- Replace `user_id` on `customers` and `orders` with `organization_id`.
- Update RLS policies to check `organization_id` via `organization_members`.
- Add owner-managed invites (email or invite code) in the app UI.

This is not scaffolded yet and should be added when the business needs shared access.

## Deployment

```bash
vercel
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel dashboard before deploying.

## Scripts

- `npm run dev` — Start local dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
