# Daily Journal — Design System

## Direction

Daily Journal is dark, restrained, and data-first. It should feel calm and practical: dense enough for daily use without looking cluttered. Use neutral layered surfaces and reserve colour for interaction and meaningful state.

The core interaction principle is **summary first, detail on demand**. The dashboard presents concise state; focused forms open only when the user needs to edit details.

## Dashboard hierarchy

Prioritize the current dashboard in this order:

1. Selected date and date navigation.
2. **Daily Notebook** — primary working area.
3. **Daily Goals** — secondary working area; goal #1 receives stronger emphasis.
4. **Morning** and **Evening Review** — compact summary cards that open focused detail.

Do not introduce dashboard areas or visual emphasis for future product ideas unless they become part of the product scope.

## Layout and cards

- Constrain the main content to a practical maximum width and use responsive page padding.
- Use cards to establish structure, not decoration: neutral surface, subtle border, consistent radius, clear heading, compact content, and no heavy shadow.
- Allow card sizes to reflect hierarchy; do not force every card to be identical.
- Use whitespace rather than ornamental separators.
- Interactive cards use a quiet hover surface/border change, pointer cursor, and clear keyboard focus.
- Incomplete data is muted and neutral, not an error state. Completed content may use a small, restrained positive cue; do not recolour an entire card green.

## Colour and state

Use neutral surfaces, borders, and text for most of the interface. The accent colour identifies selected, active, and interactive elements; semantic colours communicate actual status only.

- Blue is for selected or interactive state.
- Green is for restrained completion or positive confirmation.
- Amber is for genuine attention states, not ordinary missing data.
- Red is for errors and destructive actions.
- Do not assign permanent colours to sections or journal categories.

Avoid pure black backgrounds and pure white surfaces. Dark surface layers, borders, and text contrast should establish hierarchy before colour does.

## Date context and navigation

The selected date is the primary page context. Keep previous, today, and next actions simple, close to the date, and visually lighter than the journal content. The disabled Today action should still be legible without competing with active controls.

## Component consistency

- Reuse the same card, button, form, focus, and modal patterns across the dashboard.
- Prefer small status labels, values, and previews over explanatory paragraphs.
- Keep destructive or clearing actions visibly secondary and clearly labelled.
- Do not introduce a new component treatment merely to distinguish a journal section.
- When a detail is not essential to the dashboard, show it in the focused editing surface instead.

## Content density

Keep dashboard copy brief and action-oriented. Prefer a meaningful value, status, or short preview to repeated instructional text.

- Use an em dash or quiet empty-state text for missing optional values.
- Keep headings specific to the journal section or current task.
- Present related values in a consistent order.
- Do not fill empty space with decorative UI or speculative future metrics.

## Typography

Use the system font stack in the canonical tokens below. Keep labels concise and secondary. Make values and useful data more prominent than their labels when the interface presents metrics.

- Use display and large sizes sparingly for the selected date or key context.
- Use medium sizes for card titles and controls.
- Use small, muted type for labels and supporting metadata.
- Avoid oversized marketing headings and external font dependencies.

## Forms and rating controls

- Keep controls compact, clearly labelled, keyboard accessible, and easy to tap.
- Use direct 1–10 choices for ratings rather than asking the user to type a number.
- Make selected and pressed states unambiguous without excessive colour.
- Use visible focus styles and practical control height.
- Preserve a clear distinction between a blank optional field and an error.

## Modals

Use a modal for focused Morning, Notebook, and Evening editing when it keeps the dashboard concise.

- Use a dark elevated surface over a restrained backdrop.
- Include a clear title, clear close action, and only the fields relevant to the task.
- Keep the user visually anchored to the dashboard with a short fade or very small scale transition.
- On small screens, the same modal may widen into a near-full-screen or full-screen panel; do not create a separate mobile interaction architecture.

## Empty and completed states

- Empty states should say what is absent in plain, quiet language and invite the next action where useful.
- Do not use warning colours, alert styling, or large icons for ordinary incomplete journal data.
- Completed states should be readable at a glance but remain secondary to the data itself.

## Responsive approach

Design desktop-first while keeping the journal fully usable on small screens.

- Reduce page padding on mobile.
- Let dashboard content stack or reflow rather than compressing controls beyond usability.
- Keep touch targets practical and preserve readable text.
- Prefer adapting the same components over creating parallel mobile-only UI.

## Motion and accessibility

- Motion is subtle and brief: use the transition tokens below, and avoid dramatic movement, scale effects, or celebratory animation.
- Support keyboard operation, visible focus, semantic labels, and sufficient text contrast.
- Use colour as a supplement to text or state, never as the only signal.
- Respect `prefers-reduced-motion` when motion is added.

## Implementation decisions

- Use the tokens in this document rather than introducing one-off colours, spacing, radii, or transition durations.
- Prefer semantic HTML controls for interactive elements; do not simulate buttons or form controls with non-interactive elements.
- Keep labels associated with their inputs and give icon-only controls accessible names.
- Ensure a modal identifies itself, has an accessible title, and exposes a clear close action.
- Preserve visible focus after hover, active, disabled, and completed states are styled.
- Keep preview text short and safely truncatable; full journal content belongs in the editing surface.
- If a visual requirement is unclear, choose the simplest restrained treatment consistent with this document.

## Visual anti-patterns

Avoid:

- pure black backgrounds or pure white surfaces;
- permanent colours for journal categories;
- gradients, glass effects, neon accents, heavy shadows, or decorative charts;
- large sidebars, marketing-style hero headings, or dense prose inside cards;
- red warning treatment for incomplete entries;
- confetti, streak fireworks, achievement popups, or other gamification effects;
- a unique card or interaction pattern for every feature.

## Canonical CSS tokens

Use these tokens as the single reference for UI values. Update this section and the implementation together if the baseline changes; do not introduce isolated visual values.

```css
:root {
  /* Surfaces */
  --color-bg: #0d1117;
  --color-surface: #151b23;
  --color-surface-elevated: #1b222c;
  --color-surface-hover: #202833;

  /* Borders and text */
  --color-border: #2a3441;
  --color-border-subtle: #222b35;
  --border-width: 1px;
  --color-text: #f0f3f6;
  --color-text-secondary: #a7b0bb;
  --color-text-muted: #737d89;
  --color-text-disabled: #555f6b;

  /* Interaction and semantic state */
  --color-accent: #4d9cff;
  --color-accent-hover: #68aaff;
  --color-focus: #70adff;
  --color-success: #58a96b;
  --color-warning: #d6a64c;
  --color-danger: #d66565;

  /* Typography */
  --font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-md: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-size-display: 42px;

  /* Spacing and layout */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --content-max-width: 1280px;
  --page-padding-desktop: 32px;
  --page-padding-mobile: 16px;

  /* Components, modal, and motion */
  --radius-card: 14px;
  --radius-control: 9px;
  --card-padding: 20px;
  --control-height: 40px;
  --modal-width: 640px;
  --modal-width-large: 760px;
  --transition-fast: 150ms;
  --transition-normal: 200ms;
}
```
