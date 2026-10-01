# Daily Journal — Design System

Version: 1.0  
Status: Approved baseline

---

## 1. Purpose

This document defines the visual language and interaction principles for Daily Journal.

It is the source of truth for:

- colours;
- typography;
- spacing;
- layout;
- cards and tiles;
- modals;
- interaction states;
- responsive behaviour;
- status presentation;
- data visualisation;
- visual consistency.

For product functionality and MVP scope, use `PRODUCT_SPEC.md`.

For current development status, use `PROJECT_STATUS.md`.

---

## 2. Design Direction

Daily Journal is a dark, desktop-first personal performance dashboard.

The design should feel:

- clean;
- modern;
- flat;
- technical;
- data-oriented;
- premium but restrained;
- calm;
- information-dense without feeling cluttered.

The closest conceptual reference is a combination of:

- Apple Health-style expandable summary cards;
- modern productivity dashboards;
- technical quantified-self interfaces.

The application should feel like a personal performance cockpit rather than a traditional long-form journal.

---

## 3. Core UX Principle

### Summary first. Detail on demand.

The main Today screen should primarily show compact summaries.

Detailed data entry should not permanently occupy dashboard space.

Typical interaction:

1. User sees a compact summary tile.
2. Tile shows the most important current values.
3. User clicks the tile.
4. A focused modal opens.
5. User enters or edits detailed information.
6. Modal closes.
7. Tile immediately reflects the updated summary.

Example:

Collapsed Morning card:

```text
Morning

Sleep        7h 18m
HRV          52
Energy       8
Motivation   7
```

Detailed fields appear only after opening the card.

This interaction model should be reused throughout the application where practical.

---

## 4. Theme

### Default

Dark mode is the default visual theme.

Light mode is not required for MVP.

Avoid pure black backgrounds and pure white surfaces.

Use layered dark surfaces to create hierarchy.

---

## 5. Colour System

Colours should remain restrained.

Most of the interface should consist of neutral dark surfaces, text, borders, and one interaction accent.

Semantic colours should indicate actual state rather than decorate sections.

### Recommended base tokens

```css
:root {
  /* Backgrounds */
  --color-bg: #0d1117;
  --color-surface: #151b23;
  --color-surface-elevated: #1b222c;
  --color-surface-hover: #202833;

  /* Borders */
  --color-border: #2a3441;
  --color-border-subtle: #222b35;

  /* Text */
  --color-text: #f0f3f6;
  --color-text-secondary: #a7b0bb;
  --color-text-muted: #737d89;
  --color-text-disabled: #555f6b;

  /* Interaction */
  --color-accent: #4d9cff;
  --color-accent-hover: #68aaff;

  /* Semantic state */
  --color-success: #58a96b;
  --color-warning: #d6a64c;
  --color-danger: #d66565;

  /* Focus */
  --color-focus: #70adff;
}
```

These values are the baseline, not immutable branding requirements.

If the core palette changes later, update the tokens here rather than introducing isolated colours throughout the application.

---

## 6. Colour Usage

### Neutral first

Most cards should use the same neutral surface.

Do not assign permanent colours to categories such as:

- Sleep = blue;
- Training = green;
- Food = orange;
- Learning = purple.

That creates unnecessary visual noise.

### Semantic colour

Use colour only when it communicates meaningful state.

Examples:

- green — completed / positive status;
- amber — incomplete / attention;
- red — error or destructive action;
- blue — selected, active, interactive.

Incomplete data should usually remain neutral or muted rather than warning-coloured.

---

## 7. Typography

Typography should feel technical and data-oriented.

Numbers, timestamps, percentages, and metrics should be visually clear.

Use the existing system font stack.

Do not add an external font dependency for MVP unless explicitly requested.

```css
--font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

If Inter is not installed locally, the system font fallback is acceptable.

### Suggested hierarchy

```css
--font-size-xs: 12px;
--font-size-sm: 13px;
--font-size-md: 15px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-2xl: 32px;
--font-size-display: 42px;
```

Use:

- large typography for today's date or major metrics;
- medium typography for card titles;
- small muted typography for labels and metadata;
- strong numerical hierarchy for metrics.

Avoid oversized marketing-style headings.

---

## 8. Numeric Data

Metrics are a major part of the product.

Numbers should usually be visually stronger than their labels.

Prefer:

```text
7h 18m
Sleep
```

over:

```text
Sleep duration: 7 hours 18 minutes
```

Similarly:

```text
82%
Daily progress
```

is preferable to verbose explanatory text.

Units should remain clearly visible but may use slightly lower contrast than the main number.

---

## 9. Spacing

Use a consistent spacing scale.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

Prefer whitespace over decorative separators.

The interface should be dense enough to expose useful information, but never cramped.

---

## 10. Main Layout

### Desktop-first

The primary interface is designed for desktop usage.

Main content should be centred and constrained to a practical maximum width.

```css
--content-max-width: 1280px;
```

Suggested page padding:

```css
--page-padding-desktop: 32px;
--page-padding-mobile: 16px;
```

The Today dashboard should typically display approximately:

- 3–4 compact cards per row;
- mixed card sizes where hierarchy requires it;
- larger cards for higher-priority information.

Do not force all cards to have identical dimensions.

---

## 11. Dashboard Hierarchy

The Today screen should prioritise information in approximately this order:

### 1. Date

Today's date is the primary page context.

### 2. Daily context

Future additions may include:

- weather;
- upcoming training;
- upcoming meetings.

These are post-MVP features, but the layout should not prevent them.

### 3. Priorities

Big 1–3 daily priorities should be prominent.

Priority #1 should receive stronger visual emphasis than #2 and #3.

### 4. Overall progress

The Today screen should include an overall daily completion indicator.

Example:

```text
64%
Daily progress
```

The indicator should remain restrained and informational.

Do not introduce:

- confetti;
- streak fireworks;
- achievement popups;
- gamification effects.

### 5. Journal summary cards

Examples:

- Morning;
- Work & Focus;
- Energy;
- Food & Coffee;
- Training;
- Learning;
- Personal Progress;
- Evening;
- Sleep Preparation.

---

## 12. Card / Tile System

Cards are the primary structural unit.

### Default card

```css
--radius-card: 14px;
--card-padding: 20px;
```

A standard card should use:

- neutral surface;
- subtle border;
- no strong shadow;
- consistent radius;
- clear title;
- compact data presentation;
- subtle hover state if interactive.

Example:

```text
┌─────────────────────────┐
│ Morning                 │
│                         │
│ 7h 18m       HRV 52     │
│ Sleep        Energy 8   │
│                         │
│ Complete                │
└─────────────────────────┘
```

Cards should communicate structure, not decoration.

---

## 13. Interactive Cards

Clickable cards should provide subtle interaction feedback.

Recommended behaviour:

- slightly lighter surface on hover;
- subtle border change;
- pointer cursor;
- visible keyboard focus;
- 150–200 ms transition.

Do not use large scale animations or exaggerated shadows.

---

## 14. Incomplete Cards

Incomplete state should be noticeable but quiet.

Example:

```text
Morning

Sleep       7h 18m
HRV         —
Energy      —
```

Possible indicators:

```text
2 missing
```

or a small hollow status marker.

Incomplete cards may use:

- muted text;
- slightly reduced emphasis;
- subtle status metadata.

Avoid:

- red card borders;
- strong warning backgrounds;
- large alert icons.

Incomplete does not mean error.

---

## 15. Completed State

Completed cards may use a restrained positive signal.

Examples:

- small green dot;
- muted `Complete` label;
- subtle progress state.

Do not recolour the entire card green.

---

## 16. Overall Progress

Daily progress represents how complete today's journal and planned activities are.

The exact calculation belongs to product logic, not this design document.

Visually, progress may be shown using:

- percentage;
- compact progress bar;
- subtle ring;
- combination of percentage and label.

Example:

```text
82%
Daily progress
████████░░
```

Use semantic colours sparingly.

Progress should be easy to read but should not dominate the entire interface.

---

## 17. Modals

Detailed journal entry should normally happen inside modals.

### Desktop

Recommended modal width:

```css
--modal-width: 640px;
--modal-width-large: 760px;
```

Modal should contain:

- clear title;
- optional contextual question;
- structured fields;
- clear close action;
- save behaviour where necessary.

Example:

```text
Morning Check-in

How did you sleep tonight?

Sleep duration       [ 7h 18m ]
Sleep score          [ 82     ]
HRV                  [ 52     ]

Energy
1 2 3 4 5 6 7 8 9 10

Motivation
1 2 3 4 5 6 7 8 9 10

                     Cancel   Save
```

Use a dark elevated surface over a restrained backdrop.

---

## 18. Modal Interaction

Opening and closing should use subtle transitions.

Recommended:

```css
--transition-fast: 150ms;
--transition-normal: 200ms;
```

Possible animation:

- slight fade;
- very small scale transition.

Avoid dramatic movement.

The user should remain visually anchored to the dashboard.

---

## 19. Mobile Modal Behaviour

If responsive implementation remains simple, desktop modals may become:

- wider sheets;
- nearly full-screen panels;
- full-screen modals.

Do not create a completely separate interaction architecture for mobile during MVP.

---

## 20. Navigation

Use simple top-level navigation.

Future structure:

```text
Today    History    Analytics    Settings
```

During MVP, only `Today` may be fully implemented.

Navigation should be:

- visually light;
- easy to scan;
- clearly indicate active section;
- secondary to the dashboard content.

Avoid large application sidebars unless a future requirement justifies one.

---

## 21. Form Controls

Daily Journal will use many compact structured controls.

Examples:

- time inputs;
- number inputs;
- checkboxes;
- segmented controls;
- dropdowns;
- 1–10 scales;
- completion toggles.

Controls should be:

- compact;
- clearly labelled;
- keyboard accessible;
- visually consistent;
- easy to click;
- suitable for repeated daily entry.

Recommended minimum practical control height:

```css
--control-height: 40px;
```

Recommended radius:

```css
--radius-control: 9px;
```

---

## 22. Rating Controls

Values such as:

- energy;
- motivation;
- mood;
- focus;
- productivity;
- satisfaction;
- stress;
- RPE;

should use efficient controls.

Avoid forcing the user to type numeric values when a direct selection is faster.

Possible pattern:

```text
Energy

1  2  3  4  5  6  7  [8]  9  10
```

The selected value should be clear without excessive colour.

---

## 23. Small Data Visualisations

Dashboard cards may show small data visualisations.

Appropriate examples:

- sparklines;
- compact progress bars;
- trend arrows;
- tiny comparison indicators;
- small rings;
- recent-value trends.

Example:

```text
HRV
52

╲_╱╲──╱
+6 vs 7d avg
```

Visualisations must communicate useful information.

Do not use charts as decoration.

For MVP, visualisation infrastructure should not be introduced before relevant historical data exists.

---

## 24. Weather, Meetings and Training Context

Future dashboard context may include:

```text
Thursday, 1 October

12°C · Cloudy

Intervals · 17:30

10:00 CTO Weekly
14:30 Vendor Review
```

These are post-MVP features.

Current design should allow such contextual information to be introduced later without redesigning the entire page.

Do not implement these features solely because they appear in this design document.

---

## 25. Responsive Strategy

### Principle

Desktop first, responsive where inexpensive.

Mobile support is desirable if it introduces modest additional complexity.

If a feature requires effectively maintaining a second UI implementation, defer the specialised mobile experience.

### Expected behaviour

On narrower screens:

- dashboard grid collapses naturally;
- 4 columns may become 2;
- 2 columns may become 1;
- cards stack;
- page padding reduces;
- typography scales moderately;
- modals may become nearly full-screen;
- controls remain touch-friendly.

Avoid horizontal scrolling for primary dashboard content.

---

## 26. Suggested Breakpoints

Use simple breakpoints rather than a complex responsive system.

Example:

```css
--breakpoint-tablet: 900px;
--breakpoint-mobile: 640px;
```

Exact values may be adjusted if implementation demonstrates a better breakpoint.

---

## 27. Motion

Motion should be functional and subtle.

Use for:

- card hover;
- modal open/close;
- focus;
- state changes;
- expand/collapse;
- progress changes.

Typical duration:

```css
150–200ms
```

Avoid:

- bouncing;
- large transformations;
- background animation;
- decorative motion;
- attention-seeking effects.

---

## 28. Borders and Shadows

Prefer:

- surface contrast;
- thin borders;
- spacing;

over shadows.

Recommended:

```css
--border-width: 1px;
```

Strong box shadows should generally not be used.

Elevated elements such as modals may use a very subtle shadow if needed.

---

## 29. Accessibility

The design must preserve usability.

Requirements:

- strong text contrast;
- visible keyboard focus;
- interactive elements must not rely on colour alone;
- reasonable font sizes;
- form fields must have clear labels;
- controls should remain usable without precise mouse movement;
- semantic HTML should be preferred where practical.

Do not remove focus outlines without providing an equivalent accessible focus state.

---

## 30. Empty States

Empty or not-yet-entered data should remain visually calm.

Prefer:

```text
HRV —
```

or:

```text
Not entered
```

over large empty-state illustrations or warnings.

The dashboard itself should naturally communicate what still needs input.

---

## 31. Visual Anti-Patterns

Avoid:

- previous infographic visual style;
- photography;
- motivational imagery;
- motivational quotes;
- decorative illustrations;
- colourful category cards;
- rainbow dashboards;
- gradients used as decoration;
- excessive rounded pills;
- large icons on every card;
- strong shadows;
- glassmorphism;
- neon colours;
- gaming UI;
- achievement systems;
- excessive badges;
- excessive animations;
- decorative charts;
- visually loud incomplete states.

---

## 32. CSS Design Tokens

Where practical, shared values should be represented by CSS custom properties.

Baseline:

```css
:root {
  /* Surfaces */
  --color-bg: #0d1117;
  --color-surface: #151b23;
  --color-surface-elevated: #1b222c;
  --color-surface-hover: #202833;

  /* Borders */
  --color-border: #2a3441;
  --color-border-subtle: #222b35;

  /* Text */
  --color-text: #f0f3f6;
  --color-text-secondary: #a7b0bb;
  --color-text-muted: #737d89;
  --color-text-disabled: #555f6b;

  /* Interaction */
  --color-accent: #4d9cff;
  --color-accent-hover: #68aaff;
  --color-focus: #70adff;

  /* Semantic */
  --color-success: #58a96b;
  --color-warning: #d6a64c;
  --color-danger: #d66565;

  /* Typography */
  --font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-md: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-size-display: 42px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Layout */
  --content-max-width: 1280px;
  --page-padding-desktop: 32px;
  --page-padding-mobile: 16px;

  /* Components */
  --radius-card: 14px;
  --radius-control: 9px;
  --card-padding: 20px;
  --control-height: 40px;

  /* Modal */
  --modal-width: 640px;
  --modal-width-large: 760px;

  /* Motion */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
}
```

These tokens should be reused rather than duplicating raw values throughout component CSS.

---

## 33. Implementation Rules

When implementing UI:

1. Use this document as the visual source of truth.
2. Prefer existing CSS variables over arbitrary values.
3. Do not add UI libraries solely for styling convenience.
4. Do not introduce new colours without a reason.
5. Do not create a new card design for every feature.
6. Reuse established interaction patterns.
7. Keep cards compact.
8. Keep detailed forms out of the dashboard where practical.
9. Prioritise data hierarchy over decoration.
10. Keep implementation understandable for a small React MVP.

If a visual requirement is unclear, prefer the simplest restrained solution consistent with this document.

---

## 34. Product Boundary

This design document may describe future interface elements such as:

- weather;
- meetings;
- training schedule;
- analytics;
- historical trends.

Their presence here does not move them into MVP scope.

`PRODUCT_SPEC.md` remains authoritative for product scope.

---

## 35. Design Principle Summary

Daily Journal should follow five core principles:

**Dark by default.**

**Data first.**

**Summary first, detail on demand.**

**Neutral surfaces, restrained status colour.**

**Dense enough to be useful, calm enough to use every day.**