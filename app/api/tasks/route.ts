import { requireUser } from "@/lib/server/auth";
import { createUserDatabase } from "@/lib/server/supabase";
import { addTasks, listTasks } from "@/lib/server/tasks";
import { readTaskBody, taskResponse } from "@/lib/server/task-http";
import { parseTaskAddition } from "@/lib/task-storage";

export async function GET() {
  const identity = await requireUser();
  if (identity instanceof Response) return identity;
  try {
    return taskResponse({ tasks: await listTasks(await createUserDatabase(identity)) });
  } catch {
    return taskResponse({ error: "Could not load tasks. Please retry." }, 503);
  }
}

export async function POST(request: Request) {
  const identity = await requireUser();
  if (identity instanceof Response) return identity;
  let addition;
  try {
    addition = parseTaskAddition(await readTaskBody(request));
  } catch {
    return taskResponse({ error: "Send a valid task batch and addition request UUID." }, 400);
  }
  try {
    return taskResponse({ tasks: await addTasks(await createUserDatabase(identity), addition) });
  } catch {
    // A response can be lost after commit. The caller must retain the request UUID.
    return taskResponse({ error: "Could not confirm this addition. Retry with the same request ID." }, 503);
  }
}
