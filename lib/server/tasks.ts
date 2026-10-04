import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaptureTaskDraft } from "@/lib/capture";
import { taskFromRow, taskToColumns } from "@/lib/task-storage";
import type { TaskAddition } from "@/lib/task-storage";

export async function listTasks(database: SupabaseClient) {
  const { data, error } = await database.from("tasks").select("*")
    .order("created_at", { ascending: false }).order("batch_position", { ascending: true }).order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(taskFromRow);
}

export async function addTasks(database: SupabaseClient, addition: TaskAddition) {
  const { data, error } = await database.rpc("add_task_batch", {
    p_request_id: addition.requestId, p_tasks: addition.tasks,
    p_original_capture: addition.originalCapture ?? null,
  });
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== addition.tasks.length) throw new Error("Unconfirmed batch");
  return data.map(taskFromRow);
}

export async function editTask(database: SupabaseClient, id: number, draft: CaptureTaskDraft) {
  const { data, error } = await database.from("tasks").update(taskToColumns(draft)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? taskFromRow(data) : null;
}

export async function deleteTask(database: SupabaseClient, id: number) {
  const { data, error } = await database.from("tasks").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  return data !== null;
}
