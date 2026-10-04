"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CurrentContextSection } from "@/components/current-context-section";
import { RecommendationSection } from "@/components/recommendation-section";
import { TasksSection } from "@/components/tasks-section";
import { Button } from "@/components/ui/button";
import { defaultContext } from "@/lib/whatnext-data";
import type { CurrentContext } from "@/lib/whatnext-data";
import { createDurableTasks } from "@/lib/durable-tasks";
import type { TaskState } from "@/lib/durable-tasks";

export function TaskWorkspace({ isCurrentUser }: { isCurrentUser: () => boolean }) {
  const [context, setContext] = useState<CurrentContext>(defaultContext);
  const [state, setState] = useState<TaskState>({ tasks: null, loading: true, refreshing: false, busy: false, error: "", unauthorized: false, unresolvedAddition: false });
  const controllerRef = useRef<ReturnType<typeof createDurableTasks> | null>(null);
  const identityCheckRef = useRef(isCurrentUser);
  identityCheckRef.current = isCurrentUser;
  useEffect(() => {
    const controller = createDurableTasks(setState, undefined, () => identityCheckRef.current());
    controllerRef.current = controller;
    void controller.refresh();
    const onFocus = () => { void controller.refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { controller.dispose(); controllerRef.current = null; window.removeEventListener("focus", onFocus); };
  }, []);
  if (state.unauthorized) return <p role="alert">Sign in to continue. <Link href="/sign-in" className="underline">Sign in</Link></p>;
  return (
    <section className="flex flex-col gap-ds-6">
      <CurrentContextSection context={context} setContext={setContext} />
      {state.tasks === null ? (
        <section className="rounded-card border border-line bg-surface-primary p-ds-5" aria-busy={state.loading}>
          <h2 className="text-section-title">Your Tasks</h2>
          <p role="status">{state.loading ? "Loading tasks and recommendations…" : state.error}</p>
          {!state.loading ? <Button onClick={() => void controllerRef.current?.refresh()}>Retry</Button> : null}
        </section>
      ) : (
        <>
          <RecommendationSection tasks={state.tasks} context={context} />
          <div className="flex flex-wrap items-center gap-ds-3">
            <Button disabled={state.busy} isLoading={state.refreshing} loadingLabel="Refreshing tasks" onClick={() => void controllerRef.current?.refresh()}>Refresh tasks</Button>
            <p role="status" className="text-body-small text-content-secondary">{state.error}</p>
          </div>
          <TasksSection tasks={state.tasks} busy={state.busy} unresolvedAddition={state.unresolvedAddition}
            onAdd={addition => controllerRef.current!.add(addition)}
            onEditTask={(id, draft) => controllerRef.current!.edit(id, draft)}
            onDeleteTask={id => controllerRef.current!.delete(id)} />
        </>
      )}
    </section>
  );
}
