const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Exercise component handlers with deterministic hook state and mocked I/O.
// JSX children are left unmounted so recommendation effects cannot call an API.
function harness(file, globals = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) effects.push(callback);
      slots[index] = deps;
    },
  };
  const cache = new Map();
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative);
    const filename = path.resolve(__dirname, "..", relative);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const loaded = { exports: {} };
    vm.runInNewContext(source, {
      module: loaded, exports: loaded.exports, Response, AbortController, setTimeout, clearTimeout,
      fetch: () => { throw new Error("Live fetch forbidden"); },
      ...globals,
      require(name) {
        if (name === "react") return hooks;
        if (name === "react/jsx-runtime") return require(name);
        if (name.startsWith("@/lib/")) return load(`${name.slice(2)}.ts`);
        if (name.endsWith("control-styles")) return { controlClassName: "" };
        return new Proxy({}, { get: (_target, key) => key });
      },
    }, { filename });
    cache.set(relative, loaded.exports);
    return loaded.exports;
  }
  const exported = load(file);
  return {
    load,
    render(name, props = {}) { cursor = 0; return exported[name](props); },
    effects() { const pending = effects; effects = []; pending.forEach((effect) => effect()); },
  };
}

function find(tree, type) {
  if (!tree || typeof tree !== "object") return undefined;
  if (tree.type === type) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const match = find(child, type);
    if (match) return match;
  }
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const draft = { name: "Email invoice", duration: 15, urgency: "medium", importance: "medium",
  focusRequired: "medium", contextTag: "flexible", readiness: "ready", canBeDoneInParts: "no" };
const success = (tasks = [draft]) => ({ status: "success", tasks, message: null });
const submit = { preventDefault() {} };
const original = "  Email invoice\nBuy milk  ";

function captureHarness(fetch, onSave) {
  const h = harness("components/capture-form.tsx", { fetch });
  const render = () => h.render("CaptureForm", { ready: true, onSave });
  find(render(), "textarea").props.onChange({ target: { value: original } });
  return { render, submit: () => find(render(), "form").props.onSubmit(submit) };
}

test("single and batch saves preserve source, order, unique IDs, legacy tasks and recommendation behavior", () => {
  const h = harness("lib/captured-tasks.ts", { Date: { now: () => 100 } });
  const { prependCapturedTasks } = h.load("lib/captured-tasks.ts");
  const existing = [{ ...draft, id: 100 }];
  const single = prependCapturedTasks(existing, [draft], original);
  assert.equal(single[0].originalCapture, original);
  const batch = prependCapturedTasks(single, [draft, { ...draft, name: "Buy milk" }], original);
  assert.equal(new Set(batch.map((task) => task.id)).size, 4);
  assert.deepEqual(plain(batch.slice(0, 2).map((task) => task.name)), ["Email invoice", "Buy milk"]);
  assert.ok(batch.slice(0, 2).every((task) => task.originalCapture === original));
  assert.deepEqual(plain(batch.at(-1)), existing[0]);
  assert.deepEqual(plain(JSON.parse(JSON.stringify(batch))), plain(batch));
  const { getRecommendationResult } = h.load("lib/recommendation.ts");
  const { defaultContext } = h.load("lib/whatnext-data.ts");
  const ranked = getRecommendationResult(batch, defaultContext);
  assert.equal(ranked.primaryTask.task.id, batch[0].id);
  const withoutSource = batch.map(({ originalCapture: _source, ...task }) => task);
  const baseline = getRecommendationResult(withoutSource, defaultContext);
  assert.deepEqual(plain(ranked.primaryTask.flags), plain(baseline.primaryTask.flags));
  assert.deepEqual(plain(ranked.suggestedPlanTasks.map((choice) => choice.task.id)), plain(baseline.suggestedPlanTasks.map((choice) => choice.task.id)));
  assert.throws(() => prependCapturedTasks(existing, [draft, { ...draft, duration: 0 }], original));
  assert.throws(() => prependCapturedTasks(existing, [{ ...draft, originalCapture: "model value" }], original));
  assert.equal(existing.length, 1);
});

test("successful request saves exact submitted text before clearing and blocks immediate duplicate submit", async () => {
  let resolve;
  let calls = 0;
  const saves = [];
  const h = captureHarness(async (_url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body), { capture: original });
    return new Promise((done) => { resolve = done; });
  }, (tasks, source) => {
    assert.equal(find(h.render(), "textarea").props.value, original);
    saves.push({ tasks, source });
  });
  const form = find(h.render(), "form");
  const pending = form.props.onSubmit(submit);
  await form.props.onSubmit(submit);
  assert.equal(calls, 1);
  assert.equal(find(h.render(), "textarea").props.disabled, true);
  assert.equal(find(h.render(), "Button").props.children, "Interpreting…");
  resolve(Response.json(success([draft, { ...draft, name: "Buy milk" }])));
  await pending;
  assert.equal(saves.length, 1);
  assert.equal(saves[0].source, original);
  assert.equal(find(h.render(), "textarea").props.value, "");
  assert.equal(find(h.render(), "Button").props.children, "Capture");
  assert.match(JSON.stringify(h.render()), /Added 2 tasks/);
});

test("clarification, HTTP/network/invalid batch and storage errors retain input and save no partial tasks", async () => {
  for (const mode of ["clarify", "http", "network", "invalid", "storage"]) {
    let saves = 0;
    const h = captureHarness(async () => {
      if (mode === "network") throw new Error("offline");
      if (mode === "http") return new Response("error", { status: 502 });
      if (mode === "clarify") return Response.json({ status: "clarify", tasks: [], message: "Please rephrase the intended action." });
      if (mode === "invalid") return Response.json(success([draft, { ...draft, duration: 0 }]));
      return Response.json(success());
    }, () => {
      if (mode === "storage") throw new Error("storage unavailable");
      saves++;
    });
    await h.submit();
    assert.equal(saves, 0);
    assert.equal(find(h.render(), "textarea").props.value, original);
    assert.equal(find(h.render(), "Button").props.disabled, false);
    assert.match(JSON.stringify(h.render()), mode === "clarify" ? /Please rephrase/ : /Try again/);
  }
});

test("page saves through existing localStorage key; failure leaves task state unchanged", () => {
  const stored = new Map([["whatnext.tasks", JSON.stringify([{ ...draft, id: 1 }])]]);
  let fail = false;
  const h = harness("app/page.tsx", { window: { localStorage: {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => { if (fail) throw new Error("quota"); stored.set(key, value); },
  } } });
  h.render("default");
  h.effects();
  let section = find(h.render("default"), "TasksSection");
  assert.equal(section.props.captureReady, true);
  section.props.onSaveCapture([draft], original);
  section = find(h.render("default"), "TasksSection");
  assert.equal(section.props.tasks.length, 2);
  assert.equal(JSON.parse(stored.get("whatnext.tasks"))[0].originalCapture, original);
  fail = true;
  assert.throws(() => section.props.onSaveCapture([draft, draft], original));
  assert.equal(find(h.render("default"), "TasksSection").props.tasks.length, 2);
});

test("manual Add task, captured edit and delete keep existing behavior and original wording", () => {
  let tasks = [{ ...draft, id: 1, originalCapture: original }];
  const h = harness("components/tasks-section.tsx");
  const render = () => h.render("TasksSection", {
    tasks, setTasks: (update) => { tasks = update(tasks); },
    onResetSampleTasks() {}, captureReady: true, onSaveCapture() {},
  });
  find(render(), "TaskList").props.onEdit(tasks[0], { currentTarget: {} });
  find(render(), "TaskForm").props.onChange({ target: { name: "name", value: "Corrected task" } });
  find(render(), "TaskForm").props.onSubmit(submit);
  assert.equal(tasks[0].name, "Corrected task");
  assert.equal(tasks[0].originalCapture, original);
  // The existing Add task button is the second header button.
  function buttons(tree) {
    if (!tree || typeof tree !== "object") return [];
    return [...(tree.type === "Button" ? [tree] : []), ...[tree.props?.children].flat(Infinity).flatMap(buttons)];
  }
  buttons(render())[1].props.onClick();
  find(render(), "TaskForm").props.onChange({ target: { name: "name", value: "Manual task" } });
  find(render(), "TaskForm").props.onSubmit(submit);
  assert.equal(tasks[0].name, "Manual task");
  assert.equal(tasks[0].originalCapture, undefined);
  assert.equal(tasks[0].duration, 15);
  find(render(), "TaskList").props.onDelete(1);
  assert.equal(tasks.length, 1);
});

test("original wording is subordinate disclosure only for captured tasks", () => {
  const h = harness("components/task-list.tsx");
  const props = { editingTaskId: null, isFormOpen: false, onDelete() {}, onEdit() {} };
  assert.equal(find(h.render("TaskList", { ...props, tasks: [{ ...draft, id: 1 }] }), "details"), undefined);
  const details = find(h.render("TaskList", { ...props, tasks: [{ ...draft, id: 1, originalCapture: original }] }), "details");
  assert.equal(find(details, "p").props.children, original);
});
