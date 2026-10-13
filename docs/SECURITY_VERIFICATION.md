# Supabase RLS verification procedure

This procedure proves row-level isolation using two disposable email/password accounts. It uses only the public Supabase URL and publishable key already available to the browser. Do not use a service-role key, access token, browser cookie, password, or secret in notes or screenshots.

## Preparation

1. Use a non-production test project when possible. Otherwise create two new disposable accounts: **Account A** and **Account B**.
2. Sign in as Account A, create an entry on a distinct test date, and record only the entry date and Account A's UUID. The UUID is visible in the Supabase Auth users list; do not copy an access token.
3. Sign out and sign in as Account B in a separate browser profile or an incognito window.
4. In Account B's browser console, create a Supabase client with the same public configuration used by the app. Do not paste credentials into this document, source code, or a screenshot.

## Unauthorized attempts as Account B

Run each operation against Account A's UUID and test date. Capture only the operation/result, with email addresses and tokens redacted.

| Attempt | Expected safe result |
| --- | --- |
| SELECT Account A's row | Empty result; no Account A content returned. |
| INSERT a row with `user_id` set to Account A's UUID | RLS rejection/error; no row created. |
| UPDATE Account A's row | Zero returned rows or RLS rejection; Account A's content remains unchanged. |
| DELETE Account A's row | Zero returned rows or RLS rejection; Account A's row remains. |

For UPDATE and DELETE, request returned rows with `.select()` where the browser client supports it. A no-op result is expected because the row is invisible to Account B; verify preservation by signing back into Account A and loading the date.

## Confirmation and cleanup

1. Sign in as Account A and confirm its original entry still exists and is unchanged after all four attempts.
2. As Account A, delete the test entry through the application confirmation flow.
3. Delete the two disposable accounts through the Supabase dashboard if they are no longer needed.
4. Record the environment, date, and PASS/FAIL result in the assessment evidence. Never store account passwords, session data, tokens, service-role keys, or unredacted user identifiers in the repository.

## What this verifies

The migration enables RLS and defines separate SELECT, INSERT, UPDATE, and DELETE policies requiring `auth.uid() = user_id`. The procedure validates that live behavior matches that schema; static code review alone does not prove deployed policy enforcement.
