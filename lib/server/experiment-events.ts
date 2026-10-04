import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseExperimentEvent } from "@/lib/experiment-events";
import type { ExperimentEvent } from "@/lib/experiment-events";

export async function recordExperimentEvents(database: SupabaseClient, userId: string, events: ExperimentEvent[], additionRequestId?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const rows = events.map(input => {
      const { name, ...metadata } = parseExperimentEvent(input);
      return { event_name: name, ...metadata,
        ...((name === "task_added" || name === "capture_succeeded") && additionRequestId
          ? { addition_request_id: additionRequestId } : {}) };
    });
    // Both ownership and timestamp use database defaults. A root is needed even
    // for context changes or Capture attempts before a user's first task.
    const root = await database.from("application_accounts").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true })
      .abortSignal(controller.signal);
    if (root.error) return;
    // A repeated addition hits the unique constraint; that best-effort insert
    // is discarded. Ordinary INSERT needs no read grants or conflict machinery.
    await database.from("experiment_events").insert(rows).abortSignal(controller.signal);
  } catch { /* Never turn a confirmed task mutation into a failed save. */ }
  finally { clearTimeout(timeout); }
}
