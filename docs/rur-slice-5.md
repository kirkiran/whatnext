# RUR Slice 5 — minimal behavioral analytics

Directional behavioral telemetry for roughly 2–20 users, not production analytics
infrastructure. Slice 5 is closed at the agreed prototype validation standard. No vendor,
package, dashboard, webhook, service-role key or configuration change is required.

## Measurement contract

| Event | Metadata | Emission point |
| --- | --- | --- |
| task_added | source: manual/capture; task_count: 1–20 | Task POST after validated durable batch response |
| capture_succeeded | task_count: 1–20 | Same confirmed POST for additions with originalCapture |
| capture_submitted | none | Immediately before fresh Capture interpretation request |
| capture_clarification_requested | none | Validated clarification response |
| capture_failed | stage: interpretation/persistence | Capture failure before/after interpreted addition exists |
| context_interacted | none | User changes a context control's value |
| recommendation_surfaced | none | First non-null recommendation in mounted workspace |
| task_edited | none | Task PATCH confirms a returned durable task |
| task_deleted | none | Task DELETE confirms deletion; never 404 reconciliation |

Successful AI interpretation alone is not Capture success. Retry save neither
reinterprets nor emits capture_submitted again. Durable additions use returned
task counts and server-derived source; no task names are copied into events.
Context initialization/no-op changes and recommendation loading/empty/no-match
states produce no events. Recommendation rerenders do not repeat exposure;
a new workspace mount may emit again. Existing ranking and explanations are unchanged.

## Boundary and deletion

public.experiment_events has typed event_name/source/task_count/stage columns,
database-generated ID/timestamp, and a Clerk subject default from auth.jwt()->>'sub'.
Its foreign key cascades from application_accounts, so account deletion removes
telemetry too. A narrow authenticated helper ensures the root exists using existing
RLS before event insertion, including activity before the first task.

Authenticated clients have only own-user INSERT and only event/metadata-column
grants. No SELECT, UPDATE or DELETE grant; no anonymous grant. Database constraints
enforce exact per-event shapes and reject null/unknown/out-of-range metadata.
No JSON payload exists. The browser endpoint authenticates with requireUser(),
rejects foreign origins, validates exact fields and accepts only browser events.
It accepts no user ID or timestamp; durable mutation events are constructed in
their existing server routes. Browser calls use the current workspace identity guard.

Never store task names/text, Capture text, original_capture, context values,
recommendation/explanation text, email/profile data or arbitrary client payloads.
No raw payload or error logging is added. The existing addition_request_id UUID is
stored only for task_added/capture_succeeded and uniquely constrained per user/event
to discard obvious duplicate inserts on Retry save. It is not a session identifier.

## Failure semantics and limits

Browser requests are best effort with a two-second timeout, caught failures, no
retries/queue and no analytics UI errors. Accepted (202) is not a delivery receipt.
Server event writes are isolated from product success, share a 1.5-second request
abort budget, and swallow analytics errors, including duplicate addition inserts.
They do not participate in task transactions; no product mutation is rolled back
or reported failed due to unavailable analytics. Missing events are possible.

capture_failed with persistence means the browser could not confirm saving, not
proof of absent database data. It can coexist with durable success after a lost
response. Capture failure/retry counts need not form a perfect funnel. Repeated
confirmed edits and new workspace exposures can produce repeated events. No
cross-tab, cross-mount, delivery, session-expiry or distributed coordination is built.
Users with access to their authenticated token can submit allowed telemetry directly;
this is not an anti-tampering ledger. Deleted accounts disappear from analysis.

## Analysis

Run supabase/queries/rur_experiment.sql as project owner in SQL Editor. Queries
cover distinct users adding intentions, source-specific batches/intention counts,
Capture submissions/success/clarification/failure stages, context interaction,
recommendation exposure and qualifying multi-day users. Invitation counts stay manual.

Return is derived, never emitted. Qualifying events are task_added,
capture_submitted, context_interacted, task_edited and task_deleted. More than one
distinct UTC calendar date establishes activity later than the first qualifying
date. recommendation_surfaced alone never qualifies. All date queries explicitly
use UTC; no browser timezone or local timestamp is collected.

## Completed validation

Local checks passed: `npm test` (62 passed, 0 failed, 0 skipped),
`npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.
The build reports outdated Browserslist data; no dependency update was made.

Focused automated tests cover contract/privacy validation, identity, confirmed
mutations, analytics failure isolation and Capture/context/recommendation semantics.
supabase/tests/rur_experiment_events.sql provides rollback-only synthetic checks
for grants/RLS, metadata constraints, retry uniqueness, cascade and UTC return.
The migration was applied successfully to eegenu-dev. Every SQL assertion passed;
follow-up inspection confirmed zero persistent synthetic accounts/events and no
remaining temporary owner-column grant. UTC later-day return behavior was validated
with synthetic SQL timestamps, not by waiting for another real calendar day.

One development-account walkthrough and a controlled follow-up deletion completed
manual acceptance. Read-only SQL inspection established:

- Manual addition produced task_added with source=manual.
- Successful Capture produced capture_submitted, task_added with source=capture,
  and capture_succeeded. Both Capture counts were task_count=1, consistent with
  the matching durable task batch.
- Current Context interaction produced context_interacted; recommendation exposure
  produced recommendation_surfaced; editing produced task_edited.
- The initial walkthrough did not establish deletion telemetry: task_deleted was
  absent and both walkthrough tasks remained stored. One controlled follow-up
  deletion then produced task_deleted and reduced stored walkthrough tasks from
  two to one, resolving that gap.
- Analytics schema and sampled metadata passed the privacy inspection: no task
  text/name, Capture text, original_capture, context values, recommendation or
  explanation text, email/profile information, or arbitrary payload field.

No exact recommendation exposure count, additional participant accounts, exhaustive
delivery tests, or manual wait for a later calendar day was required. Clarification
and failure behavior remain covered by automated tests, not claimed as manual checks.

Deferred: dashboards, signup/invite analytics, intent classifications, attribution,
devices/browsers, page views, login/session events, duration, realtime, analytics
retries/queues, generalized deduplication and production race handling. Legal/privacy
release documentation remains Slice 6; this slice records the actual behavior.
