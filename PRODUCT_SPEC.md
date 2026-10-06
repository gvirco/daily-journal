# Daily Journal — Product Specification

Version: MVP 1.0
Status: Draft

## 1. Product Goal

Daily Journal is a local-first daily reflection and execution journal.

Each calendar day has one journal entry. The journal supports three simple
moments:

1. Start the day by recording how you feel and defining priorities.
2. Use one free-form notebook during the day.
3. Review the day in the evening.

The product should remain lightweight enough to use every day without becoming
a detailed quantified-self tracker.

---

## 2. MVP Scope

MVP 1.0 is a browser-based application. It has no user accounts, backend
services, cloud database, Google authentication, or external integrations.

Journal data is stored locally in the browser. The application must preserve
entries after refresh, autosave normal changes, and support data export and
import.

---

## 3. Daily Journal Entry

Each journal entry belongs to one local calendar date, represented as
`YYYY-MM-DD`.

The user must be able to:

- open today's journal;
- navigate to the previous day;
- navigate to the next day, including future dates;
- return to today;
- edit entries for any selected date.

An entry may be partially completed. It contains the following optional
sections: Morning, Goals, Daily notebook, and Evening review.

---

## 4. Morning

The Morning section records three subjective ratings from 1 to 10:

- Energy;
- Mood;
- Focus.

The user can define one to three ordered goals for the day. Each goal contains:

- text;
- completed state.

Goal #1 is the primary goal and should receive stronger emphasis in the future
UI. Goal completion is represented only by each goal's completed state.

---

## 5. Daily Notebook

Each journal entry has one optional free-form `notes` field. It is the main
working area during the day.

The notebook does not include categories, tags, blocks, rich-text structure,
or separate activity logs.

---

## 6. Evening Review

The Evening review records:

- Day rating from 1 to 10;
- What worked;
- What didn't;
- What did I learn.

---

## 7. Persistence

MVP 1.0 uses browser-side persistent storage, initially `localStorage`.

Each day's journal is stored independently by its calendar date. UI components
must not access `localStorage` directly; persistence must be accessed through a
dedicated journal storage or service layer so it can be replaced or supplemented
later.

---

## 8. Export and Backup

MVP 1.0 must support:

- export of all journal data as JSON;
- export of journal data as CSV;
- import of previously exported JSON.

Exported data must include all saved journal entries.

---

## 9. User Experience

The application must:

- autosave normal changes without a manual Save button;
- be usable on desktop and mobile screens;
- use simple, fast controls for ratings and goal completion;
- keep free-form writing optional.

---

## 10. Explicit Non-Goals for MVP 1.0

Do not implement yet:

- detailed sleep or recovery metrics;
- food, coffee, training, detailed work tracking, or activity logs;
- energy tracking beyond Morning Energy;
- separate learning, personal progress, or sleep preparation sections;
- authentication, backend services, cloud storage, or external integrations;
- analytics, graphs, correlations, reminders, notifications, social features,
  or a native mobile application.

---

## 11. MVP Acceptance Criteria

MVP 1.0 is complete when:

1. The application opens today's journal entry and can navigate between dates.
2. The user can record Morning Energy, Mood, and Focus ratings.
3. The user can create, order, and complete up to three daily goals.
4. The user can write one free-form daily notebook entry.
5. The user can complete the Evening review, including its day rating and three
   reflection prompts.
6. Entries are automatically persisted locally and remain available after
   refresh.
7. Different dates retain separate journal entries.
8. All journal data can be exported as JSON and CSV, and imported from JSON.
9. The application is usable on desktop and mobile screens.

Anything beyond these criteria is not required for MVP 1.0.
