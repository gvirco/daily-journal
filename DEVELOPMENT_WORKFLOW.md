# Daily Journal — Development Workflow

Version: 1.0

## 1. Purpose

This document describes the standard workflow for developing Daily Journal.

The objective is to use AI-assisted development in a disciplined way:

- ChatGPT helps define the feature.
- Codex implements the agreed feature.
- I inspect, test, review, commit, and merge the work.
- The repository remains the source of truth.
- Each development iteration stays small and independently reviewable.

The default principle is:

**discuss → define → implement → inspect → verify → commit → PR → merge → clean up**

---

# 2. Source-of-Truth Documents

Before starting meaningful development, the following documents should be current:

- `PRODUCT_SPEC.md` — product requirements and MVP scope.
- `DESIGN_SYSTEM.md` — visual language and interaction principles.
- `PROJECT_STATUS.md` — current development state and next work.
- `AGENTS.md` — instructions for AI coding agents.
- `README.md` — project overview.
- `DEVELOPMENT_WORKFLOW.md` — development methodology.

The repository documentation is authoritative.

Chat history should not be treated as the long-term source of truth.

---

# 3. Chat Strategy

## One meaningful iteration = one ChatGPT chat

Start a new chat for each coherent feature or development iteration.

Examples:

- Iteration 3 — Date Navigation
- Iteration 4 — Journal Data Model
- Iteration 5 — Local Persistence
- Iteration 6 — Morning Check-in
- Iteration 7 — Big 3 Priorities

Do not create a new chat for every tiny CSS adjustment or bug fix.

A new chat is appropriate when the work has:

- a distinct objective;
- its own acceptance criteria;
- its own feature branch;
- its own Pull Request.

---

# 4. Starting a New Feature Chat

Start each feature chat with:

```text
We are continuing development of my Daily Journal application.

This chat is dedicated to:

ITERATION X — [FEATURE NAME]

Before proposing implementation, establish the current project state from:

- AGENTS.md
- PRODUCT_SPEC.md
- DESIGN_SYSTEM.md
- PROJECT_STATUS.md
- README.md
- DEVELOPMENT_WORKFLOW.md

Treat these repository documents as the source of truth.

Do not start implementation immediately.

First:

1. summarize only the project state relevant to this feature;
2. define exactly what this iteration should accomplish;
3. identify important UX / architecture decisions;
4. define explicit acceptance criteria;
5. identify what is out of scope;
6. propose the smallest sensible implementation plan.

Keep the iteration deliberately small and avoid implementing future functionality.

When the feature is sufficiently defined, prepare a Codex implementation prompt that is concise and optimized for this repository:

- do not repeat standing rules already covered by the repository documents;
- include only feature-specific requirements, decisions, acceptance criteria, important constraints, and out-of-scope items;
- reference the repository documents instead of reproducing their contents;
- avoid verbose explanations intended for me rather than Codex;
- do not add boilerplate unless it materially reduces implementation risk;
- prefer the shortest prompt that still makes the requested implementation unambiguous.

The Codex prompt should normally contain:

- documents to read;
- iteration objective;
- feature-specific requirements;
- feature-specific architecture/UX decisions;
- acceptance criteria;
- important out-of-scope items;
- unusual restrictions, if any;
- verification commands;
- instruction not to commit.

For a small feature, aim for roughly 300–700 words. Use a longer prompt only when the feature genuinely requires more specification.
```

The feature should be fully understood before Codex receives an implementation task.

---

# 5. Feature Discovery

Use ChatGPT to think deeply about the feature before coding.

Discuss, when relevant:

- user goal;
- expected behaviour;
- UX;
- data model;
- state;
- error cases;
- empty states;
- architecture;
- visual behaviour;
- mobile behaviour;
- dependencies;
- future implications.

Ask questions until the behaviour is sufficiently clear.

Do not start coding simply because the general idea sounds obvious.

---

# 6. Define Scope

Before implementation, explicitly agree on:

## Goal

What should exist when the iteration is complete?

## Acceptance Criteria

Write observable criteria.

Example:

```text
- Previous button selects the previous calendar date.
- Next button selects the next calendar date.
- Today button returns to the current date.
- The displayed heading reflects the selected date.
- No journal persistence is implemented yet.
- No additional dependencies are installed.
- lint passes.
- build passes.
```

## Out of Scope

Explicitly state what should NOT be built.

This is important for preventing AI agents from implementing future features prematurely.

---

## 7. Confirm Documentation and Architecture Impact

Before coding, determine whether the feature changes:

- `PRODUCT_SPEC.md`
- `DESIGN_SYSTEM.md`
- existing architecture or technical conventions
- `AGENTS.md`

Examples of architecture-impacting changes:

- introducing a backend;
- changing persistence strategy;
- adding a database;
- introducing routing;
- adding a state-management library;
- changing the journal data model significantly;
- adding authentication;
- introducing a major external dependency;
- changing the application boundaries or service structure.

Usually these should be changed only if the underlying specification, design system, or architecture genuinely changes.

`PROJECT_STATUS.md` is normally updated after the implementation has been accepted.

---

# 8. Prepare Git

Always begin from an up-to-date clean `main`.

```bash
git switch main
git pull
git status
```

Expected:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Create a feature branch:

```bash
git switch -c feat/<feature-name>
```

Examples:

```bash
git switch -c feat/date-navigation
git switch -c feat/journal-model
git switch -c feat/morning-checkin
```

One meaningful iteration should normally correspond to one feature branch.

---

# 9. Create the Codex Implementation Prompt

After the feature has been defined in ChatGPT, ask ChatGPT to produce a precise Codex implementation prompt.

A good prompt should contain:

1. documents Codex must read;
2. exact implementation objective;
3. concrete requirements;
4. acceptance criteria;
5. architecture constraints;
6. explicit out-of-scope items;
7. files/documents Codex must not edit;
8. dependency restrictions;
9. verification commands;
10. instruction not to create a Git commit.

Typical opening:

```text
Read AGENTS.md, PRODUCT_SPEC.md, DESIGN_SYSTEM.md,
PROJECT_STATUS.md, and DEVELOPMENT_WORKFLOW.md before making changes.

Implement only Iteration X: [feature].
```

Typical ending:

```text
Do not create a Git commit.

When finished:

1. run npm run lint
2. run npm run build
3. run relevant tests if they exist
4. summarize:
   - files changed
   - implementation decisions
   - verification performed
   - any deviations or concerns
```

---

# 10. Let Codex Implement

Run Codex from the repository root.

Example:

```text
C:\Projects\daily-journal
```

Give Codex the complete implementation prompt.

During implementation:

- approve reasonable commands required for the requested work;
- do not blindly approve unrelated package installations;
- do not allow unnecessary scope expansion;
- pay attention if Codex reports architecture uncertainty.

Codex should implement the feature but should not commit it.

---

# 11. Inspect Codex's Result

Do not accept the implementation solely because Codex says it succeeded.

First:

```bash
git status
```

Then:

```bash
git diff --stat
```

Check whether the changed files make sense.

Then inspect the actual changes:

```bash
git diff
```

For a specific file:

```bash
git diff -- src/App.tsx
```

Questions to ask:

- Did Codex change only relevant files?
- Did it accidentally edit specifications?
- Did it install dependencies?
- Did it implement functionality outside the agreed scope?
- Is the implementation understandable?
- Does it respect the architecture?
- Does it use existing design tokens/components?
- Are there suspicious shortcuts or unnecessary complexity?

AI-generated code must be reviewed like code written by another developer.

---

# 12. Run Verification Personally

Even if Codex already ran verification, run the important checks myself.

At minimum:

```bash
npm run lint
npm run build
```

When tests exist:

```bash
npm test
```

or the repository's defined test command.

The basic quality gate becomes:

```text
lint
→ tests
→ build
```

All required checks should pass before committing.

---

# 13. Manual Functional Test

Start the local app:

```bash
npm run dev
```

Open the localhost URL.

Test every acceptance criterion manually.

Also test obvious boundary behaviour.

Examples:

- click all new controls;
- refresh the page;
- test keyboard interaction if relevant;
- resize the browser;
- verify dates;
- test empty states;
- confirm existing functionality still works.

Do not rely only on build success.

A production build proving compilation is different from proving correct behaviour.

---

# 14. Compare Against Acceptance Criteria

Before accepting the feature, review the original acceptance criteria one by one.

Every criterion should be:

```text
PASS
```

If something fails:

- do not commit;
- fix the implementation;
- rerun verification.

Avoid quietly changing acceptance criteria after implementation merely because the implementation differs.

---

# 15. Update PROJECT_STATUS.md

After the feature has been accepted locally:

Update `PROJECT_STATUS.md`.

Normally:

- mark the current iteration completed;
- mark relevant development-sequence items completed;
- define the next planned iteration;
- update any current-phase wording if needed.

Do not rewrite unrelated project history.

---

# 16. Final Diff Review

Run:

```bash
git status
git diff --stat
git diff
```

At this stage the diff should contain only:

- accepted feature code;
- intentional tests;
- necessary documentation updates;
- `PROJECT_STATUS.md`.

If unexpected files appear, investigate before committing.

---

# 17. Commit

Stage the accepted changes:

```bash
git add .
```

Check:

```bash
git status
```

Create one clear feature commit:

```bash
git commit -m "feat: <short description>"
```

Examples:

```bash
git commit -m "feat: add date navigation"
git commit -m "feat: add journal entry model"
git commit -m "feat: add morning check-in"
```

Check:

```bash
git status
```

Expected:

```text
nothing to commit, working tree clean
```

---

# 18. Push Feature Branch

Push:

```bash
git push -u origin feat/<feature-name>
```

Example:

```bash
git push -u origin feat/date-navigation
```

---

# 19. Create Pull Request

On GitHub create a Pull Request:

```text
base: main
compare: feat/<feature-name>
```

Use a clear title.

Example:

```text
Add date navigation
```

Recommended description:

```md
## Summary

- adds previous-date navigation
- adds next-date navigation
- adds Today action
- updates selected-date display
- updates project status

## Verification

- npm run lint
- npm run build
- npm test
- manual browser verification
```

Only list verification steps that were actually performed.

---

# 20. Review the Pull Request

Before merging, review:

## Conversation

Does the summary correctly describe the feature?

## Commits

Are the commits expected?

## Files Changed

Read the final PR diff.

Check again for:

- unexpected files;
- unnecessary changes;
- specification edits;
- package changes;
- unrelated refactoring.

## Checks

When CI is introduced, all automated checks must pass.

Do not merge a PR merely because GitHub says there are no merge conflicts.

---

# 21. Merge

For normal small feature iterations, use:

```text
Squash and merge
```

This keeps `main` history clean.

Use a concise final commit title:

```text
feat: add date navigation
```

Confirm the merge.

---

# 22. Delete Remote Feature Branch

After successful merge, use GitHub:

```text
Delete branch
```

The code is already in `main`.

Deleting the feature branch is normal cleanup.

---

# 23. Synchronize Local Main

Back in the terminal:

```bash
git switch main
git pull
git status
```

Expected:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

---

# 24. Delete Local Feature Branch

Try:

```bash
git branch -d feat/<feature-name>
```

If the PR was squash-merged, Git may say the branch is not fully merged because the commit hashes changed.

After verifying that the PR is merged and `main` is current, use:

```bash
git branch -D feat/<feature-name>
```

---

# 25. Optional Repository Cleanup Check

Run:

```bash
git fetch --prune
git branch -vv
git log --oneline --decorate --graph -10
```

Expected end state:

- currently on `main`;
- `main` matches `origin/main`;
- feature branch is gone;
- working tree is clean;
- merged feature appears in Git history.

---

# 26. Definition of Done

An iteration is complete only when:

- feature behaviour is defined;
- acceptance criteria are satisfied;
- Codex implementation has been reviewed;
- lint passes;
- tests pass where applicable;
- production build passes;
- manual verification passes;
- `PROJECT_STATUS.md` is current;
- changes are committed;
- feature branch is pushed;
- Pull Request is reviewed;
- PR is merged;
- remote feature branch is deleted;
- local `main` is synchronized;
- local feature branch is deleted;
- working tree is clean.

Only then begin the next iteration.

---

# 27. When to Ask ChatGPT for Help During Implementation

The default objective is to complete the implementation workflow independently.

Return to ChatGPT during an iteration when:

- requirements are ambiguous;
- an architecture decision has meaningful consequences;
- Codex proposes something I do not understand;
- verification fails and the reason is unclear;
- the diff contains suspicious or unexpected changes;
- I cannot judge whether an implementation is technically sound;
- scope needs to change.

Do not use ChatGPT merely to tell me the next Git command when the workflow is already documented here.

---

# 28. Guiding Principle

The repository should be able to explain the project to a fresh developer or AI session.

ChatGPT helps with reasoning.

Codex helps with implementation.

Git records the work.

GitHub provides review and integration.

Documentation preserves project knowledge.

The development process should remain understandable even if all previous chat history disappears.