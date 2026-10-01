# Daily Journal — Agent Instructions

## Project Purpose

Daily Journal is a small browser-based personal performance journal.

This repository is intentionally being used as a learning project for
professional AI-assisted software development practices.

Keep solutions simple, understandable, and appropriate for a small MVP.

## Sources of Truth

Use the following documents when relevant:

- `DESIGN_SYSTEM.md` — visual language, design tokens, layout, interaction patterns, and UI conventions.
- `PRODUCT_SPEC.md` — product requirements, MVP scope, and acceptance criteria.
- `PROJECT_STATUS.md` — current development phase and planned next steps.
- `README.md` — project overview and developer usage instructions.

Do not duplicate these documents unnecessarily.

## Current Technology

- React
- TypeScript
- Vite
- ESLint

Planned for MVP:

- localStorage persistence
- Vitest
- GitHub Actions
- Vercel

## MVP Architecture Rules

### Local-first

MVP 1.0 has no backend, authentication, cloud database, or external API.

### Persistence boundary

React UI components must not access `localStorage` directly.

Persistence must be implemented through a dedicated journal
storage/service layer.

This should allow the persistence implementation to be changed later,
for example to add Google Sheets synchronization.

### Daily Journal domain

The primary domain object is a journal entry associated with one
calendar date.

Keep the data model explicit and strongly typed.

## Development Approach

Build the application incrementally.

For each task:

1. Implement only the requested scope.
2. Avoid adding unrelated functionality.
3. Keep the implementation as simple as reasonably possible.
4. Run relevant verification before considering the task complete.
5. Explain any important architectural decision or trade-off.

Do not implement future roadmap features unless explicitly requested.

## Code Quality

- Use TypeScript types rather than `any` where practical.
- Prefer small, clear components and functions.
- Avoid premature abstractions.
- Avoid introducing new dependencies without a clear need.
- Follow the existing project structure and naming conventions.
- Preserve readability over cleverness.
- Follow `DESIGN_SYSTEM.md` for all visual implementation.
- Reuse existing design tokens instead of introducing arbitrary colours, spacing, radii, or typography values.
- Prefer restrained, data-first UI over decorative styling.

## Verification

For code changes, run relevant available checks.

At minimum, when appropriate:

```bash
npm run lint
npm run build