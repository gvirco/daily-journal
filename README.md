# Daily Journal

Daily Journal is a React and TypeScript journal for daily reflection, priorities, and execution. Authentication and per-user entries are provided by Supabase.

## Feature status

Implemented: email/password authentication, per-user Supabase entries, date navigation, morning ratings, three priorities, a daily notebook with an optional title, evening review, historical journal search, autosave, and confirmed deletion of the selected entry. JSON/CSV export and JSON import are P1 future scope; they are not implemented.

## Documentation

- [Product idea](docs/PRODUCT_IDEA.md)
- [MVP priorities and acceptance criteria](docs/MVP.md)
- [Database model](docs/DATA_MODEL.md)
- [Current architecture](docs/ARCHITECTURE.md)
- [Implementation history](docs/IMPLEMENTATION_HISTORY.md)
- [Test report and lecturer checklist](docs/TEST_REPORT.md)
- [Supabase RLS verification procedure](docs/SECURITY_VERIFICATION.md)
- [Assessment demo script](docs/DEMO.md)
- [Required submission screenshots](docs/screenshots/README.md)
- [Product specification](PRODUCT_SPEC.md)
- [Development workflow](DEVELOPMENT_WORKFLOW.md)

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project dashboard. Use only the publishable key in the browser.
3. Install dependencies and start Vite:

```bash
npm install
npm run dev
```

The Supabase project must have the `journal_entries` migration applied and email confirmation disabled for immediate email/password registration.

## Vercel deployment

Import the GitHub repository into Vercel and keep `main` as the production branch. Vercel detects Vite and uses `npm run build`, which produces `dist`; no `vercel.json` is required for the current single-page application.

In Vercel, set these environment variables for both Preview and Production deployments:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the same deployment URL as the Supabase Auth Site URL, and add it to Supabase Auth Redirect URLs where applicable. Never add service-role or secret keys to Vercel frontend variables.

## Verification

```bash
npm run lint
npm run build
npm run test
```

`npm run test` runs mocked Vitest tests and does not require Supabase credentials. See the [test report](docs/TEST_REPORT.md) for coverage and manual checks that still need evidence.

## Production application

Production URL: **PENDING — add the confirmed Vercel production URL before submission.** The repository contains no deployment URL or Vercel project metadata, so one is not inferred here.

## Data retention

Supabase Auth manages persistent browser sessions. Journal entries are stored in `public.journal_entries` and are isolated by row-level security. Legacy browser `localStorage` data and local SQLite files are preserved but are not used or migrated.

## Supabase CLI

The repository is linked to the Supabase project and contains migrations under `supabase/migrations/`. Apply pending migrations intentionally with:

```bash
npx supabase db push
```
