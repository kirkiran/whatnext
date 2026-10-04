import { parseCaptureRequest } from "@/lib/capture";
import { parseTaskDraft, parseTaskId } from "@/lib/task-storage";
import type { TaskAddition } from "@/lib/task-storage";
import type { Task } from "@/lib/whatnext-data";

export class TaskApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function parseTask(value: unknown): Task {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid task response");
  const { id, originalCapture, ...fields } = value as Record<string, unknown>;
  if (typeof id !== "number") throw new Error("Invalid task ID");
  const draft = parseTaskDraft(fields);
  if (originalCapture !== undefined) parseCaptureRequest({ capture: originalCapture });
  return { ...draft, id: parseTaskId(String(id)), ...(typeof originalCapture === "string" ? { originalCapture } : {}) };
}

function parseTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) throw new Error("Invalid tasks response");
  const tasks = value.map(parseTask);
  if (new Set(tasks.map(task => task.id)).size !== tasks.length) throw new Error("Duplicate task IDs");
  return tasks;
}

async function request(path: string, method: string, body?: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(path, {
      method, cache: "no-store", signal: controller.signal,
      ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new TaskApiError(response.status, "Task request failed");
    return await response.json();
  } finally { clearTimeout(timeout); }
}

export const taskApi = {
  async list() { return parseTasks((await request("/api/tasks", "GET")).tasks); },
  async add(addition: TaskAddition) {
    const tasks = parseTasks((await request("/api/tasks", "POST", addition)).tasks);
    if (tasks.length !== addition.tasks.length || tasks.some((task, index) => {
      const { id: _id, originalCapture, ...draft } = task;
      return originalCapture !== addition.originalCapture || JSON.stringify(draft) !== JSON.stringify(parseTaskDraft(addition.tasks[index]));
    })) throw new Error("Unconfirmed addition");
    return tasks;
  },
  async edit(id: number, draft: TaskAddition["tasks"][number]) {
    const task = parseTask((await request(`/api/tasks/${id}`, "PATCH", draft)).task);
    const { id: _id, originalCapture: _source, ...fields } = task;
    if (task.id !== id || JSON.stringify(fields) !== JSON.stringify(parseTaskDraft(draft))) throw new Error("Unconfirmed edit");
    return task;
  },
  async delete(id: number) {
    if ((await request(`/api/tasks/${id}`, "DELETE")).deleted !== true) throw new Error("Unconfirmed deletion");
  },
};
