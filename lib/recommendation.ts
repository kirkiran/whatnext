import {
  CurrentContext,
  getPriorityValue,
  PriorityLevel,
  Task,
} from "@/lib/whatnext-data";

export type RecommendationFlags = {
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
  urgencyLevel: PriorityLevel;
  importanceLevel: PriorityLevel;
  practicalChoice: boolean;
};

export type RecommendationChoice = {
  task: Task;
  flags: RecommendationFlags;
};

export type RecommendationResult = {
  primaryTask: RecommendationChoice;
  backupTask: RecommendationChoice | null;
};

export function getRecommendationResult(
  tasks: Task[],
  context: CurrentContext,
): RecommendationResult | null {
  const availableTime = Number(context.timeAvailable);

  const matchingTasks = tasks.filter((task) => {
    const fitsTime =
      task.duration <= availableTime || task.canBeDoneInParts === "yes";
    const fitsLocation =
      task.contextTag === "flexible" || task.contextTag === context.location;
    const isReady = task.readiness === "ready";

    return fitsTime && fitsLocation && isReady;
  });

  if (matchingTasks.length === 0) {
    return null;
  }

  const rankedTasks = [...matchingTasks].sort(
    (firstTask, secondTask) =>
      getTaskScore(secondTask, context) - getTaskScore(firstTask, context),
  );

  const primaryTask = buildRecommendationChoice(rankedTasks[0], context);
  const backupTask = rankedTasks[1]
    ? buildRecommendationChoice(rankedTasks[1], context)
    : null;

  return {
    primaryTask,
    backupTask,
  };
}

function buildRecommendationChoice(
  task: Task,
  context: CurrentContext,
): RecommendationChoice {
  return {
    task,
    flags: {
      fitsAvailableTime: task.duration <= Number(context.timeAvailable),
      isProgressRecommendation:
        task.duration > Number(context.timeAvailable) &&
        task.canBeDoneInParts === "yes",
      focusMatch: getFocusMatchLabel(task.focusRequired, context.currentFocus),
      interruptionImpact: getInterruptionImpact(task, context),
      urgencyLevel: task.urgency,
      importanceLevel: task.importance,
      practicalChoice: isPracticalChoice(task, context),
    },
  };
}

function getTaskScore(task: Task, context: CurrentContext) {
  const importanceScore = getPriorityValue(task.importance) * 3;
  const urgencyScore = getPriorityValue(task.urgency) * 2;
  const focusScore =
    getFocusMatchScore(task.focusRequired, context.currentFocus) * 2;
  const interruptionScore = getInterruptionAdjustment(task, context);

  return importanceScore + urgencyScore + focusScore + interruptionScore;
}

function getFocusMatchScore(
  taskFocus: Task["focusRequired"],
  currentFocus: PriorityLevel,
) {
  const difference = Math.abs(
    getPriorityValue(taskFocus) - getPriorityValue(currentFocus),
  );

  if (difference === 0) {
    return 3;
  }

  if (difference === 1) {
    return 1;
  }

  return 0;
}

function getInterruptionAdjustment(task: Task, context: CurrentContext) {
  let scoreAdjustment = 0;
  const availableTime = Number(context.timeAvailable);

  if (context.interruptionRisk === "high") {
    if (task.duration <= 20) {
      scoreAdjustment += 3;
    } else if (task.duration <= 30) {
      scoreAdjustment += 1;
    } else if (task.duration <= 45) {
      scoreAdjustment -= 2;
    } else {
      scoreAdjustment -= 5;
    }

    if (task.focusRequired === "high") {
      scoreAdjustment -= 3;
    }

    if (task.duration >= availableTime * 0.9) {
      scoreAdjustment -= 2;
    }
  }

  if (context.interruptionRisk === "medium") {
    if (task.duration > 45) {
      scoreAdjustment -= 2;
    }

    if (task.focusRequired === "high" && task.duration > 30) {
      scoreAdjustment -= 1;
    }
  }

  return scoreAdjustment;
}

function getFocusMatchLabel(
  taskFocus: Task["focusRequired"],
  currentFocus: PriorityLevel,
): RecommendationFlags["focusMatch"] {
  const difference = Math.abs(
    getPriorityValue(taskFocus) - getPriorityValue(currentFocus),
  );

  if (difference === 0) {
    return "exact";
  }

  if (difference === 1) {
    return "close";
  }

  return "mismatch";
}

function getInterruptionImpact(
  task: Task,
  context: CurrentContext,
): RecommendationFlags["interruptionImpact"] {
  const availableTime = Number(context.timeAvailable);

  if (context.interruptionRisk === "high") {
    const favorsShorterTasks = task.duration <= 30;
    const favorsLowerFocus = task.focusRequired !== "high";
    const longTaskPenalty = task.duration > 30;
    const highFocusPenalty = task.focusRequired === "high";
    const timeWindowPenalty = task.duration >= availableTime * 0.9;

    if (favorsShorterTasks && favorsLowerFocus) {
      return "high_shorter_lower_focus_favored";
    }

    if (favorsShorterTasks) {
      return "high_shorter_tasks_favored";
    }

    if (favorsLowerFocus) {
      return "high_lower_focus_tasks_favored";
    }

    if (longTaskPenalty || highFocusPenalty || timeWindowPenalty) {
      return "high_interruption_penalty_applied";
    }
  }

  if (
    context.interruptionRisk === "medium" &&
    (task.duration > 45 ||
      (task.focusRequired === "high" && task.duration > 30))
  ) {
    return "medium_interruption_penalty_applied";
  }

  return "none";
}

function isPracticalChoice(task: Task, context: CurrentContext) {
  const fitsLocation =
    task.contextTag === "flexible" || task.contextTag === context.location;
  const interruptionFriendly =
    context.interruptionRisk !== "high" || task.duration <= 20;

  return fitsLocation && interruptionFriendly;
}
