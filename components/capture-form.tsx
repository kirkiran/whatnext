"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/control-styles";
import { MAX_CAPTURE_LENGTH, parseCaptureResult } from "@/lib/capture";
import type { CaptureTaskDraft } from "@/lib/capture";

type CaptureFormProps = {
  ready: boolean;
  onSave: (drafts: CaptureTaskDraft[], originalCapture: string) => void;
};

export function CaptureForm({ ready, onSave }: CaptureFormProps) {
  const [capture, setCapture] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || inFlight.current || !capture.trim()) return;
    inFlight.current = true;
    setIsInterpreting(true);
    setMessage("");
    const originalCapture = capture;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);
    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capture: originalCapture }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Capture failed");
      const result = parseCaptureResult(await response.json());
      if (result.status === "clarify") {
        setMessage(result.message);
        return;
      }
      saveRef.current(result.tasks, originalCapture);
      setCapture("");
      setMessage(`Added ${result.tasks.length} ${result.tasks.length === 1 ? "task" : "tasks"}.`);
    } catch {
      setMessage("Could not save this capture. Your text is still here. Try again or use Add task.");
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      setIsInterpreting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-ds-3" aria-busy={isInterpreting}>
      <label htmlFor="capture" className="block text-label text-content-secondary">
        Capture what you need to do
      </label>
      <textarea
        id="capture"
        value={capture}
        onChange={(event) => setCapture(event.target.value)}
        maxLength={MAX_CAPTURE_LENGTH}
        rows={3}
        disabled={isInterpreting}
        aria-describedby="capture-help capture-status"
        placeholder="One intention or a short brain dump…"
        className={`${controlClassName} py-ds-3 placeholder:text-content-muted`}
      />
      <p id="capture-help" className="text-metadata text-content-muted">
        EegEnu interprets task details and estimates what’s missing. This adds tasks; it does not schedule reminders or calendar events.
      </p>
      <Button type="submit" variant="primary" disabled={!ready || isInterpreting || !capture.trim()}>
        {isInterpreting ? "Interpreting…" : "Capture"}
      </Button>
      <p id="capture-status" role="status" className="text-body-small text-content-secondary">
        {message}
      </p>
    </form>
  );
}
