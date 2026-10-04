import "server-only";
import { auth } from "@clerk/nextjs/server";

export type UserIdentity = { userId: string; getToken: () => Promise<string | null> };

export async function requireUser(): Promise<UserIdentity | Response> {
  try {
    const session = await auth();
    if (!session.userId) {
      return Response.json({ error: "Sign in to continue." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return { userId: session.userId, getToken: () => session.getToken() };
  } catch {
    // Never expose provider details or proceed when authentication is uncertain.
    return Response.json({ error: "Could not verify your session. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
