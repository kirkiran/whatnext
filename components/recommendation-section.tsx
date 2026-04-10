"use client";

import { useEffect, useMemo, useState } from "react";
import { CurrentContext, formatLabel, Task } from "@/lib/whatnext-data";
import {
  buildExplanationInput,
  generateLocalExplanations,
} from "@/lib/explanations";
import type { ExplanationOutput } from "@/lib/explanations";
import { getRecommendationResult } from "@/lib/recommendation";

type RecommendationSectionProps = {
  tasks: Task[];
  context: CurrentContext;
};

export function RecommendationSection({
  tasks,
  context,
}: RecommendationSectionProps) {
  const recommendation = useMemo(
    () => getRecommendationResult(tasks, context),
    [tasks, context],
  );
  const [explanations, setExplanations] = useState<ExplanationOutput | null>(null);

  const explanationInput = useMemo(
    () => (recommendation ? buildExplanationInput(recommendation, context) : null),
    [recommendation, context],
  );

  const explanationKey = explanationInput ? JSON.stringify(explanationInput) : "";

  useEffect(() => {
    if (!explanationInput) {
      setExplanations(null);
      return;
    }

    const fallbackExplanations = generateLocalExplanations(explanationInput);
    const controller = new AbortController();

    setExplanations(fallbackExplanations);

    async function loadExplanations() {
      try {
        const response = await fetch("/api/explanations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(explanationInput),
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ExplanationOutput;
        setExplanations(data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
      }
    }

    loadExplanations();

    return () => {
      controller.abort();
    };
  }, [explanationInput, explanationKey]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex h-full flex-col gap-5">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-900">Recommendation</h2>
          <p className="text-sm text-slate-500">
            The best next task based on your current context.
          </p>
        </div>

        {recommendation ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Recommended next action
              </p>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                      {recommendation.primaryTask.task.name}
                    </h3>
                    <p className="max-w-xl text-sm leading-6 text-slate-600">
                      A strong fit for the time and context you have right now.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <RecommendationDetail
                      label="Estimated duration"
                      value={`${recommendation.primaryTask.task.duration} minutes`}
                    />
                    <RecommendationDetail
                      label="Urgency"
                      value={formatLabel(recommendation.primaryTask.task.urgency)}
                    />
                    <RecommendationDetail
                      label="Importance"
                      value={formatLabel(recommendation.primaryTask.task.importance)}
                    />
                    <RecommendationDetail
                      label="Energy required"
                      value={formatLabel(recommendation.primaryTask.task.energyRequired)}
                    />
                    <RecommendationDetail
                      label="Context tag"
                      value={formatLabel(recommendation.primaryTask.task.contextTag)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Why this task
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {explanations?.primaryExplanation ?? ""}
              </p>
            </div>

            {recommendation.backupTask ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Backup option
                    </p>
                    <h3 className="text-base font-semibold text-slate-900">
                      {recommendation.backupTask.task.name}
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <SecondaryRecommendationDetail
                      label="Estimated duration"
                      value={`${recommendation.backupTask.task.duration} minutes`}
                    />
                    <SecondaryRecommendationDetail
                      label="Urgency"
                      value={formatLabel(recommendation.backupTask.task.urgency)}
                    />
                    <SecondaryRecommendationDetail
                      label="Importance"
                      value={formatLabel(recommendation.backupTask.task.importance)}
                    />
                    <SecondaryRecommendationDetail
                      label="Energy required"
                      value={formatLabel(recommendation.backupTask.task.energyRequired)}
                    />
                    <SecondaryRecommendationDetail
                      label="Context tag"
                      value={formatLabel(recommendation.backupTask.task.contextTag)}
                    />
                  </div>

                  <p className="text-sm leading-6 text-slate-600">
                    {explanations?.backupExplanation ??
                      "A good fallback if you have slightly more capacity or want an alternative."}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-900">No recommendation available</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              No suitable task found for current context
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type RecommendationDetailProps = {
  label: string;
  value: string;
};

function RecommendationDetail({ label, value }: RecommendationDetailProps) {
  return (
    <div className="rounded-2xl bg-white p-3.5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SecondaryRecommendationDetail({ label, value }: RecommendationDetailProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
