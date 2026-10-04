// Fixed experiment contract. No content, profile fields, or generic payloads.
export type ExperimentEvent =
  | { name: "task_added"; source: "manual" | "capture"; task_count: number }
  | { name: "capture_succeeded"; task_count: number }
  | { name: "capture_failed"; stage: "interpretation" | "persistence" }
  | { name: "capture_submitted" | "capture_clarification_requested" | "context_interacted" | "recommendation_surfaced" | "task_edited" | "task_deleted" };

export type BrowserExperimentEvent = Exclude<ExperimentEvent,
  { name: "task_added" | "capture_succeeded" }> & {
    name: "capture_submitted" | "capture_clarification_requested" | "capture_failed" | "context_interacted" | "recommendation_surfaced";
  };

export function parseExperimentEvent(value: unknown, browserOnly = false): ExperimentEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid event");
  const event = value as Record<string, unknown>;
  if (typeof event.name !== "string") throw new Error("Invalid event name");
  const empty = ["capture_submitted", "capture_clarification_requested", "context_interacted", "recommendation_surfaced", "task_edited", "task_deleted"];
  const browser = ["capture_submitted", "capture_clarification_requested", "capture_failed", "context_interacted", "recommendation_surfaced"];
  if (browserOnly && !browser.includes(event.name)) throw new Error("Invalid browser event");
  let keys: string[];
  if (empty.includes(event.name)) keys = ["name"];
  else if (event.name === "capture_failed" && (event.stage === "interpretation" || event.stage === "persistence")) keys = ["name", "stage"];
  else if ((event.name === "task_added" || event.name === "capture_succeeded") &&
    Number.isInteger(event.task_count) && Number(event.task_count) >= 1 && Number(event.task_count) <= 20 &&
    (event.name === "capture_succeeded" || event.source === "manual" || event.source === "capture")) {
    keys = event.name === "task_added" ? ["name", "source", "task_count"] : ["name", "task_count"];
  } else throw new Error("Invalid event");
  if (Object.keys(event).length !== keys.length || Object.keys(event).some(key => !keys.includes(key))) throw new Error("Invalid event fields");
  // Construct a new allowlisted object rather than forwarding unknown input.
  return Object.fromEntries(keys.map(key => [key, event[key]])) as ExperimentEvent;
}
