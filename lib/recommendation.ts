import {
  CurrentContext,
  getPriorityValue,
  PriorityLevel,
  Task,
} from "@/lib/whatnext-data";

export type RecommendationFlags = {
  fitsAvailableTime: boolean;
  energyMatch: "exact" | "close" | "mismatch";
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
    const fitsTime = task.duration <= availableTime;
    const fitsLocation =
      task.contextTag === "flexible" || task.contextTag === context.location;

    return fitsTime && fitsLocation;
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
      energyMatch: getEnergyMatchLabel(task.energyRequired, context.currentEnergy),
      urgencyLevel: task.urgency,
      importanceLevel: task.importance,
      practicalChoice: isPracticalChoice(task, context),
    },
  };
}

function getTaskScore(task: Task, context: CurrentContext) {
  const importanceScore = getPriorityValue(task.importance) * 3;
  const urgencyScore = getPriorityValue(task.urgency) * 2;
  const energyScore = getEnergyMatchScore(task.energyRequired, context.currentEnergy) * 2;
  const interruptionScore =
    getInterruptionFitScore(task.duration, context.interruptionRisk) * 1;

  return importanceScore + urgencyScore + energyScore + interruptionScore;
}

function getEnergyMatchScore(
  taskEnergy: Task["energyRequired"],
  currentEnergy: PriorityLevel,
) {
  const difference = Math.abs(
    getPriorityValue(taskEnergy) - getPriorityValue(currentEnergy),
  );

  if (difference === 0) {
    return 3;
  }

  if (difference === 1) {
    return 1;
  }

  return 0;
}

function getInterruptionFitScore(duration: number, interruptionRisk: PriorityLevel) {
  if (interruptionRisk === "high" && duration <= 20) {
    return 2;
  }

  return 0;
}

function getEnergyMatchLabel(
  taskEnergy: Task["energyRequired"],
  currentEnergy: PriorityLevel,
): RecommendationFlags["energyMatch"] {
  const difference = Math.abs(
    getPriorityValue(taskEnergy) - getPriorityValue(currentEnergy),
  );

  if (difference === 0) {
    return "exact";
  }

  if (difference === 1) {
    return "close";
  }

  return "mismatch";
}

function isPracticalChoice(task: Task, context: CurrentContext) {
  const fitsLocation =
    task.contextTag === "flexible" || task.contextTag === context.location;
  const interruptionFriendly =
    context.interruptionRisk !== "high" || task.duration <= 20;

  return fitsLocation && interruptionFriendly;
}
