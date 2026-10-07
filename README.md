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

## Run and verify

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run build
```

## Documentation

- `AGENTS.md` — coding-agent contract and architecture constraints.
- `PRODUCT_SPEC.md` — MVP product scope and acceptance criteria.
- `DESIGN_SYSTEM.md` — durable UI guidance and canonical tokens.
- `DEVELOPMENT_WORKFLOW.md` — feature, review, Git, and PR checklist.
