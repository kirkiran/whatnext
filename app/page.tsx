"use client";

import { useState } from "react";
import { CurrentContextSection } from "@/components/current-context-section";
import { RecommendationSection } from "@/components/recommendation-section";
import { TasksSection } from "@/components/tasks-section";
import { defaultContext, sampleTasks } from "@/lib/whatnext-data";
import type { CurrentContext, Task } from "@/lib/whatnext-data";

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [context, setContext] = useState<CurrentContext>(defaultContext);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
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

        <section className="grid gap-6 xl:grid-cols-12 xl:items-start">
          <div className="xl:col-span-4">
            <TasksSection tasks={tasks} setTasks={setTasks} />
          </div>
          <div className="xl:col-span-3">
            <CurrentContextSection context={context} setContext={setContext} />
          </div>
          <div className="xl:col-span-5">
            <RecommendationSection tasks={tasks} context={context} />
          </div>
        </section>
      </div>
    </main>
  );
}
