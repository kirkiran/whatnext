# RUR Slice 3 — durable task UI

The authenticated task API is the sole task authority. The browser neither reads
nor changes legacy `whatnext.tasks` or `whatnext.context`. Current Context starts
from `defaultContext` in each authenticated workspace and remains in memory.
Recommendations, ranking and explanations remain local and unchanged.

## Behavior

- Clerk identity keys the workspace. An identity check invalidates old callbacks
  before effect cleanup; disposal ignores late results. No task cache is shared
  between accounts.
- Initial loading and failure do not render tasks or recommendations. A confirmed
  empty list enables entry. Failed background refresh retains confirmed tasks and
  displays a freshness warning. Focus and the Refresh tasks action revalidate.
- Mutations are serialized. A mutation invalidates older reads; focus refresh
  during a mutation is deferred. Successful POST/PATCH/DELETE responses establish
  success directly, without a mandatory follow-up GET.
- Additions use server IDs and preserve returned batch order. POST results are
  validated in full, including metadata, exact source and batch membership.
- Manual Add freezes its submitted draft and UUID until confirmation. Capture
  freezes its interpreted batch, exact source and UUID. Retry save sends the same
  snapshot; Capture retry does not invoke interpretation again. Definite 400
  rejection releases the snapshot for correction. Other failures retain it.
- Unresolved additions block other task changes, including edits/deletes of a
  batch that may already be visible after refresh. No automatic addition replay.
- Retry state is in memory only. Reloading abandons it and reads the server.
  Input is frozen during uncertain addition recovery to prevent changing payload
  under the same UUID. A new addition after reload is a new intentional operation;
  users should inspect refreshed tasks before re-entering uncertain work.
- Forms close and Capture clears only after confirmation. Recoverable edit
  failure retains fields. Edit 404 triggers refresh and leaves the draft open;
  Cancel returns to the list. Delete 404 checks the list to confirm absence before
  reconciling success. Failed reconciliation remains a failure.
- A task API 401 hides task/recommendation data and offers sign-in. Account changes
  clear the old workspace, forms, retry snapshots and transient Context.

## Validation coverage

Focused automated tests cover client response validation, atomic-batch publication,
uncertain addition retries, awaited form/Capture saves, duplicate submission,
initial/freshness states, stale reads, serialized writes, deferred focus refresh,
identity invalidation/disposal, 401/400 handling and proportional 404 reconciliation.
Existing task-boundary, Capture interpretation and recommendation tests remain.

Final local closeout checks passed: `npm test` (43 passed, 0 failed, 0 skipped),
`npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.
The complete tracked diff and new files were reviewed for scope, secrets,
generated files and obsolete browser task authority. An earlier implementation
build warned that Browserslist data was seven months old; the final closeout build
reported no warnings. No package update was performed. Git reports only its normal
LF-to-CRLF conversion notices; whitespace validation passes.

The implementation makes no schema, provider configuration, migration, package,
analytics, account/data deletion, onboarding, realtime, persistent retry queue
or interpretation/scoring change.

## Completed manual validation

The developer reported completion through the local UI against eegenu-dev with
two development accounts. Slice 3 uses the agreed prototype/portfolio-project
standard for the bounded experiment; these results are not production validation.

1. User A started with a genuinely empty account. No sample tasks or sample
   recommendation flashed during loading. A manual task with distinctive metadata
   persisted after refresh; edits to the task and multiple metadata fields also
   persisted. After deletion and refresh, it remained deleted and the legitimate
   empty task/recommendation state appeared.
2. Initial Capture returned 503 because the local OPENAI_API_KEY was absent.
   Diagnosis established that this occurred before OpenAI interpretation and
   before POST /api/tasks, so it was not a durable persistence defect. The developer
   then supplied OPENAI_API_KEY and OPENAI_MODEL in ignored local .env.local and
   restarted the server for testing. No credential values are recorded here.
3. Authenticated Capture of "Call the dentist to schedule my cleaning and buy milk
   on the way home" succeeded, creating exactly two tasks: "Call the dentist to
   schedule my cleaning" and "Buy milk on the way home". The UI reported "Added
   2 tasks." Both tasks and their metadata persisted after refresh. Original
   capture disclosure on each preserved the full submitted sentence.
4. Current Context was changed away from defaults. Refresh restored the defaults,
   confirming its transient behavior.
5. User A retained the two captured tasks. After signing out and signing into
   User B in the same browser, User B saw an empty list rather than User A's tasks.

## Accepted non-blocking prototype observations

- Delete is immediate, with no confirmation or undo.
- Interpretation/configuration failure uses generic "Could not save this capture"
  wording even when durable saving was never reached. Capture input was preserved.

These observations do not block Slice 3 and require no implementation change for
closeout. Revisit them only if later real-user evidence warrants it.

Lost-response simulation, network races, exhaustive session-expiry cases,
multi-tab races and stale-404 permutations were deliberately not manually tested.
Existing automated coverage is sufficient for the agreed bounded experiment;
the earlier manual coverage inventory is not a production release checklist.
Manual Slice 3 validation is complete under this standard.
With final automated validation passing, Slice 3 is ready for a local commit.

Account/data deletion is Slice 4; analytics Slice 5; legal and release work Slice 6.
