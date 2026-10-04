import { parseExperimentEvent } from "@/lib/experiment-events";
import type { BrowserExperimentEvent } from "@/lib/experiment-events";

// Directional evidence only: no retries, queue, or user-facing errors.
export async function recordBrowserEvent(event: BrowserExperimentEvent): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const body = parseExperimentEvent(event, true);
    await fetch("/api/experiment-events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: controller.signal,
    });
  } catch { /* Analytics must not interrupt product actions. */ }
  finally { clearTimeout(timeout); }
}
