"use client";

import { useEffect, useState } from "react";
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            WhatNext
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              WhatNext
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Decide what to do next when your day gets messy
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-8">
          <TasksSection
            tasks={tasks}
            setTasks={setTasks}
            onResetSampleTasks={handleResetSampleTasks}
          />
          <CurrentContextSection context={context} setContext={setContext} />
          <RecommendationSection tasks={tasks} context={context} />
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
