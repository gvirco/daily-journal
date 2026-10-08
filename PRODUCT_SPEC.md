# Daily Journal — Product Specification

## Product goal

Daily Journal is a browser-based daily reflection and execution journal. It helps a person set priorities, work through the day in one notebook, and review the day without becoming a detailed quantified-self tracker.

## MVP scope

The original MVP was browser-based and local-first, with one journal entry per local calendar date (`YYYY-MM-DD`). The current implementation extends it with username/password accounts and an Express API backed by local SQLite. Cloud hosting and external integrations remain out of scope.

An entry may be partially completed and contains the following optional sections:

- Morning;
- Daily Goals;
- Daily Notebook;
- Evening Review.

## Multi-user extension (implemented)

- A user can register with a unique username and password, log in, log out, and restore an existing session after refresh.
- Journal API requests require authentication; entries are private to the authenticated user.
- Each user has at most one entry for each local date. Different users can use the same date independently.
- Entries are saved in a local SQLite database that survives browser and application restarts while the database file is retained.
- Existing browser `localStorage` entries are not automatically migrated and are not used as an API fallback.

## Date navigation

The user can open today's journal, move to the previous or next date (including future dates), return to today, and edit the entry for any selected date. Each date retains an independent entry for the signed-in user.

## Morning

Morning records subjective 1–10 ratings for Energy, Mood, and Focus.

## Daily Goals

The user can define one to three ordered daily goals. A goal has text and a completed state. Goal #1 is the primary goal and should receive stronger visual emphasis. Completion is represented only by that state.

## Daily Notebook

Each entry has one optional free-form `notes` field. It is the main working area during the day. The notebook has no categories, tags, blocks, rich-text structure, or separate activity logs.

## Evening Review

Evening Review records a 1–10 Day rating plus responses to:

- What worked?
- What didn't?
- What did I learn?

## Persistence and data transfer

Changes autosave without a manual Save button through the authenticated API to SQLite. Entries remain available after browser refresh and API restart. The database is local to the computer; cloud sync and automatic backups are not implemented.

The original MVP also requires the following data-transfer features, which remain planned:

- export of all saved entries as JSON;
- export of all saved entries as CSV;
- import of previously exported JSON.

## Non-goals

MVP 1.0 does not include:

- detailed sleep or recovery metrics;
- food, coffee, training, detailed work tracking, or activity logs;
- energy tracking beyond Morning Energy;
- separate learning, personal-progress, or sleep-preparation sections;
- cloud hosting, cloud storage, third-party identity providers, or external integrations;
- analytics, graphs, correlations, reminders, notifications, social features, or a native mobile application.

## MVP acceptance criteria

MVP 1.0 is complete when:

1. The application opens today's journal and supports date navigation.
2. The user can record Morning Energy, Mood, and Focus ratings.
3. The user can create, order, and complete up to three daily goals.
4. The user can write one free-form Daily Notebook entry.
5. The user can complete Evening Review, including its rating and three reflection prompts.
6. Authenticated entries autosave to SQLite, remain available after refresh and backend restart, and are separate for each user and date.
7. All journal data can be exported as JSON and CSV, and imported from JSON.
8. The application is usable on desktop and mobile screens.
9. Users can register, log in, restore sessions, and log out; journal entries are inaccessible to other users.

The multi-user extension is explicitly in scope. Export/import remain outstanding acceptance criteria, not implemented functionality.
