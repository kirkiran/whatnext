import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { UserIdentity } from "./auth";

export async function createUserDatabase(identity: UserIdentity) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_")) throw new Error("Database configuration unavailable");
  const token = await identity.getToken();
  if (!token) throw new Error("Authenticated database token unavailable");
  // Request-scoped client: native Clerk token, publishable key, RLS still applies.
  return createClient(url, key, {
    accessToken: async () => token,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
