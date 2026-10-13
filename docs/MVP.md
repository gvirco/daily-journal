# MVP priorities and acceptance criteria

Daily Journal is an individual daily planning and reflection tool. The current priority is a reliable authenticated journal, not feature breadth.

## P0 — implemented scope

- Email/password registration, login, session restoration, and sign-out through Supabase Auth.
- One private entry per authenticated user and local calendar date.
- Date navigation, including previous, next, today, and future dates.
- Morning Energy, Mood, and Focus ratings from 1 to 10.
- Up to three ordered priorities with completion states.
- One free-form Daily Notebook field.
- Evening day rating and the three prompts: What worked?, What didn't?, and What did I learn?
- Debounced autosave to Supabase and reload of saved entries after navigation or refresh.
- Responsive React UI for the journal areas.

## P0 acceptance criteria

P0 is accepted when a signed-in user can:

1. Open today's journal and navigate between dates.
2. Enter and revisit each Morning rating.
3. enter, order, and complete up to three priorities.
4. Write and revisit one daily notebook entry.
5. complete the Evening Review rating and prompts.
6. see changes autosaved, survive a page refresh, and remain separate from another user's entries.
7. register, log in, restore a session, and log out, while database row-level security prevents access to another user's entries.
8. use the journal at desktop and mobile viewport sizes.

## P1 — future scope

The following data-transfer features are intentionally not implemented:

- Export all saved entries as JSON.
- Export all saved entries as CSV.
- Import a previously exported JSON file.

P1 acceptance requires these operations to apply only to the signed-in user's data and preserve the current entry model. No import/export behavior should be inferred from the current code.

## Out of scope

Detailed sleep, food, coffee, training, work, or activity logs; tags and rich text; analytics and correlations; reminders and notifications; social features; third-party integrations; and a native mobile app are outside the current scope.
