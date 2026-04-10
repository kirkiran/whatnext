export type PriorityLevel = "low" | "medium" | "high";
export type TaskContextTag = "flexible" | "desk" | "home" | "outside";
export type LocationOption = "home" | "desk" | "outside";

export type Task = {
  id: number;
  name: string;
  duration: number;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  energyRequired: PriorityLevel;
  contextTag: TaskContextTag;
};

export type TaskFormValues = {
  name: string;
  duration: string;
  urgency: PriorityLevel;
  importance: PriorityLevel;
  energyRequired: PriorityLevel;
  contextTag: TaskContextTag;
};

export type CurrentContext = {
  timeAvailable: string;
  currentEnergy: PriorityLevel;
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
    energyRequired: "low",
    contextTag: "home",
  },
  {
    id: 2,
    name: "Reply to school email",
    duration: 15,
    urgency: "medium",
    importance: "high",
    energyRequired: "medium",
    contextTag: "desk",
  },
  {
    id: 3,
    name: "Take a quick walk with the stroller",
    duration: 20,
    urgency: "low",
    importance: "medium",
    energyRequired: "medium",
    contextTag: "outside",
  },
];

export const defaultTaskFormValues: TaskFormValues = {
  name: "",
  duration: "15",
  urgency: "medium",
  importance: "medium",
  energyRequired: "medium",
  contextTag: "flexible",
};

export const defaultContext: CurrentContext = {
  timeAvailable: "20",
  currentEnergy: "medium",
  interruptionRisk: "medium",
  location: "home",
};

export const priorityOptions: PriorityLevel[] = ["low", "medium", "high"];
export const taskContextOptions: TaskContextTag[] = ["flexible", "desk", "home", "outside"];
export const locationOptions: LocationOption[] = ["home", "desk", "outside"];
export const timeOptions = ["10", "15", "20", "30", "45", "60", "90"];

export function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
