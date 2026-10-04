const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Recommendations remain complete during render. Exposure effects are not run
// here; their telemetry semantics are tested separately in capture-ui.test.cjs.
const cache = new Map();
let fetchCalls = 0;
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const filename = path.resolve(__dirname, "..", relative);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(source, {
    module: loaded, exports: loaded.exports,
    fetch() { fetchCalls++; throw new Error("Network forbidden"); },
    require(name) {
      if (name === "react") return {
        useMemo: (compute) => compute(),
        useRef: (value) => ({ current: value }),
        useEffect() {},
        useState() { throw new Error("Explanation must be derived during render"); },
      };
      if (name === "react/jsx-runtime") return require(name);
      if (name.startsWith("@/lib/")) return load(`${name.slice(2)}.ts`);
      return new Proxy({}, { get: (_target, key) => key });
    },
  }, { filename });
  cache.set(relative, loaded.exports);
  return loaded.exports;
}

const { getRecommendationResult } = load("lib/recommendation.ts");
const { buildExplanationInput, generateLocalExplanations, buildSuggestedPlanExplanation } = load("lib/explanations.ts");
const { RecommendationSection } = load("components/recommendation-section.tsx");
const context = { timeAvailable: "20", currentFocus: "medium", interruptionRisk: "low", location: "home" };
function task(id, overrides = {}) {
  return { id, name: `Task ${id}`, duration: 15, urgency: "medium", importance: "medium",
    focusRequired: "medium", contextTag: "flexible", readiness: "ready",
    canBeDoneInParts: "no", ...overrides };
}
const ids = (choices) => Array.from(choices, (choice) => choice.task.id);
function textContent(tree) {
  if (tree === null || tree === undefined || typeof tree === "boolean") return "";
  if (typeof tree !== "object") return String(tree);
  if (Array.isArray(tree)) return tree.map(textContent).join(" ");
  return textContent(tree.props?.children);
}

test("empty and ineligible tasks produce no recommendation", () => {
  assert.equal(getRecommendationResult([], context), null);
  assert.equal(getRecommendationResult([
    task(1, { readiness: "blocked" }), task(2, { contextTag: "desk" }),
    task(3, { duration: 21 }),
  ], context), null);
  assert.match(textContent(RecommendationSection({ tasks: [], context })), /Capture something to get started/);
  assert.match(textContent(RecommendationSection({ tasks: [task(1, { readiness: "blocked" })], context })), /No recommendation available/);
});

test("location and time filters allow flexible tasks and partial progress", () => {
  const result = getRecommendationResult([
    task(1, { readiness: "blocked" }), task(2, { contextTag: "outside" }),
    task(3, { duration: 30 }), task(4, { duration: 30, canBeDoneInParts: "yes" }),
    task(5, { contextTag: "home", duration: 20 }),
  ], context);
  assert.equal(result.primaryTask.task.id, 4);
  assert.equal(result.primaryTask.flags.isProgressRecommendation, true);
  assert.equal(result.primaryTask.flags.fitsAvailableTime, false);
  assert.equal(result.backupTask.task.id, 5);
  assert.equal(result.backupTask.flags.fitsAvailableTime, true);
});

test("importance, urgency and stable ties preserve primary, backup and plan order", () => {
  const tasks = [task(1), task(2, { importance: "high" }),
    task(3, { urgency: "high" }), task(4, { importance: "high" })];
  const result = getRecommendationResult(tasks, context);
  assert.equal(result.primaryTask.task.id, 2);
  assert.equal(result.backupTask.task.id, 4);
  assert.deepEqual(ids(result.suggestedPlanTasks), [4, 3]);
  assert.deepEqual(tasks.map((item) => item.id), [1, 2, 3, 4]);
});

test("focus match and interruption risk change ranking using existing rules", () => {
  const focus = getRecommendationResult([task(1, { focusRequired: "high" }), task(2)], context);
  assert.equal(focus.primaryTask.task.id, 2);
  assert.equal(focus.primaryTask.flags.focusMatch, "exact");
  assert.equal(focus.backupTask.flags.focusMatch, "close");
  const tasks = [task(1, { duration: 50, importance: "high", focusRequired: "high" }),
    task(2, { duration: 10, focusRequired: "low" })];
  const roomy = { ...context, timeAvailable: "60", currentFocus: "high" };
  assert.equal(getRecommendationResult(tasks, roomy).primaryTask.task.id, 1);
  const interrupted = getRecommendationResult(tasks, { ...roomy, interruptionRisk: "high" });
  assert.equal(interrupted.primaryTask.task.id, 2);
  assert.equal(interrupted.primaryTask.flags.interruptionImpact, "high_shorter_lower_focus_favored");
});

test("local explanations retain full-task, backup, focus and interruption wording", () => {
  const current = { ...context, interruptionRisk: "high" };
  const result = getRecommendationResult([task(1), task(2)], current);
  const input = buildExplanationInput(result, current);
  const output = generateLocalExplanations(input);
  assert.equal(output.source, "fallback");
  assert.match(output.primaryExplanation, /fits your 20-minute window/);
  assert.match(output.primaryExplanation, /matches your medium focus level/);
  assert.match(output.primaryExplanation, /shorter and lower-focus tasks are favored/);
  assert.match(output.backupExplanation, /A good fallback because it still fits/);
  assert.match(buildSuggestedPlanExplanation(input.backupTask, input.context), /still fits your 20-minute window/);
});

test("partial-progress explanations do not promise completion; absent backup is null", () => {
  const result = getRecommendationResult([task(1, { duration: 40, canBeDoneInParts: "yes" })], context);
  const output = generateLocalExplanations(buildExplanationInput(result, context));
  assert.match(output.primaryExplanation, /make progress in your 20-minute window/);
  assert.match(output.primaryExplanation, /You may not finish this now/);
  assert.equal(output.backupExplanation, null);
  assert.deepEqual(ids(result.suggestedPlanTasks), []);
});

test("render immediately uses local explanations and updates with tasks and context without fetch", () => {
  const tasks = [task(1, { name: "Write report", duration: 40, canBeDoneInParts: "yes" })];
  const initial = textContent(RecommendationSection({ tasks, context }));
  assert.match(initial, /Make progress on Write report/);
  assert.match(initial, /make progress in your 20-minute window/);
  const changed = textContent(RecommendationSection({ tasks, context: { ...context, timeAvailable: "60" } }));
  assert.match(changed, /fits your 60-minute window/);
  assert.doesNotMatch(changed, /Make progress on/);
  const edited = textContent(RecommendationSection({ tasks: [task(2, { name: "Email school" })], context }));
  assert.match(edited, /Email school/);
  assert.doesNotMatch(edited, /Write report/);
  assert.equal(fetchCalls, 0);
});
