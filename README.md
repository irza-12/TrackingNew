# Catering Pulse

Catering Pulse is a personal catering expense tracker built with React, TypeScript, Vite, Tailwind-compatible styling, Supabase Auth/Postgres, Recharts, jsPDF, and ExcelJS.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Create `.env.local` in the project root using `.env.example`.
4. Start the app with `npm run dev`.
5. Build with `npm run build`; run tests with `npm test`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **Dashboard > SQL Editor**.
3. Paste the complete contents of `supabase/schema.sql` and select **Run**.
4. Open **Project Settings > API** and copy the Project URL and anon public key.
5. Put those values in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Open **Authentication > Providers**, confirm Email is enabled, and optionally disable Confirm email for a personal app.

### Google login

1. Open [Google Cloud Console](https://console.cloud.google.com/), create or select a project, and configure the OAuth consent screen.
2. Create an OAuth Client ID with application type **Web application**.
3. In the authorized redirect URIs, add the Supabase callback URL shown in **Supabase > Authentication > Providers > Google**. It normally uses the form `https://<project-ref>.supabase.co/auth/v1/callback`.
4. In Supabase, enable the Google provider and paste the supplied Google Client ID and Client Secret. The Client ID provided for this project is `276725172921-61336iu30fn663l62a8e3eko4qu5np40.apps.googleusercontent.com`.
5. Add the local and production app URLs under Supabase **Authentication > URL Configuration > Redirect URLs**, for example `http://127.0.0.1:5173/` and your Vercel URL.

The Google button uses Supabase OAuth and does not expose the Client Secret in frontend code. After Google redirects back, the existing Supabase session listener opens the dashboard automatically.

The schema enables Row Level Security. Every transaction and budget row is restricted to the authenticated owner through `auth.uid()` policies.

## Vercel deployment

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New Project** and import the repository.
3. Keep the Vite preset, build command `npm run build`, and output directory `dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Environment Variables for the required environments.
5. Deploy, open the generated URL, and verify signup, login, protected dashboard access, database persistence, and exports.

The deployment URL is not recorded yet because this workspace has no GitHub or Vercel credentials. After deployment, add the production URL here.

## Features

- Responsive Catering Pulse dashboard with spend KPIs, budget progress, trend chart, and transaction table.
- Google-profile display name, editable unique username, avatar URL, and date report slicers (`This month`, `1–15`, `10–12`, and custom range).
- Pure TypeScript calculation and date-range utilities with Vitest coverage.
- Supabase-ready database schema with ownership RLS.
- Environment template and production deployment instructions.

## Current validation

- `npm install`: completed successfully.
- `npm run build`: passes.
- `npm test`: configured with pure-function tests.
- Manual Supabase Auth, RLS, export, and Vercel smoke tests require the user's Supabase/Vercel projects and credentials, which are not available in this workspace.
- After updating `supabase/schema.sql`, run the full file again in Supabase SQL Editor so the `profiles` table and its RLS policies are created.
