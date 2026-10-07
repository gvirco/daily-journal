# Daily Journal — Product Specification

## Product goal

Daily Journal is a local-first daily reflection and execution journal. It helps a person set priorities, work through the day in one notebook, and review the day without becoming a detailed quantified-self tracker.

## MVP scope

MVP 1.0 is a browser-based application with one journal entry for each local calendar date, represented as `YYYY-MM-DD`. It has no user accounts, backend services, cloud database, Google authentication, or external integrations.

An entry may be partially completed and contains the following optional sections:

- Morning;
- Daily Goals;
- Daily Notebook;
- Evening Review.

## Date navigation

The user can open today's journal, move to the previous or next date (including future dates), return to today, and edit the entry for any selected date. Each date retains an independent entry.

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

Changes autosave without a manual Save button. Journal data persists locally in the browser and remains available after refresh.

MVP must support:

- export of all saved entries as JSON;
- export of all saved entries as CSV;
- import of previously exported JSON.

## Non-goals

MVP 1.0 does not include:

- detailed sleep or recovery metrics;
- food, coffee, training, detailed work tracking, or activity logs;
- energy tracking beyond Morning Energy;
- separate learning, personal-progress, or sleep-preparation sections;
- authentication, backend services, cloud storage, or external integrations;
- analytics, graphs, correlations, reminders, notifications, social features, or a native mobile application.

## MVP acceptance criteria

MVP 1.0 is complete when:

1. The application opens today's journal and supports date navigation.
2. The user can record Morning Energy, Mood, and Focus ratings.
3. The user can create, order, and complete up to three daily goals.
4. The user can write one free-form Daily Notebook entry.
5. The user can complete Evening Review, including its rating and three reflection prompts.
6. Entries autosave locally, remain available after refresh, and are separate for each date.
7. All journal data can be exported as JSON and CSV, and imported from JSON.
8. The application is usable on desktop and mobile screens.

Anything beyond these criteria is outside MVP 1.0.
