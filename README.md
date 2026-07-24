# iNegosyo

A mobile-first order, customer, and payment tracker for small home-based PH businesses.

## Tech Stack

- **Framework:** Next.js 15 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL)
- **Hosting:** Vercel

## Project Structure

```text
app/
  (app)/           Protected app shell (dashboard, orders, customers, payments)
  (auth)/          Login and sign-up screens
  globals.css      Tailwind / shadcn theme
  layout.tsx       Root layout + providers
components/
  ui/              shadcn/ui components
  layout/          App header and mobile navigation
lib/
  auth/            Auth context (localStorage mock for quick scaffolding)
  supabase/        Supabase browser, server, and middleware clients
  store.ts         Local-first data store (replaces with Supabase later)
  types.ts         Shared TypeScript types
  utils.ts         Tailwind cn + peso formatter
supabase/
  migrations/      Database schema and RLS policies
  seed.sql         Sample data
```

## Getting Started

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. Log in or sign up with any email address. The app uses localStorage for fast local scaffolding and seeds sample data.

## Supabase Setup

1. Create a project on [Supabase](https://supabase.com).
2. Add the **URL** and **Anon Key** to `.env.local`.
3. Run the migration in `supabase/migrations/001_initial_schema.sql` from the Supabase SQL Editor.
4. Update `lib/store.ts` / `lib/auth/context.tsx` to use Supabase instead of localStorage when ready.

## Deployment

```bash
vercel
```

Set the environment variables in the Vercel dashboard before deploying.

## Scripts

- `npm run dev` — Start local dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
