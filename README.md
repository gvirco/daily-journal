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

## Journal API

Journal endpoints require the authentication session cookie. The user identity is
always derived from that session, not from the request body.

- `GET /api/entries/:date` returns that user's entry for a real `YYYY-MM-DD` date, or `404`.
- `PUT /api/entries/:date` creates or completely replaces that user's entry.

The `PUT` body is a `DailyJournalEntry` whose `date` must exactly match `:date`.
Sections are optional, so partially completed entries are valid. Ratings must be
integers from 1 through 10; goals require a string `text` and boolean
`completed`; and the API rejects fields outside the domain model.

```bash
npm run lint
npm run build
npm run test:db
npm run test:auth
npm run test:journal
```

## Documentation

- `AGENTS.md` — coding-agent contract and architecture constraints.
- `PRODUCT_SPEC.md` — MVP product scope and acceptance criteria.
- `DESIGN_SYSTEM.md` — durable UI guidance and canonical tokens.
- `DEVELOPMENT_WORKFLOW.md` — feature, review, Git, and PR checklist.
