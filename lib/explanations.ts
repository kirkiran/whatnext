import {
  CurrentContext,
  formatLabel,
  Task,
} from "@/lib/whatnext-data";
import {
  RecommendationChoice,
  RecommendationResult,
} from "@/lib/recommendation";

export type ExplanationInput = {
  recommendedTask: ExplanationTaskInput;
  backupTask: ExplanationTaskInput | null;
  context: {
    timeAvailable: string;
    currentEnergy: CurrentContext["currentEnergy"];
    interruptionRisk: CurrentContext["interruptionRisk"];
    location: CurrentContext["location"];
  };
};

export type ExplanationTaskInput = {
  task: Task;
  reasoningFlags: RecommendationChoice["flags"];
};

export type ExplanationOutput = {
  primaryExplanation: string;
  backupExplanation: string | null;
  source: "ai" | "fallback";
};

export function buildExplanationInput(
  recommendation: RecommendationResult,
  context: CurrentContext,
): ExplanationInput {
  return {
    recommendedTask: {
      task: recommendation.primaryTask.task,
      reasoningFlags: recommendation.primaryTask.flags,
    },
    backupTask: recommendation.backupTask
      ? {
          task: recommendation.backupTask.task,
          reasoningFlags: recommendation.backupTask.flags,
        }
      : null,
    context: {
      timeAvailable: context.timeAvailable,
      currentEnergy: context.currentEnergy,
      interruptionRisk: context.interruptionRisk,
      location: context.location,
    },
  };
}

export function generateLocalExplanations(
  input: ExplanationInput,
): ExplanationOutput {
  return {
    primaryExplanation: buildPrimaryExplanation(input.recommendedTask, input.context),
    backupExplanation: input.backupTask
      ? buildBackupExplanation(input.backupTask, input.context)
      : null,
    source: "fallback",
  };
}

function buildPrimaryExplanation(
  recommendation: ExplanationTaskInput,
  context: ExplanationInput["context"],
) {
  const reasons = [`fits your ${context.timeAvailable}-minute window`];

  if (recommendation.reasoningFlags.energyMatch === "exact") {
    reasons.push(`matches your ${context.currentEnergy} energy level`);
  } else if (recommendation.reasoningFlags.energyMatch === "close") {
    reasons.push("is still a manageable match for your energy");
  }

  if (recommendation.reasoningFlags.importanceLevel === "high") {
    reasons.push("carries high importance");
  } else if (recommendation.reasoningFlags.urgencyLevel === "high") {
    reasons.push("has high urgency");
  }

  if (recommendation.reasoningFlags.practicalChoice) {
    reasons.push(`works well for your current ${context.location} context`);
  }

  return `Recommended because it ${joinReasons(reasons)}.`;
}

function buildBackupExplanation(
  backup: ExplanationTaskInput,
  context: ExplanationInput["context"],
) {
  const reasons = [
    `still fits your ${context.timeAvailable}-minute window`,
    `gives you an alternative at ${formatLabel(backup.task.importance)} importance`,
  ];

  if (backup.reasoningFlags.energyMatch === "exact") {
    reasons.push("lines up well with your current energy");
  } else if (backup.reasoningFlags.energyMatch === "close") {
    reasons.push("should still feel realistic with your current energy");
  }

  return `A good fallback because it ${joinReasons(reasons)}.`;
}

function joinReasons(reasons: string[]) {
  if (reasons.length === 1) {
    return reasons[0];
  }

  if (reasons.length === 2) {
    return `${reasons[0]} and ${reasons[1]}`;
  }

  const firstReasons = reasons.slice(0, -1).join(", ");
  const lastReason = reasons[reasons.length - 1];

  return `${firstReasons}, and ${lastReason}`;
}
