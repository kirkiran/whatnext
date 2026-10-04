import { clerkClient } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/server/auth";
import { createUserDatabase } from "@/lib/server/supabase";
import { deleteAccountData } from "@/lib/server/account";
import { readTaskBody, taskResponse } from "@/lib/server/task-http";

export async function DELETE(request: Request) {
  const identity = await requireUser();
  if (identity instanceof Response) return identity;
  try {
    const body = await readTaskBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).length !== 1 || body.confirmed !== true) throw new Error("Confirmation required");
  } catch {
    return taskResponse({ error: "Confirm account deletion from this application." }, 400);
  }
  try {
    await deleteAccountData(await createUserDatabase(identity), identity.userId);
  } catch {
    return taskResponse({ error: "Could not confirm EegEnu data deletion. Account deletion was not attempted. Please retry." }, 503);
  }
  try {
    const client = await clerkClient();
    await client.users.deleteUser(identity.userId);
  } catch {
    return taskResponse({ dataDeleted: true, error: "EegEnu task data was removed, but account deletion could not be confirmed. Please retry." }, 503);
  }
  return taskResponse({ dataDeleted: true, deleted: true });
}
