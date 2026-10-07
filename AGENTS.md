# Daily Journal — Agent Instructions

## Working agreement

- Implement only the requested scope. Do not add roadmap work without an explicit request.
- Prefer simple, understandable solutions suitable for a small MVP.
- Avoid premature abstractions and unnecessary dependencies.
- Follow the existing TypeScript and project conventions; use explicit types rather than `any` where practical.
- Do not commit changes unless explicitly requested.

## Architecture

- The MVP is local-first. Do not introduce a backend, authentication, cloud services, or external APIs unless explicitly requested later.
- A `DailyJournalEntry` represents exactly one local calendar date, formatted `YYYY-MM-DD`.
- UI components must not access `localStorage` directly. Read and write journal data through the journal service/storage layer.

## Documentation

- Read `AGENTS.md` by default.
- Read other repository documentation only when it is relevant to the task:
  - `PRODUCT_SPEC.md` for product scope and acceptance criteria;
  - `DESIGN_SYSTEM.md` for UI work;
  - `DEVELOPMENT_WORKFLOW.md` for development, review, and Git workflow;
  - `README.md` for the repository overview and commands.

## Quality

- Follow `DESIGN_SYSTEM.md` for UI work and reuse its existing tokens.
- Run relevant verification before finishing. For code changes, normally run:

  ```bash
  npm run lint
  npm run build
  ```
