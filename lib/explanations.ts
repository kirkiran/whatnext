import {
  CurrentContext,
  formatLabel,
  formatLocationLabel,
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
    currentFocus: CurrentContext["currentFocus"];
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
      currentFocus: context.currentFocus,
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
  if (recommendation.reasoningFlags.isProgressRecommendation) {
    const reasons = [
      `can still make progress in your ${context.timeAvailable}-minute window`,
    ];

    if (recommendation.reasoningFlags.focusMatch === "exact") {
      reasons.push(`matches your ${context.currentFocus} focus level`);
    } else if (recommendation.reasoningFlags.focusMatch === "close") {
      reasons.push("is still a manageable match for your focus");
    }

    if (recommendation.reasoningFlags.importanceLevel === "high") {
      reasons.push("carries high importance");
    } else if (recommendation.reasoningFlags.urgencyLevel === "high") {
      reasons.push("has high urgency");
    }

    const interruptionSentence = getInterruptionExplanation(
      recommendation.reasoningFlags.interruptionImpact,
    );

    return `Recommended because it ${joinReasons(reasons)}. You may not finish this now, but this is a good window to make meaningful progress.${interruptionSentence}`;
  }

  const reasons = [`fits your ${context.timeAvailable}-minute window`];

  if (recommendation.reasoningFlags.focusMatch === "exact") {
    reasons.push(`matches your ${context.currentFocus} focus level`);
  } else if (recommendation.reasoningFlags.focusMatch === "close") {
    reasons.push("is still a manageable match for your focus");
  }

  if (recommendation.reasoningFlags.importanceLevel === "high") {
    reasons.push("carries high importance");
  } else if (recommendation.reasoningFlags.urgencyLevel === "high") {
    reasons.push("has high urgency");
  }

  if (recommendation.reasoningFlags.practicalChoice) {
    reasons.push(
      `works well for where you are right now (${formatLocationLabel(context.location)})`,
    );
  }

  const interruptionSentence = getInterruptionExplanation(
    recommendation.reasoningFlags.interruptionImpact,
  );

  return `Recommended because it ${joinReasons(reasons)}.${interruptionSentence}`;
}

function buildBackupExplanation(
  backup: ExplanationTaskInput,
  context: ExplanationInput["context"],
) {
  if (backup.reasoningFlags.isProgressRecommendation) {
    const reasons = [
      `can still move forward during your ${context.timeAvailable}-minute window`,
      `gives you an alternative at ${formatLabel(backup.task.importance)} importance`,
    ];

    if (backup.reasoningFlags.focusMatch === "exact") {
      reasons.push("lines up well with your current focus");
    } else if (backup.reasoningFlags.focusMatch === "close") {
      reasons.push("should still feel realistic with your current focus");
    }

    const interruptionSentence = getInterruptionExplanation(
      backup.reasoningFlags.interruptionImpact,
    );

    return `A good fallback because it ${joinReasons(reasons)}. You may not finish this now, but this is a useful chance to make meaningful progress.${interruptionSentence}`;
  }

  const reasons = [
    `still fits your ${context.timeAvailable}-minute window`,
    `gives you an alternative at ${formatLabel(backup.task.importance)} importance`,
  ];

  if (backup.reasoningFlags.focusMatch === "exact") {
    reasons.push("lines up well with your current focus");
  } else if (backup.reasoningFlags.focusMatch === "close") {
    reasons.push("should still feel realistic with your current focus");
  }

  const interruptionSentence = getInterruptionExplanation(
    backup.reasoningFlags.interruptionImpact,
  );

  return `A good fallback because it ${joinReasons(reasons)}.${interruptionSentence}`;
}

function getInterruptionExplanation(
  interruptionImpact: RecommendationChoice["flags"]["interruptionImpact"],
) {
  if (interruptionImpact === "high_shorter_lower_focus_favored") {
    return " Since there's a high chance you'll be interrupted, shorter and lower-focus tasks are favored right now.";
  }

  if (interruptionImpact === "high_shorter_tasks_favored") {
    return " Since there's a high chance you'll be interrupted, shorter tasks are favored right now.";
  }

  if (interruptionImpact === "high_lower_focus_tasks_favored") {
    return " Since there's a high chance you'll be interrupted, lower-focus tasks are favored right now.";
  }

  if (interruptionImpact === "high_interruption_penalty_applied") {
    return " Since there's a high chance you'll be interrupted, longer or high-focus tasks are penalized more heavily right now.";
  }

  if (interruptionImpact === "medium_interruption_penalty_applied") {
    return " With a medium chance of interruption, very long and higher-focus tasks are slightly less practical right now.";
  }

  return "";
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
