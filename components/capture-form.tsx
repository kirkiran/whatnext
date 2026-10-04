"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/control-styles";
import { MAX_CAPTURE_LENGTH, parseCaptureResult } from "@/lib/capture";
import type { TaskAddition } from "@/lib/task-storage";
import { TaskApiError } from "@/lib/task-api";
import type { BrowserExperimentEvent } from "@/lib/experiment-events";

type CaptureFormProps = {
  ready: boolean;
  blocked?: boolean;
  onSave: (addition: TaskAddition) => Promise<void>;
  onEvent?: (event: BrowserExperimentEvent) => void;
};

export function CaptureForm({ ready, blocked = false, onSave, onEvent }: CaptureFormProps) {
  const [capture, setCapture] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAddition, setPendingAddition] = useState<TaskAddition | null>(null);
  const [message, setMessage] = useState("");
  const [needsClarification, setNeedsClarification] = useState(false);
  const inFlight = useRef(false);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || inFlight.current || (blocked && !pendingAddition) || !capture.trim()) return;
    inFlight.current = true;
    setIsInterpreting(!pendingAddition);
    setMessage("");
    setNeedsClarification(false);
    const originalCapture = capture;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);
    let addition = pendingAddition;
    try {
      if (!addition) {
        onEvent?.({ name: "capture_submitted" });
        const response = await fetch("/api/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capture: originalCapture }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Capture failed");
        const result = parseCaptureResult(await response.json());
        if (result.status === "clarify") {
          onEvent?.({ name: "capture_clarification_requested" });
          setMessage(result.message);
          setNeedsClarification(true);
          return;
        }
        addition = { requestId: crypto.randomUUID(), tasks: result.tasks, originalCapture };
        setPendingAddition(addition);
      }
      clearTimeout(timeout);
      setIsInterpreting(false);
      setIsSaving(true);
      await saveRef.current(addition);
      setPendingAddition(null);
      setCapture("");
      setMessage(`Added ${addition.tasks.length} ${addition.tasks.length === 1 ? "task" : "tasks"}.`);
    } catch (failure) {
      onEvent?.({ name: "capture_failed", stage: addition ? "persistence" : "interpretation" });
      if (failure instanceof TaskApiError && failure.status === 400) {
        setPendingAddition(null);
        setMessage("The task details could not be saved. Your text is still here. Try again or use Add task.");
      } else {
        setMessage(addition
          ? "Could not confirm this capture was saved. Your text is still here. Use Retry save to retry the same tasks."
          : "Could not save this capture. Your text is still here. Try again or use Add task.");
      }
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      setIsInterpreting(false);
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-ds-3" aria-busy={isInterpreting || isSaving}>
      {needsClarification ? (
        <div
          id="capture-status"
          role="status"
          className="space-y-ds-1 rounded-control border border-status-warning-border bg-status-warning-surface p-ds-4 text-status-warning-text"
        >
          <h3 className="text-component-title">Needs clarification</h3>
          <p className="text-body">{message}</p>
        </div>
      ) : null}
      <label htmlFor="capture" className="block text-label text-content-secondary">
        Capture what you need to do
      </label>
      <textarea
        id="capture"
        value={capture}
        onChange={(event) => setCapture(event.target.value)}
        maxLength={MAX_CAPTURE_LENGTH}
        rows={3}
        disabled={isInterpreting || isSaving || pendingAddition !== null}
        aria-describedby="capture-help capture-status"
        placeholder="One intention or a short brain dump…"
        className={`${controlClassName} py-ds-3 placeholder:text-content-muted`}
      />
      <p id="capture-help" className="text-metadata text-content-muted">
        Capture sends your text to OpenAI for AI interpretation and estimates missing task details. This adds tasks; it does not schedule reminders or calendar events. <Link href="/privacy" className="underline">Privacy</Link>
      </p>
      <Button type="submit" variant="primary" disabled={!ready || isInterpreting || isSaving || (blocked && !pendingAddition) || !capture.trim()}>
        {isInterpreting ? "Interpreting…" : isSaving ? "Saving…" : pendingAddition ? "Retry save" : "Capture"}
      </Button>
      {!needsClarification ? (
        <p id="capture-status" role="status" className="text-body-small text-content-secondary">
          {message}
        </p>
      ) : null}
    </form>
  );
}
