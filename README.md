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

```bash
npm run lint
npm run build
npm run test:db
```

## Documentation

- `AGENTS.md` — coding-agent contract and architecture constraints.
- `PRODUCT_SPEC.md` — MVP product scope and acceptance criteria.
- `DESIGN_SYSTEM.md` — durable UI guidance and canonical tokens.
- `DEVELOPMENT_WORKFLOW.md` — feature, review, Git, and PR checklist.
