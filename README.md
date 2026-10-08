# Daily Journal

Daily Journal is a small, local-first browser journal for daily reflection, priorities, and execution.

## Current MVP state

The core daily-journal experience is implemented. Entries are stored locally in the browser and are separated by calendar date.

Implemented core functionality:

- date navigation;
- local persistence;
- Morning check-in;
- Daily Goals;
- Daily Notebook;
- Evening Review.

Next major MVP work:

- export and import;
- automated tests;
- CI;
- deployment.

## Technology

- React
- TypeScript
- Vite
- ESLint
- browser `localStorage`
- Express
- SQLite (API foundation)

## Run and verify

```bash
npm install
npm run dev
```

In a second terminal, start the API foundation:

```bash
npm run dev:api
```

The API listens on `http://localhost:3001` by default. Confirm it is running
with `GET /health`. The SQLite database is created at
`data/daily-journal.sqlite` by default. Set `DATABASE_PATH` or `PORT` in your
shell to override either value. Runtime databases and `.env` files are ignored
by Git.

## API authentication

The API supports username/password registration and login. Passwords are stored
as Argon2id hashes; session tokens are stored server-side in SQLite and sent in
`HttpOnly`, `SameSite=Lax` cookies. Cookies use the `Secure` attribute for HTTPS
requests.

- `POST /api/auth/register` with `{ "username", "password" }` creates an account and signs it in.
- `POST /api/auth/login` with `{ "username", "password" }` creates a session.
- `POST /api/auth/logout` ends the current session.
- `GET /api/auth/me` returns the signed-in user or `401`.

Usernames must be 3-32 characters using letters, digits, `_`, or `-`.
Passwords must be 8-128 characters. Existing API-foundation databases are
migrated in place: existing users and journal entries are retained, and old
email values are preserved as legacy data. Legacy users have no password
credentials.

```bash
npm run lint
npm run build
npm run test:db
npm run test:auth
```

## Documentation

- `AGENTS.md` — coding-agent contract and architecture constraints.
- `PRODUCT_SPEC.md` — MVP product scope and acceptance criteria.
- `DESIGN_SYSTEM.md` — durable UI guidance and canonical tokens.
- `DEVELOPMENT_WORKFLOW.md` — feature, review, Git, and PR checklist.
