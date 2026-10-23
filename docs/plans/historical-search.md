# Historical journal search — harness execution plan

**Branch:** feat/historical-journal-search
**Base:** main (0db020e5d2d550e142eb9949c6a7c263f1ddb000)
**Owner acceptance:** Human owner; merge and release excluded.

## Outcome and acceptance

- Search the current user's complete stored history (not only loaded screen entries), ignoring case.
- Match optional journal titles, notebook notes, priority text and evening reflections; old title-less rows remain searchable.
- Provide initial prompt, loading, empty-match and retryable error states.
- Navigate from a result to the source date, including mobile-sized screens.
- Verify auth rejection, explicit user scope, paginated reads, session changes and API failure paths.
- No new services, packages, database migration or index.

## Evidence map

| Acceptance item | Test path |
|---|---|
| Matching and untitled legacy entries | tests/journalSearch.test.ts |
| More than 100 entries, scoped SELECT, signed-out account and errors | tests/journalApiSearch.test.ts |
| Title autosave and date navigation | tests/App.test.tsx |
| Loading, no matches, error/retry, Escape and keyboard focus | tests/JournalSearch.test.tsx |
| Responsive styling | src/App.css; manual browser checks at 390px and 1280px |
| Production regression | GitHub Actions: npm ci, npm run lint, npm run test, npm run build |

## Risks, rollback and review

Client-side filtering fetches the full user's journal before displaying matches. This is simple for small histories but can be slower on a very large dataset. Server-side indexed text search is a deferred optimization, requiring separate migration design/review. RLS is already defined by migration but live cross-account verification remains a manual step following docs/SECURITY_VERIFICATION.md. The optional title is backwards-compatible JSON; reverting this PR restores the prior UI/API without a data migration. Do not use live credentials or real user data in automated tests.

Browser layout, live RLS and CI outcomes must be recorded as observed, not assumed. Creating a PR can prompt provider-managed preview automation; no agent-triggered deployment, production release or merge is authorized.
