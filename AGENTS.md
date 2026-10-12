# Daily Journal — Agent Instructions

## Working agreement

- Implement only the requested scope. Do not add roadmap work without an explicit request.
- Prefer simple, understandable solutions suitable for a small MVP.
- Avoid premature abstractions and unnecessary dependencies.
- Follow the existing TypeScript and project conventions; use explicit types rather than `any` where practical.
- Do not commit changes unless explicitly requested.

## Architecture

- Daily Journal uses a React/TypeScript frontend with Supabase Auth and a Supabase PostgreSQL database. Do not add services or external integrations without an explicit request.
- Production deployment is a static Vite build on Vercel; `npm run build` outputs `dist`.
- A `DailyJournalEntry` represents exactly one local calendar date, formatted `YYYY-MM-DD`, for one authenticated user.
- UI components must access journal data through `src/services/journalApi.ts`, not directly through Supabase or `localStorage`.
- Journal operations use the authenticated Supabase user's UUID and must remain protected by database RLS.
- Preserve the existing legacy `localStorage` data. Do not migrate it or use it as a fallback unless explicitly requested.
- Do not store passwords, use Supabase service-role or secret keys in the frontend, or commit Vercel local state, Supabase temporary files, runtime SQLite files, `.env` files, or secrets.

## Documentation

- Read `AGENTS.md` by default.
- Read other repository documentation only when it is relevant to the task:
  - `PRODUCT_SPEC.md` for product scope and acceptance criteria;
  - `DESIGN_SYSTEM.md` for UI work;
  - `DEVELOPMENT_WORKFLOW.md` for development, review, and Git workflow;
  - `README.md` for the repository overview and commands.


## Quality

- Follow `DESIGN_SYSTEM.md` for UI work and reuse its existing tokens.
- Run relevant verification before finishing.
- For code changes, always run:

  ```bash
  npm run lint
  npm run build
  ```

- Run tests relevant to the changed functionality when they exist.

- Before completing a feature PR, run the full verification suite.
- Perform manual verification of affected user flows.
- Report failed checks and known limitations; do not claim unverified functionality works.
