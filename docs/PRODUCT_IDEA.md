# Product idea

Daily Journal is an individual, browser-based journal for planning and reflecting on one calendar day at a time. It keeps the daily practice small: a morning check-in, up to three priorities, one notebook, and an evening review.

The product is for a person who wants a simple place to decide what matters today and record a short reflection later. It is not a quantified-self tracker, a task-management system, or a social product.

## Current experience

After signing in with email and password, a person can open today or navigate to any previous or future local calendar date. Each date has one private journal entry for that signed-in person. The entry can contain:

- Morning Energy, Mood, and Focus ratings from 1 to 10.
- Up to three ordered priorities, each with a completion state.
- One free-form Daily Notebook note.
- An Evening Review with a 1–10 day rating and three reflection prompts.

Changes autosave to Supabase. The dashboard shows a concise summary and opens the Morning, Notebook, and Evening areas in dialogs. Authentication, entries, and persistence are implemented; JSON/CSV export and JSON import are not.

## Boundaries

The current product does not provide analytics, graphs, reminders, tags, rich text, activity tracking, third-party identity providers, social features, or a native mobile app. Existing legacy browser storage is preserved but is neither migrated nor used by the current UI.

See [MVP priorities and acceptance criteria](MVP.md) for delivery scope and [current architecture](ARCHITECTURE.md) for implementation details.
