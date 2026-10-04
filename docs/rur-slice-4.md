# RUR Slice 4 — minimal account/data deletion

Slice 4 adds deliberate deletion inside EegEnu for the bounded portfolio prototype.
No settings page, webhook, service-role key, package or provider configuration
change is introduced. Slice 4 is closed at the agreed prototype validation standard.

## Architecture

- A low-emphasis Delete account action sits beside Sign out. The browser asks:
  "Permanently delete your EegEnu account and all stored tasks? This cannot be undone."
- DELETE /api/account uses requireUser() and requires exactly `{ confirmed: true }`
  as application/json. Foreign Origin headers and extra fields, including caller
  user IDs, are rejected. The authenticated identity is the only deletion target.
- The existing user-scoped Supabase client deletes the matching application_accounts
  root. The existing ON DELETE CASCADE removes owned tasks and original Capture
  text. A subsequent SELECT verifies root absence before any Clerk deletion.
  Zero deleted rows is valid for never-used accounts and retries.
- The installed @clerk/nextjs 7.9.10 server SDK uses the existing CLERK_SECRET_KEY:
  `const client = await clerkClient(); await client.users.deleteUser(identity.userId)`.
- Full confirmation returns `{ dataDeleted: true, deleted: true }` with no-store.
  The browser clears the visible workspace and calls signOut with `/sign-in`.

## Migration

`supabase/migrations/202610030002_rur_account_delete.sql` grants DELETE on
application_accounts to authenticated and adds accounts_delete_own with
`user_id = (select auth.jwt()->>'sub')`. It changes no columns, task policies,
functions, ownership design or anonymous grants. It was applied successfully to
eegenu-dev through the Supabase SQL Editor.

## Failure behavior

- If root deletion or absence verification fails, return 503 without attempting
  Clerk deletion. Say data deletion could not be confirmed; do not claim it was
  unchanged, since a response can be lost after commit.
- If data cleanup is confirmed but Clerk deletion fails or is uncertain, return
  503 with dataDeleted:true. The UI hides removed task data, explains that account
  deletion is unconfirmed and offers another Delete account attempt. The same
  endpoint safely handles an already-absent root.
- A lost/unreadable response or browser timeout never announces success. Retry
  remains available while authenticated. If the session has ended, sign in may be
  needed; there is no permanent receipt system for reconstructing lost responses.
- A full success remains success if subsequent browser sign-out fails. The UI
  keeps the workspace hidden, says deletion completed and offers a sign-in link.
- An in-flight guard prevents duplicate deletion submissions. Current workspace
  callbacks are blocked immediately, and the workspace is unmounted during the
  request, preventing new task writes and interpreted Capture saves there. On
  unconfirmed data failure it remounts from the API; on confirmed data deletion it
  remains hidden. Old-account responses cannot sign out a different current user.

This is sequential cleanup, not a distributed transaction. Already-dispatched
requests and other tabs/sessions are not coordinated; production race handling,
compensation and deletion queues are outside the agreed scope. Legacy prototype
browser storage remains unused and untouched, as in Slice 3.

## Validation

Local automated validation passed: `npm test` (54 passed, 0 failed, 0 skipped),
`npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.
The build reports outdated Browserslist data; no dependency update was made.

Automated endpoint tests cover authentication, exact confirmation, origin/content
type, exclusive identity targeting, database-before-Clerk ordering, failed deletion
and verification, absent-root retries, partial failure and sanitized responses.
UI tests cover Cancel, duplicate submission, workspace blocking, confirmation-only
success/sign-out, sign-out failure, partial retry, uncertain responses and account
switches. Existing task/Capture/recommendation tests remain unchanged in behavior.

`supabase/tests/rur_account_delete.sql` checks own-root deletion, task/source cascade,
cross-account denial, missing-root retry and anonymous denial with synthetic JWT
claims in a rolled-back transaction. Every assertion passed in eegenu-dev after
the migration was applied. Follow-up queries confirmed zero synthetic accounts
and zero synthetic tasks remained. These checks do not verify Clerk token signatures.

## Completed manual validation

A disposable authenticated development account was used. A task was created
successfully through Capture before Delete account was confirmed.

No additional accounts or manual edge-case repetitions were required for closure.
Cancellation and the no-application-root path are covered by automated tests.
Separate manual verification of Supabase row absence, Clerk user absence,
signed-out navigation, and another account's data was not reported and is not
claimed here. SQL checks and automated tests provide the remaining agreed coverage.
No production-level manual race simulation or fault-injection infrastructure is
required for this prototype.

Analytics remains Slice 5. Legal/privacy documentation remains Slice 6. Export,
soft deletion, recovery, retention, audit/admin tools, lifecycle synchronization
and unrelated task/Capture UX changes remain deferred.

## SDK references

- https://clerk.com/docs/reference/backend/user/delete-user
- https://clerk.com/docs/guides/development/custom-flows/authentication/sign-out
