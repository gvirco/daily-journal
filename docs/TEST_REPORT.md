# Test report

Verification recorded: **2026-10-13**

## Automated command results

The following automated results were recorded for Issue #12:

```text
npm ci                 PASS (0 vulnerabilities)
npm run lint           PASS
npm run build          PASS
npm run test           PASS (8/8 tests)
```

The automated suite uses Vitest, jsdom, React Testing Library, and mocked `journalApi`/Supabase calls. It does not use production credentials, create real accounts, or contact the deployed application.

## User-reported manual verification

The following results were reported by the user. They were not independently repeated or supported by additional evidence in this documentation update.

| Verification | Result | Scope reported |
| --- | --- | --- |
| Manual browser verification | PASS | All 6 scenarios |
| Supabase RLS verification | PASS | All 6 scenarios |

The RLS result is live-service, user-reported verification; it is distinct from the mocked automated tests above. The supplied results do not include a scenario-by-scenario mapping, environment details, or captured output.

## Screenshot inventory

`docs/screenshots/` currently contains [README.md](screenshots/README.md) only. No screenshot image files are available to reference.

## Automated coverage

| Area | Result | Evidence |
| --- | --- | --- |
| Signed-out session handling | PASS | `getCurrentUser()` returns `null` for a null mocked session. |
| Authentication service errors | PASS | Registration/login surface mocked API errors as `ApiError`. |
| Journal read and update | PASS | Load and upsert include authenticated `user_id`, `entry_date`, and conflict key. |
| Journal deletion | PASS | Delete scopes both authenticated `user_id` and selected `entry_date`. |
| Session-change protection | PASS | Save/delete reject before writing when the expected and active users differ. |
| Pending autosave then deletion | PASS | UI test confirms the queued save occurs before deletion and the selected day becomes empty. |
| Failed deletion | PASS | UI test confirms the entry remains visible and an error is shown. |
| Input validation markup | PASS | Registration email/password fields use native `type=email`, `required`, and minimum-length attributes. |

## Lecturer assessment checklist — 19 items

This checklist records implementation evidence. The two aggregate user-reported manual results above do not identify which lecturer checklist rows their six scenarios cover, so they do not change an individual row from PENDING to PASS.

| # | Assessment item | Status | Evidence or next action |
| --- | --- | --- | --- |
| 1 | Individual project | PASS | Product and demo documentation describe one individual user and no group workflow. |
| 2 | Clear product purpose and scope | PASS | [PRODUCT_IDEA.md](PRODUCT_IDEA.md), [MVP.md](MVP.md), and `PRODUCT_SPEC.md`. |
| 3 | React/TypeScript frontend architecture | PASS | Vite React source under `src/`; [ARCHITECTURE.md](ARCHITECTURE.md). |
| 4 | Persistent database model | PASS | Supabase migration and [DATA_MODEL.md](DATA_MODEL.md), including ER diagram. |
| 5 | Registration | PENDING | Code and mocked service-error coverage exist; register a disposable account manually. |
| 6 | Login and logout | PENDING | Code exists; manually sign in, refresh, then sign out with a disposable account. |
| 7 | Create a journal entry | PENDING | Autosave path is mocked; create a live entry and confirm the Saved state. |
| 8 | Read an existing journal entry | PENDING | Service read is mocked; navigate away and back to a live saved date. |
| 9 | Update an existing journal entry | PENDING | Upsert is mocked; edit and confirm the refreshed value. |
| 10 | Delete an existing journal entry | PENDING | Deletion success/failure and pending-save ordering are mocked; verify live deletion. |
| 11 | Duplicate prevention | PASS | Database composite primary key `(user_id, entry_date)` and upsert conflict key prevent a second row for the same user/date. |
| 12 | Date navigation | PENDING | Implemented in `App.tsx`; manually check previous, next, today, and future dates. |
| 13 | Autosave | PENDING | 700 ms debounce and per-date queue are implemented; manually observe Saving then Saved. |
| 14 | Refresh persistence | PENDING | Implemented through Supabase; manually refresh after a confirmed save. |
| 15 | Invalid authentication input | PENDING | Native constraints are tested structurally; manually try invalid email and a password shorter than 8 characters. |
| 16 | Failure handling | PENDING | Mocked auth/deletion failures are covered; manually test a safe network interruption or configured test failure. |
| 17 | User isolation | PENDING | RLS policies are present; run the two-account procedure in [SECURITY_VERIFICATION.md](SECURITY_VERIFICATION.md). |
| 18 | Responsive and accessible interaction | PENDING | Design implementation exists; manually check mobile viewport, keyboard focus, dialogs, and confirmation cancel. |
| 19 | Production deployment and submitted URL | PENDING | Confirm the Vercel deployment, add its URL to README, and capture a final screenshot. |

## Remaining evidence limits

The 2026-10-13 user-reported manual browser and RLS runs are recorded above, but this report has no independent run logs, scenario mapping, environment details, or screenshot evidence. The individual PENDING checklist rows therefore remain items to document with specific evidence if required for assessment. Do not record passwords, tokens, cookies, or keys.
