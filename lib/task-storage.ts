import { parseCaptureRequest, parseCaptureResult } from "@/lib/capture";
import type { CaptureTaskDraft } from "@/lib/capture";
import type { Task } from "@/lib/whatnext-data";

export type TaskAddition = { requestId: string; tasks: CaptureTaskDraft[]; originalCapture?: string };

function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid object");
}

export function parseTaskDraft(value: unknown): CaptureTaskDraft {
  const result = parseCaptureResult({ status: "success", tasks: [value], message: null });
  if (result.status !== "success") throw new Error("Invalid task");
  return result.tasks[0];
}

export function parseTaskAddition(value: unknown): TaskAddition {
  object(value);
  if (Object.keys(value).some((key) => !["requestId", "tasks", "originalCapture"].includes(key)) ||
      typeof value.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId)) {
    throw new Error("Invalid addition request");
  }
  const result = parseCaptureResult({ status: "success", tasks: value.tasks, message: null });
  if (result.status !== "success") throw new Error("Invalid batch");
  if (Object.hasOwn(value, "originalCapture")) parseCaptureRequest({ capture: value.originalCapture });
  return { requestId: value.requestId, tasks: result.tasks,
    ...(typeof value.originalCapture === "string" ? { originalCapture: value.originalCapture } : {}) };
}

export function parseTaskId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) throw new Error("Invalid task ID");
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new Error("Invalid task ID");
  return id;
}

export function taskFromRow(value: unknown): Task {
  object(value);
  const id = parseTaskId(String(value.id));
  const draft = parseTaskDraft({ name: value.name, duration: value.duration,
    urgency: value.urgency, importance: value.importance, focusRequired: value.focus_required,
    contextTag: value.context_tag, readiness: value.readiness, canBeDoneInParts: value.can_be_done_in_parts });
  if (value.original_capture !== null) parseCaptureRequest({ capture: value.original_capture });
  return { ...draft, id, ...(typeof value.original_capture === "string" ? { originalCapture: value.original_capture } : {}) };
}

export function taskToColumns(task: CaptureTaskDraft) {
  return { name: task.name, duration: task.duration, urgency: task.urgency, importance: task.importance,
    focus_required: task.focusRequired, context_tag: task.contextTag,
    readiness: task.readiness, can_be_done_in_parts: task.canBeDoneInParts };
}
