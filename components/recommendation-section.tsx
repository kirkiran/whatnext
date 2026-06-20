"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CurrentContext,
  formatLabel,
  formatTaskContextLabel,
  Task,
} from "@/lib/whatnext-data";
import {
  buildExplanationInput,
  buildSuggestedPlanExplanation,
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
          <h2 className="text-xl font-semibold text-slate-950">
            Step 3: Your recommended next action
          </h2>
          <p className="text-sm text-slate-500">
            Based on your tasks and current situation, here is the next best step.
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
                      {getRecommendationTitle(recommendation.primaryTask)}
                    </h3>
                    <p className="max-w-xl text-sm leading-6 text-slate-600">
                      {recommendation.primaryTask.flags.isProgressRecommendation
                        ? "A good window to make meaningful progress, even if you may not finish it now."
                        : "A strong fit for the time and context you have right now."}
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
                      label="Focus required"
                      value={formatLabel(recommendation.primaryTask.task.focusRequired)}
                    />
                    <RecommendationDetail
                      label="Where can you do this?"
                      value={formatTaskContextLabel(recommendation.primaryTask.task.contextTag)}
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

            {recommendation.suggestedPlanTasks.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Suggested plan
                    </p>
                    <h3 className="text-base font-semibold text-slate-900">
                      What to consider after the main recommendation
                    </h3>
                    <p className="text-sm leading-6 text-slate-600">
                      These next options come from the same rule-based ranking, in order.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {recommendation.suggestedPlanTasks.map((taskChoice, index) => (
                      <SuggestedPlanItem
                        key={taskChoice.task.id}
                        index={index}
                        recommendation={taskChoice}
                        context={context}
                      />
                    ))}
                  </div>
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

function getRecommendationTitle(recommendation: {
  task: Task;
  flags: { isProgressRecommendation: boolean };
}) {
  if (recommendation.flags.isProgressRecommendation) {
    return `Make progress on ${recommendation.task.name}`;
  }

  return recommendation.task.name;
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

type SuggestedPlanItemProps = {
  index: number;
  recommendation: {
    task: Task;
    flags: {
      fitsAvailableTime: boolean;
      isProgressRecommendation: boolean;
      focusMatch: "exact" | "close" | "mismatch";
      interruptionImpact:
        | "high_shorter_lower_focus_favored"
        | "high_shorter_tasks_favored"
        | "high_lower_focus_tasks_favored"
        | "high_interruption_penalty_applied"
        | "medium_interruption_penalty_applied"
        | "none";
      urgencyLevel: Task["urgency"];
      importanceLevel: Task["importance"];
      practicalChoice: boolean;
    };
  };
  context: CurrentContext;
};

function SuggestedPlanItem({
  index,
  recommendation,
  context,
}: SuggestedPlanItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Option {index + 1}
          </p>
          <h4 className="text-base font-semibold text-slate-900">
            {getRecommendationTitle(recommendation)}
          </h4>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SecondaryRecommendationDetail
            label="Duration"
            value={`${recommendation.task.duration} minutes`}
          />
          <SecondaryRecommendationDetail
            label="Importance"
            value={formatLabel(recommendation.task.importance)}
          />
          <SecondaryRecommendationDetail
            label="Where can you do this?"
            value={formatTaskContextLabel(recommendation.task.contextTag)}
          />
          <SecondaryRecommendationDetail
            label="Focus required"
            value={formatLabel(recommendation.task.focusRequired)}
          />
        </div>

        <p className="text-sm leading-6 text-slate-600">
          {buildSuggestedPlanExplanation(
            {
              task: recommendation.task,
              reasoningFlags: recommendation.flags,
            },
            {
              timeAvailable: context.timeAvailable,
              currentFocus: context.currentFocus,
              interruptionRisk: context.interruptionRisk,
              location: context.location,
            },
          )}
        </p>
      </div>
    </div>
  );
}
