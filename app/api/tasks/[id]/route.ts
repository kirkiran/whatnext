import { requireUser } from "@/lib/server/auth";
import { createUserDatabase } from "@/lib/server/supabase";
import { deleteTask, editTask } from "@/lib/server/tasks";
import { readTaskBody, taskResponse } from "@/lib/server/task-http";
import { parseTaskDraft, parseTaskId } from "@/lib/task-storage";
import { recordExperimentEvents } from "@/lib/server/experiment-events";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await requireUser();
  if (identity instanceof Response) return identity;
  let id, draft;
  try {
    id = parseTaskId((await context.params).id);
    draft = parseTaskDraft(await readTaskBody(request));
  } catch {
    return taskResponse({ error: "Send a valid task ID and complete task details." }, 400);
  }
  try {
    const database = await createUserDatabase(identity);
    const task = await editTask(database, id, draft);
    if (task) await recordExperimentEvents(database, identity.userId, [{ name: "task_edited" }]);
    return task ? taskResponse({ task }) : taskResponse({ error: "Task not found." }, 404);
  } catch {
    return taskResponse({ error: "Could not confirm the edit. Please retry." }, 503);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await requireUser();
  if (identity instanceof Response) return identity;
  let id;
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new Error("Invalid origin");
    id = parseTaskId((await context.params).id);
  } catch {
    return taskResponse({ error: "Send a valid task ID from this application." }, 400);
  }
  try {
    const database = await createUserDatabase(identity);
    const deleted = await deleteTask(database, id);
    if (deleted) await recordExperimentEvents(database, identity.userId, [{ name: "task_deleted" }]);
    return deleted ? taskResponse({ deleted: true }) : taskResponse({ error: "Task not found." }, 404);
  } catch {
    return taskResponse({ error: "Could not confirm deletion. Please retry." }, 503);
  }
}
