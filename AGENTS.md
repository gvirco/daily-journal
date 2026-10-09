# Daily Journal — Agent Instructions

## Working agreement

- Implement only the requested scope. Do not add roadmap work without an explicit request.
- Prefer simple, understandable solutions suitable for a small MVP.
- Avoid premature abstractions and unnecessary dependencies.
- Follow the existing TypeScript and project conventions; use explicit types rather than `any` where practical.
- Do not commit changes unless explicitly requested.

## Architecture

- Daily Journal uses a React/TypeScript frontend and a local Express API backed by persistent SQLite. Do not add cloud services or external integrations without an explicit request.
- A `DailyJournalEntry` represents exactly one local calendar date, formatted `YYYY-MM-DD`, for one authenticated user.
- UI components must access journal data through `src/services/journalApi.ts`, not directly through storage or `localStorage`.
- The API derives the user identity from the server-side session, never a client-supplied user ID. Keep every journal operation scoped to the authenticated user.
- Preserve the existing legacy `localStorage` data. Do not migrate it or use it as a fallback unless explicitly requested.
- Do not store plaintext passwords, expose session tokens to JavaScript, or commit runtime SQLite files or secrets.

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

- Run tests relevant to the changed functionality:

  ```bash
  npm run test:db
  npm run test:auth
  npm run test:journal
  npm run test:frontend
  ```

- Before completing a feature PR, run the full verification suite.
- Perform manual verification of affected user flows.
- Report failed checks and known limitations; do not claim unverified functionality works.