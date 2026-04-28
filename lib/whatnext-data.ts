export type PriorityLevel = "low" | "medium" | "high";
export type TaskContextTag = "flexible" | "desk" | "home" | "outside";
export type LocationOption = "home" | "desk" | "outside";
export type TaskReadiness = "ready" | "blocked";
export type PartialProgressOption = "yes" | "no";

export type Task = {
  id: number;
  name: string;
  duration: number;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  focusRequired: PriorityLevel;
  contextTag: TaskContextTag;
  readiness: TaskReadiness;
  canBeDoneInParts: PartialProgressOption;
};

export type TaskFormValues = {
  name: string;
  duration: string;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  focusRequired: PriorityLevel;
  contextTag: TaskContextTag;
  readiness: TaskReadiness;
  canBeDoneInParts: PartialProgressOption;
};

export type CurrentContext = {
  timeAvailable: string;
  currentFocus: PriorityLevel;
  interruptionRisk: PriorityLevel;
  location: LocationOption;
};

export const sampleTasks: Task[] = [
  {
    id: 1,
    name: "Pack daycare bag",
    duration: 10,
    urgency: "high",
    importance: "high",
    focusRequired: "low",
    contextTag: "home",
    readiness: "ready",
    canBeDoneInParts: "no",
  },
  {
    id: 2,
    name: "Reply to school email",
    duration: 15,
    urgency: "medium",
    importance: "high",
    focusRequired: "medium",
    contextTag: "desk",
    readiness: "blocked",
    canBeDoneInParts: "no",
  },
  {
    id: 3,
    name: "Take a quick walk with the stroller",
    duration: 20,
    urgency: "low",
    importance: "medium",
    focusRequired: "medium",
    contextTag: "outside",
    readiness: "ready",
    canBeDoneInParts: "yes",
  },
];

export const defaultTaskFormValues: TaskFormValues = {
  name: "",
  duration: "15",
  urgency: "medium",
  importance: "medium",
  focusRequired: "medium",
  contextTag: "flexible",
  readiness: "ready",
  canBeDoneInParts: "no",
};

export const defaultContext: CurrentContext = {
  timeAvailable: "20",
  currentFocus: "medium",
  interruptionRisk: "medium",
  location: "home",
};

export const priorityOptions: PriorityLevel[] = ["low", "medium", "high"];
export const taskContextOptions: TaskContextTag[] = ["flexible", "desk", "home", "outside"];
export const readinessOptions: TaskReadiness[] = ["ready", "blocked"];
export const partialProgressOptions: PartialProgressOption[] = ["yes", "no"];
export const locationOptions: LocationOption[] = ["home", "desk", "outside"];
export const timeOptions = ["10", "15", "20", "30", "45", "60", "90"];

export function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatTaskContextLabel(value: TaskContextTag) {
  if (value === "flexible") {
    return "Anywhere";
  }

  if (value === "home") {
    return "At home";
  }

  if (value === "desk") {
    return "At desk";
  }

  return "Outside";
}

export function formatLocationLabel(value: LocationOption) {
  if (value === "home") {
    return "At home";
  }

  if (value === "desk") {
    return "At desk";
  }

  return "Outside";
}

export function getPriorityValue(value: PriorityLevel) {
  if (value === "low") {
    return 1;
  }

  if (value === "medium") {
    return 2;
  }

  return 3;
}
