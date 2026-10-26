# Idea Board

A minimal, responsive Next.js + TypeScript idea board backed by Supabase Postgres. Visitors can submit ideas under a nickname and vote once per idea per browser voter ID. It uses no authentication or payments.

## Setup, one verified step at a time

Follow these steps in order. After each step, check the result before continuing.

### 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com/) and create a project on the Free plan.
2. Choose a project name, strong database password, and region. Save the database password in your password manager; the application does not need it.
3. Wait until the project reports that it is ready.

**Verify:** In the Supabase project dashboard, confirm the project is ready and open **Project Settings → API**. Keep that page available for the next step. Do not copy any `service_role` or secret key.

### 2. Create the database tables and policies

1. In Supabase, open **SQL Editor** and create a new query.
2. Copy all of [`supabase/schema.sql`](supabase/schema.sql), run it, and confirm it completes without errors.
3. Open **Table Editor**. Confirm `ideas` and `votes` exist. In `ideas`, confirm RLS is enabled. In `votes`, confirm RLS is enabled and there is a unique constraint named `votes_one_per_voter_per_idea`.

The SQL grants the public role read and insert access to idea fields and insert-only access to votes. Vote records and voter IDs cannot be read publicly. A database trigger increments the public count. No service-role or database password is used by the app.

**Verify:** Confirm both tables appear and the SQL editor reports success before continuing.

### 3. Configure and run the app locally

1. In **Project Settings → API**, copy the Project URL and the **publishable** key (or legacy anon key). Never use the `service_role` or secret key in this app.
2. Copy `.env.example` to `.env.local` and replace its two example values. Keep `.env.local` private; it is ignored by Git.
3. Install Node.js 20 or newer. In this folder run:

   ```sh
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). Submit an idea, then vote for it. Refresh and check the vote count.

The publishable/anon key is intentionally used only by server route handlers here, and is safe to use with the configured RLS. The browser talks to same-origin `/api` routes. The server sets an HTTP-only random voter cookie; the database unique constraint prevents that identifier from voting twice on the same idea. Clearing cookies or using another browser creates another anonymous identity, so this is duplicate prevention per identified browser, not robust identity verification or abuse prevention.

**Verify:** Confirm the board loads, an idea can be submitted, and one vote increments its count before deploying.

### 4. Deploy to Vercel Hobby

1. Push this project to a GitHub repository. Ensure `.env.local` is not committed.
2. In Vercel, import that repository and keep the detected Next.js build settings.
3. In **Project Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the same values used locally. Apply them to **Production** and **Preview** as desired. Do not add a service-role/secret key.
4. Deploy. After the deployment completes, open the Vercel URL and repeat the submit/vote checks.

Vercel Hobby is sufficient for this small app. Supabase Free and Vercel Hobby have separate usage limits; monitor their dashboards if traffic grows.

**Verify:** Confirm the deployed board loads and that submit/vote work on the Vercel URL.

## Notes

- No accounts, payments, or third-party server secrets are required.
- Anonymous submissions are open by design. Basic input validation runs in the API and is also enforced in Postgres. This first version does not include rate limiting, moderation, or spam prevention.
- `NEXT_PUBLIC_` variables are public by Next.js convention. These values are the Supabase project URL and publishable/anon key, not a secret. Do not put a secret key in any `NEXT_PUBLIC_` variable.
