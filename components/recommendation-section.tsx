"use client";

import { useEffect, useMemo, useState } from "react";
import { Surface } from "@/components/ui/surface";
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
    <section className="rounded-card border border-line bg-surface-primary p-ds-5 sm:p-ds-6">
      <div className="flex flex-col gap-ds-6">
        <div className="space-y-ds-2">
          <h2 className="text-section-title text-content-primary">
            Step 3: Your recommended next action
          </h2>
          <p className="text-body-small text-content-secondary">
            Based on your tasks and current situation, here is the next best step.
          </p>
        </div>

        {recommendation ? (
          <div className="space-y-ds-6 border-t border-line-subtle pt-ds-6">
            <Surface variant="recommendation" className="p-ds-5 sm:p-ds-6">
              <div className="space-y-ds-5">
                <div className="space-y-ds-2">
                  <p className="text-eyebrow uppercase text-content-brand">
                    Recommended next action
                  </p>
                  <h3 className="text-recommendation-title text-content-primary">
                    {getRecommendationTitle(recommendation.primaryTask)}
                  </h3>
                  <p className="max-w-2xl text-body text-content-secondary">
                    {recommendation.primaryTask.flags.isProgressRecommendation
                      ? "A good window to make meaningful progress, even if you may not finish it now."
                      : "A strong fit for the time and context you have right now."}
                  </p>
                </div>

                <dl className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-5">
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
                    value={formatTaskContextLabel(
                      recommendation.primaryTask.task.contextTag,
                    )}
                  />
                </dl>
              </div>
            </Surface>

            <div className="space-y-ds-2 border-t border-line-subtle pt-ds-5">
              <p className="text-eyebrow uppercase text-content-muted">
                Why this task
              </p>
              <p className="max-w-3xl text-body text-content-secondary">
                {explanations?.primaryExplanation ?? ""}
              </p>
            </div>

            {recommendation.suggestedPlanTasks.length > 0 ? (
              <div className="border-t border-line-subtle pt-ds-6">
                <div className="space-y-ds-4">
                  <div className="space-y-ds-1">
                    <p className="text-eyebrow uppercase text-content-muted">
                      Suggested plan
                    </p>
                    <h3 className="text-component-title text-content-primary">
                      What to consider after the main recommendation
                    </h3>
                    <p className="text-body-small text-content-muted">
                      These next options come from the same rule-based ranking, in order.
                    </p>
                  </div>

                  <div>
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
          <div className="border-t border-line-subtle pt-ds-6">
            <Surface variant="subtle" className="border-dashed p-ds-6">
              <p className="text-component-title text-content-primary">
                No recommendation available
              </p>
              <p className="mt-ds-2 max-w-md text-body-small text-content-secondary">
                No suitable task found for current context
              </p>
            </Surface>
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
    <div className="space-y-ds-1">
      <dt className="text-metadata text-content-muted">{label}</dt>
      <dd className="text-body-small text-content-secondary">{value}</dd>
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
    <article className="border-t border-line-subtle py-ds-5">
      <div className="space-y-ds-3">
        <div className="space-y-ds-1">
          <p className="text-eyebrow uppercase text-content-brand">
            Option {index + 1}
          </p>
          <h4 className="text-component-title text-content-primary">
            {getRecommendationTitle(recommendation)}
          </h4>
        </div>

        <dl className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-4">
          <RecommendationDetail
            label="Duration"
            value={`${recommendation.task.duration} minutes`}
          />
          <RecommendationDetail
            label="Importance"
            value={formatLabel(recommendation.task.importance)}
          />
          <RecommendationDetail
            label="Where can you do this?"
            value={formatTaskContextLabel(recommendation.task.contextTag)}
          />
          <RecommendationDetail
            label="Focus required"
            value={formatLabel(recommendation.task.focusRequired)}
          />
        </dl>

        <p className="max-w-3xl text-body-small text-content-secondary">
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
    </article>
  );
}
