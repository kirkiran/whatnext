"use client";

import { useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { TaskWorkspace } from "@/components/task-workspace";
import { Button } from "@/components/ui/button";

export function AccountWorkspace({ isCurrentUser }: { isCurrentUser: () => boolean }) {
  const { signOut } = useClerk();
  const [busy, setBusy] = useState(false);
  const [dataDeleted, setDataDeleted] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [message, setMessage] = useState("");
  const blockedRef = useRef(false);
  const inFlight = useRef(false);

  async function handleDelete() {
    if (inFlight.current || deleted || !isCurrentUser()) return;
    if (!window.confirm("Permanently delete your EegEnu account and all stored tasks? This cannot be undone.")) return;
    inFlight.current = true;
    blockedRef.current = true;
    setBusy(true);
    setMessage("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let confirmed = false;
    let removed = dataDeleted;
    try {
      const response = await fetch("/api/account", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }), signal: controller.signal,
      });
      const result = await response.json();
      if (!isCurrentUser()) return;
      if (result.dataDeleted === true) {
        removed = true;
        setDataDeleted(true);
      }
      if (!response.ok || result.deleted !== true || result.dataDeleted !== true) {
        setMessage(result.dataDeleted === true
          ? "EegEnu task data was removed, but account deletion could not be confirmed. Please retry."
          : response.status === 401 ? "Sign in to continue account deletion."
            : "Could not confirm EegEnu data deletion. Please retry.");
        return;
      }
      confirmed = true;
      setDeleted(true);
      setMessage("Your EegEnu account and stored tasks were deleted.");
      clearTimeout(timeout);
      try { await signOut({ redirectUrl: "/sign-in" }); }
      catch {
        if (isCurrentUser()) setMessage("Your EegEnu account and stored tasks were deleted. Continue to sign in to leave this page.");
      }
    } catch {
      if (isCurrentUser()) setMessage("Could not confirm deletion. Please retry; the request may have completed.");
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      if (isCurrentUser()) {
        // A confirmed deletion is complete even if browser sign-out fails.
        if (!confirmed && !removed) blockedRef.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <>
      <AppHeader accountAction={
        <Button variant="tertiary" disabled={deleted} isLoading={busy} loadingLabel="Deleting account" onClick={handleDelete}>
          Delete account
        </Button>
      } />
      {message ? <p role="status" className="text-body-small text-content-secondary">{message}</p> : null}
      {busy ? <p role="status">Deleting your account…</p> : deleted ? (
        <Link href="/sign-in" className="underline">Continue to sign in</Link>
      ) : dataDeleted ? (
        <p className="text-body-small text-content-secondary">Use Delete account to retry. <Link href="/sign-in" className="underline">Sign in</Link> if your session has ended.</p>
      ) : (
        <TaskWorkspace isCurrentUser={() => isCurrentUser() && !blockedRef.current} />
      )}
    </>
  );
}
