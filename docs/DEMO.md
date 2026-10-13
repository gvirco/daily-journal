# 3–5 minute assessment demonstration

This is an individual project demonstration. Use a disposable account and a prepared test entry; do not show passwords, browser storage, session tokens, or Supabase secrets.

## 0:00–0:30 — purpose and scope

Open the application and explain: “Daily Journal is a small individual planning and reflection tool. It keeps one private entry per local date, with Morning ratings, three priorities, a notebook, and an Evening Review. Export/import is deliberately P1 future scope.”

## 0:30–1:10 — authentication and navigation

Register or sign in with a disposable account. Show the signed-in identity, previous/next/today controls, and one future date. Explain that Supabase Auth restores sessions after refresh and the selected local date identifies the journal entry.

## 1:10–2:15 — CRUD and autosave

Create or edit a Morning rating, priority, notebook text, and Evening Review. Point out the Saving then Saved state. Navigate away and back to show the entry reloads. Edit a priority, then use **Delete entry**, show the confirmation, cancel once, then confirm. Show that only the selected date becomes empty.

## 2:15–3:00 — data model and security

Show [DATA_MODEL.md](DATA_MODEL.md): `journal_entries` uses `(user_id, entry_date)` as its primary key, JSONB content, an update timestamp, and an ER diagram. Explain that the frontend uses only the publishable configuration, while Supabase RLS permits each authenticated user to operate only on rows where `auth.uid() = user_id`.

## 3:00–3:40 — architecture and quality

Show [ARCHITECTURE.md](ARCHITECTURE.md) and explain the static Vite/React frontend, `journalApi.ts` service boundary, Supabase Auth/PostgreSQL, Vercel deployment, debounced ordered autosave, and deletion race protection. Run `npm run test`, then mention the mocked test coverage and clearly distinguish it from the live RLS procedure.

## 3:40–4:30 — assessment evidence

Show [TEST_REPORT.md](TEST_REPORT.md). State which checks passed automatically and which remain PENDING until demonstrated live. If time permits, use two disposable accounts to run [SECURITY_VERIFICATION.md](SECURITY_VERIFICATION.md) and show Account B cannot read or change Account A's entry.

## Architecture decisions to explain if asked

- Supabase provides authentication, PostgreSQL persistence, and RLS without a custom server or frontend secrets.
- `journalApi.ts` is the sole UI data boundary; legacy local storage is preserved but not used as a fallback.
- A composite key prevents duplicate entries for the same user/date.
- JSONB stores the deliberately small, evolving journal entry as one document.
- Per-date save queues, revisions, and deletion blocking prevent an older client write from recreating a deleted entry.
