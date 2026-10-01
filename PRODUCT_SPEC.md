# Daily Journal — Product Specification

Version: MVP 1.0
Status: Draft

## 1. Product Goal

Daily Journal is a local-first personal performance journal.

Each calendar day represents one journal entry.

The application should allow the user to quickly record structured information about:

- sleep and recovery;
- energy and motivation;
- daily priorities;
- work and focus;
- food and caffeine;
- training;
- learning;
- personal progress;
- evening performance and reflection.

The long-term purpose is to build a structured historical dataset that can later be analysed to understand which behaviours and conditions improve or reduce energy, productivity, motivation, recovery, and overall performance.

The journal must remain quick enough to use every day.

Target usage time:

- Morning check-in: <= 2 minutes
- Evening check-out: <= 3–5 minutes


---

## 2. Core Product Principle

Collect enough structured data to learn from it,
but never so much that journaling becomes a burden.


---

## 3. MVP Scope

MVP 1.0 is a browser-based application.

It does not require:

- user accounts;
- backend services;
- cloud database;
- Google authentication;
- Garmin integration;
- Google Sheets integration.

All data is stored locally in the browser.

The application must work after page refresh and must allow the user to export their data.


---

# 4. Daily Journal Entry

Each calendar date has one Daily Journal Entry.

The user must be able to:

- open today's journal;
- navigate to the previous day;
- navigate to the next day;
- return to today;
- edit historical journal entries.


---

# 5. Morning Check-in

Fields:

- Wake-up time
- Sleep duration
- Garmin Sleep Score
- HRV
- Morning Energy: 1–10
- Motivation: 1–10
- Mood: 1–10
- Subjective Sleep Quality: 1–10
- Optional morning note

Future optional metrics such as Resting HR, Body Battery and Training Readiness are intentionally excluded from MVP 1.0.


---

# 6. Today's Big 3

The user can define up to three important outcomes for the day.

Fields for each goal:

- Description
- Category
- Completed

Categories:

- Work
- Finance
- Family
- House
- FC Owner
- Learning
- Other

Goal #1 must be visually more prominent than goals #2 and #3.


---

# 7. Work & Focus

Fields:

- Work start time
- First deep-work start time
- Work finish time
- Deep work minutes
- Focus: 1–10
- Productivity: 1–10
- Prime time wasted:
  - No
  - Slightly
  - Yes
- Optional comment


---

# 8. Energy Tracking

The user records energy at three points:

- Morning Energy: 1–10
- Afternoon Energy: 1–10
- Evening Energy: 1–10

Morning Energy may reuse the value entered in Morning Check-in.


---

# 9. Food

Daily food tracking is intentionally lightweight.

## Breakfast

- Time
- Meal
- Quality:
  - Good
  - OK
  - Poor

## Main Meal

- Time
- Meal
- Quality:
  - Good
  - OK
  - Poor

## Dinner

- Time
- Meal
- Quality:
  - Good
  - OK
  - Poor

Additional field:

Junk / sweets / overeating:

- No
- Some
- Yes


---

# 10. Coffee

Fields:

- Coffee #1 time
- Coffee #2 time
- Coffee #3 time

All fields are optional.


---

# 11. Training

Fields:

- Trained today: Yes / No
- Start time
- Training type
- Duration in minutes
- Distance in kilometres — optional
- RPE: 1–10
- Training feeling: 1–10
- Optional note

Training types:

- Easy Run
- Intervals
- Tempo
- Long Run
- Strength
- Run + Strength
- Other


---

# 12. Learning

Fields:

- Learning today: Yes / No
- Start time
- End time
- Focus: 1–10
- Energy: 1–10

The initial use case is AI training, but the module must remain generic.


---

# 13. Personal Progress

Fields:

- Completed: Yes / No
- Category
- Minutes
- What moved forward?

Categories:

- Finance
- FC Owner
- House
- Family
- Learning
- Other


---

# 14. Evening Check-out

Fields:

- Evening Energy: 1–10
- Productivity: 1–10
- Satisfaction with day: 1–10
- Stress: 1–10

Checklist:

- Daily Shutdown completed
- Gmail controlled
- Asana controlled
- Tomorrow's #1 selected

Optional reflections:

- What helped most today?
- What hurt performance most today?


---

# 15. Sleep Preparation

Fields:

- Went to bed
- Lights out
- Worked after 22:00: Yes / No
- Screens before sleep: Yes / No
- Optional note


---

# 16. Persistence

MVP 1.0 must use browser-side persistent storage.

Initial implementation:

localStorage

Each day's journal must be stored independently using its calendar date.

Conceptual structure:

DailyJournalEntry
├── date
├── morning
├── goals
├── work
├── energy
├── food
├── coffee
├── training
├── learning
├── personalProgress
├── evening
└── sleepPreparation

UI components must not directly contain persistence logic.

Persistence must be accessed through a dedicated journal storage/service layer.

This allows localStorage to be replaced or supplemented later without rewriting the UI.


---

# 17. Export & Backup

MVP 1.0 must support:

- Export all journal data as JSON
- Export journal data as CSV
- Import previously exported JSON

Exported data must contain all saved journal entries.


---

# 18. User Experience

The application must:

- autosave changes;
- avoid requiring a manual Save button for normal usage;
- be usable on desktop;
- be usable on mobile;
- use fast controls such as:
  - sliders or rating buttons;
  - checkboxes;
  - segmented buttons;
  - time inputs;
  - dropdowns.

Long free-text fields should remain optional.


---

# 19. Visual Direction

Style:

Premium executive + endurance sport.

Design characteristics:

- clean;
- light;
- spacious;
- modern;
- strong typography;
- rounded cards;
- navy / blue primary colour;
- subtle green / orange / purple accents;
- minimal visual noise.

The application should feel like a personal performance dashboard rather than a medical or habit-tracking application.


---

# 20. Explicit Non-Goals for MVP 1.0

Do NOT implement yet:

- authentication;
- backend;
- cloud database;
- Google Sheets sync;
- Garmin API;
- analytics dashboard;
- AI analysis;
- graphs and correlations;
- reminders / notifications;
- multi-user support;
- social features;
- native mobile application.

These may be considered in later versions.


---

# 21. Future Roadmap

## MVP 1.1 — Usability

- improve mobile UX;
- streamline frequently used fields;
- refine Daily Score;
- improve visual design.

## MVP 1.2 — History

- calendar view;
- journal completion indicators;
- history browsing;
- basic weekly summaries.

## MVP 1.3 — Cloud Sync

Preferred experiment:

Google Sheets synchronization.

Conceptual architecture:

App
↓
Journal Service
├── Local Storage
└── Google Sheets Sync

Local storage should remain usable even if cloud synchronization fails.


## MVP 2.0 — Analytics

Potential analysis:

- Sleep vs Productivity
- Sleep vs HRV
- HRV vs Energy
- Training vs next-day Energy
- Morning running vs Focus
- Late coffee vs Sleep
- Late work vs Sleep
- Food quality vs Energy
- Weekly sleep accumulation vs Thursday/Friday performance
- Personal Progress vs Daily Satisfaction


---

# 22. MVP Acceptance Criteria

MVP 1.0 is complete when:

1. The application opens today's journal entry.
2. Previous and next days can be opened.
3. Morning Check-in can be completed.
4. Up to three daily goals can be entered and completed.
5. Work and Focus information can be recorded.
6. Energy can be recorded for morning, afternoon and evening.
7. Food and coffee can be recorded.
8. Training can be recorded.
9. Learning can be recorded.
10. Personal Progress can be recorded.
11. Evening Check-out can be completed.
12. Sleep Preparation can be recorded.
13. All changes are automatically persisted locally.
14. Page refresh does not lose data.
15. Different dates retain different data.
16. All journal data can be exported as JSON.
17. Data can be exported as CSV.
18. Previously exported JSON can be imported.
19. Application works on desktop.
20. Application is practically usable on a mobile screen.

Anything beyond these criteria is NOT required for MVP 1.0.