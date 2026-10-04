import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteAccountData(database: SupabaseClient, userId: string) {
  const deletion = await database.from("application_accounts").delete().eq("user_id", userId);
  if (deletion.error) throw deletion.error;
  // Zero deleted rows is valid for a new account or a retry. Verify absence so
  // a silently filtered DELETE cannot cause identity deletion with retained data.
  const remaining = await database.from("application_accounts").select("user_id")
    .eq("user_id", userId).maybeSingle();
  if (remaining.error || remaining.data !== null) throw new Error("Account data deletion unconfirmed");
}
