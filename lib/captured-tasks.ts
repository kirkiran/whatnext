import { parseCaptureRequest, parseCaptureResult } from "@/lib/capture";
import type { CaptureTaskDraft } from "@/lib/capture";
import type { Task } from "@/lib/whatnext-data";

export function prependCapturedTasks(
  currentTasks: Task[],
  drafts: CaptureTaskDraft[],
  originalCapture: string,
): Task[] {
  parseCaptureRequest({ capture: originalCapture });
  const result = parseCaptureResult({ status: "success", tasks: drafts, message: null });
  const usedIds = new Set(currentTasks.map((task) => task.id));
  let nextId = Date.now();
  const added = result.tasks.map((draft) => {
    while (usedIds.has(nextId)) nextId++;
    if (!Number.isSafeInteger(nextId)) throw new Error("Cannot assign a task ID");
    const id = nextId++;
    usedIds.add(id);
    return { ...draft, id, originalCapture };
  });
  return [...added, ...currentTasks];
}
