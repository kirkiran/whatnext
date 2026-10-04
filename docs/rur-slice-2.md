# RUR Slice 2 — identity and database boundary

This document records the Slice 2 baseline and its validation. Slice 3's UI
integration is documented in `rur-slice-3.md`; the localStorage/sample behavior
described below is historical, not the current task authority.

This slice adds Clerk authentication, an authenticated task API, and a reviewable
Supabase migration. It does **not** connect the current product UI to durable tasks.
The page still uses prototype localStorage, sample tasks, and persisted context;
Slice 3 removes those authorities. Do not invite experiment participants yet.

## Runtime/configuration

- Next.js 15.5.27 / React 19.1.9 remain unchanged.
- Node >=22 is required by Supabase JS 2.117.2 (local development uses Node 24).
- Clerk Development: invite-only, email-code authentication, native Supabase integration.
- Supabase trusts that Clerk instance via Third-party Auth. Tokens include role
  `authenticated`; ownership is their text `sub`, not a Supabase Auth UUID.
- Enter values privately in `.env.local`; `.env.example` lists names only.
  Never print tokens, configuration secrets, raw captures, or task content in logs.
- No Supabase admin key, copied Clerk profile, webhook, realtime, or analytics.

## Application boundary

`middleware.ts` protects the home page; sign-in/signup routes are public and use
Clerk components. The header supplies Clerk sign-out without exposing a standalone
Clerk account deletion control before application cleanup is implemented.
Every API checks Clerk authentication independently. Capture rejects signed-out
requests before reading Capture text or invoking OpenAI; its interpretation
contract, recovery messages, bounds and `store:false` remain unchanged.

Next.js task handlers use a per-request Supabase client with the publishable key
and the native Clerk session token. A missing token never becomes anonymous DB
access. No Supabase session storage or JWT template is used. Task responses are
uncached and errors do not expose database/provider payloads.

- `GET /api/tasks`: owned tasks, newest additions first, batch order preserved.
- `POST /api/tasks`: `{ requestId, tasks, originalCapture? }`; 1–20 complete drafts,
  valid UUID, optional exact Capture source. Rejects unknown fields including owner.
- `PATCH /api/tasks/[id]`: complete task draft; preserves ID, ownership, addition
  provenance, creation time and originalCapture.
- `DELETE /api/tasks/[id]`: deletes only a visible owned task.

Task metadata validation reuses the existing Capture draft contract. An inaccessible
task and an absent task both return 404. Database errors return recoverable 503,
never a persistence-success response. Mutations reject foreign Origin headers;
JSON additions/edits require application/json.

## Schema and addition retries

`supabase/migrations/202610030001_rur_identity_tasks.sql` was manually applied to
**eegenu-dev** during local validation. Application code does not apply migrations.
It creates minimal `application_accounts` roots lazily on first durable addition,
tasks with all existing metadata, a cascading account FK, bounded numeric IDs,
explicit authenticated grants, and RLS on both tables. The owner comes from
`auth.jwt()->>'sub'`. UPDATE has both USING and WITH CHECK. Column grants also
prevent rewriting task ownership or immutable provenance.

`add_task_batch` is SECURITY INVOKER, with an empty search_path and explicit object
names: it does not bypass RLS. One RPC transaction creates the root and complete
batch. Unique `(user_id, addition_request_id, batch_position)` prevents duplicate
members. A retry returns the existing unchanged batch; a different payload, edited
batch, or partially deleted retained batch fails rather than overwrites data.
There is no receipt table. Once all rows of an addition are deliberately deleted,
its request ID is no longer retained; replaying that old addition can recreate it.
Slice 3 must retain an ID across uncertain retries, never retry deleted/resolved
additions, and generate a new ID only for a new intentional addition. This is
bounded addition retry handling, not a permanent command history.

## Completed local/manual validation — 2026-10-03

All required Slice 2 local/manual checks passed, as reported by the developer.
These results concern Clerk Development, the local app at localhost:3000, and
the hosted **eegenu-dev** project; they are not production validation.

- The migration applied successfully. `supabase/tests/rur_boundary.sql` completed
  without a FAIL exception and rolled back its synthetic data. This exercised
  authenticated/anon grants, RLS isolation, owner spoofing/reassignment denial,
  single-task retries, changed-payload rejection, invalid-batch atomic rollback,
  and owned edit/delete. Its simulated JWT claims do not test token signatures.
- Two separate invited Clerk Development accounts signed in using email codes
  in separate browser sessions. Each initially saw an empty task list.
- User A created task 37; User B could not read it. User B created task 38 with
  the same addition request UUID and received an independent row. Each account's
  GET returned only its own task, confirming the real Clerk → EegEnu API →
  Supabase → RLS read-isolation path and user-scoped request IDs.
- User B edited task 38 (HTTP 200), confirmed persistence via GET, deleted it
  (HTTP 200 with deleted:true), and confirmed an empty list. User A also deleted
  task 37 and confirmed an empty list.
- Sign-out returned User B to the sign-in page. Signed-out GET /api/tasks returned
  the sign-in-required error; POST /api/capture returned HTTP 401 with the same
  error. Automated Capture tests separately assert no upstream call before auth.
- Signed-out direct navigation to / redirected to /sign-in. Direct /sign-up
  displayed "Access restricted — Sign ups are currently disabled." User A's
  authenticated session remained usable after refreshing the application.
- A successful two-task batch with an exact synthetic originalCapture was POSTed
  twice with an identical payload and request UUID under the same account. Both
  POSTs and the final GET returned HTTP 200. Exactly two tasks persisted, the retry
  returned the same two IDs in the same order, and metadata and the exact source
  were preserved. All console verification checks passed. No actual lost-response
  interruption was simulated; the identical retry exercised the same request path.
- A direct Supabase Data API GET using the publishable key and a deliberately
  invalid bearer token returned HTTP 401, PGRST301, and
  "Expected 3 parts in JWT; got 1". No real Clerk token was used for this negative
  test. Together with real authenticated requests, this verifies acceptance of
  valid Clerk tokens and rejection of that malformed token.
- All manually created synthetic tasks were deleted. User A's final GET returned
  zero tasks; User B's synthetic task had already been deleted. Lazy application
  account roots may remain; account deletion belongs to Slice 4.

Cross-account database write denial is covered by the executed SQL tests; it was
not separately repeated through the HTTP API. Direct Data API A/B read isolation
was not separately repeated: the real-token app reads and SQL enforcement tests
provide the combined evidence above. No additional manual validation is required
to close this local Slice 2 boundary.

Production Clerk/domain/Vercel configuration and production verification remain
outside this slice. Authenticated live OpenAI Capture verification is still
required before external release and was not performed in these checks.
Authentication does not make current localStorage account-isolated; the UI
remains an intermediate developer-only state until Slice 3.

## Official implementation references

- https://clerk.com/docs/nextjs/getting-started/quickstart
- https://clerk.com/docs/guides/development/integrations/databases/supabase
- https://supabase.com/docs/guides/auth/third-party/clerk
- https://supabase.com/docs/guides/getting-started/api-keys
