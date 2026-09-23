"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { CurrentContextSection } from "@/components/current-context-section";
import { RecommendationSection } from "@/components/recommendation-section";
import { TasksSection } from "@/components/tasks-section";
import { defaultContext, sampleTasks } from "@/lib/whatnext-data";
import type { CurrentContext, Task } from "@/lib/whatnext-data";

const TASKS_STORAGE_KEY = "whatnext.tasks";
const CONTEXT_STORAGE_KEY = "whatnext.context";

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [context, setContext] = useState<CurrentContext>(defaultContext);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    const savedTasks = readStoredTasks();
    const savedContext = readStoredContext();

    if (savedTasks) {
      setTasks(savedTasks);
    }

    if (savedContext) {
      setContext(savedContext);
    }

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [hasLoadedStorage, tasks]);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    window.localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(context));
  }, [context, hasLoadedStorage]);

  function handleResetSampleTasks() {
    setTasks(sampleTasks);
    setContext(defaultContext);
    window.localStorage.removeItem(TASKS_STORAGE_KEY);
    window.localStorage.removeItem(CONTEXT_STORAGE_KEY);
  }

  return (
    <main className="min-h-screen bg-canvas px-ds-4 py-ds-6 text-content-primary sm:px-ds-6 sm:py-ds-8 lg:px-ds-8 lg:py-ds-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-ds-8">
        <AppHeader />

        <section className="flex flex-col gap-ds-6">
          <CurrentContextSection context={context} setContext={setContext} />
          <RecommendationSection tasks={tasks} context={context} />
          <TasksSection
            tasks={tasks}
            setTasks={setTasks}
            onResetSampleTasks={handleResetSampleTasks}
          />
        </section>
      </div>
    </main>
  );
}

function readStoredTasks() {
  try {
    const savedTasks = window.localStorage.getItem(TASKS_STORAGE_KEY);

    if (!savedTasks) {
      return null;
    }

    const parsedTasks = JSON.parse(savedTasks);

    return Array.isArray(parsedTasks) ? (parsedTasks as Task[]) : null;
  } catch {
    return null;
  }
}

function readStoredContext() {
  try {
    const savedContext = window.localStorage.getItem(CONTEXT_STORAGE_KEY);

    if (!savedContext) {
      return null;
    }

    const parsedContext = JSON.parse(savedContext);

    if (!parsedContext || typeof parsedContext !== "object") {
      return null;
    }

    return parsedContext as CurrentContext;
  } catch {
    return null;
  }
}
