import { requireUser } from "@/lib/server/auth";
import { createUserDatabase } from "@/lib/server/supabase";
import { readTaskBody, taskResponse } from "@/lib/server/task-http";
import { parseExperimentEvent } from "@/lib/experiment-events";
import { recordExperimentEvents } from "@/lib/server/experiment-events";

export async function POST(request: Request) {
  const identity = await requireUser();
  if (identity instanceof Response) return identity;
  let event;
  try { event = parseExperimentEvent(await readTaskBody(request), true); }
  catch { return taskResponse({ error: "Send an allowed experiment event." }, 400); }
  try { await recordExperimentEvents(await createUserDatabase(identity), identity.userId, [event]); }
  catch { /* Best effort, including unavailable database credentials/token. */ }
  // Accepted, not a telemetry delivery guarantee.
  return taskResponse({ accepted: true }, 202);
}
