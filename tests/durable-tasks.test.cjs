const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, fetch = () => { throw new Error("Live fetch forbidden"); }, cache = new Map(), globals = {}) {
  if (cache.has(file)) return cache.get(file);
  const filename = path.resolve(__dirname, "..", file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, Response, AbortController, setTimeout, clearTimeout, fetch,
    ...globals,
    require(name) { return load(`${name.slice(2)}.ts`, fetch, cache, globals); },
  }, { filename });
  cache.set(file, module.exports);
  return module.exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
const draft = { name: "Email invoice", duration: 15.5, urgency: "medium", importance: "high", focusRequired: "low", contextTag: "flexible", readiness: "ready", canBeDoneInParts: "yes" };
const original = "  Email invoice\n";
const addition = { requestId: "1f74921f-177a-4ed3-b215-43773d631c3e", tasks: [draft, { ...draft, name: "Buy milk" }], originalCapture: original };
const tasks = addition.tasks.map((task, index) => ({ ...task, id: 7 + index, originalCapture: original }));
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(api) {
  let state;
  const module = load("lib/durable-tasks.ts");
  const controller = module.createDurableTasks(value => { state = plain(value); }, api);
  return { controller, state: () => state };
}

test("API preserves full metadata, source and server IDs/order and rejects unconfirmed responses", async () => {
  const calls = [];
  let response = { tasks };
  const { taskApi, TaskApiError } = load("lib/task-api.ts", async (url, options) => {
    calls.push({ url, options }); return Response.json(response);
  });
  assert.deepEqual(plain(await taskApi.add(addition)), tasks);
  assert.deepEqual(JSON.parse(calls[0].options.body), addition);
  assert.equal(calls[0].options.cache, "no-store");
  for (const invalid of [{ tasks: tasks.slice(0, 1) }, { tasks: [...tasks].reverse() },
    { tasks: tasks.map(task => ({ ...task, originalCapture: "changed" })) },
    { tasks: [{ ...tasks[0], id: 9007199254740992 }, tasks[1]] },
    { tasks: [{ ...tasks[0], duration: 0 }, tasks[1]] }, { tasks: [tasks[0], tasks[0]] }]) {
    response = invalid;
    await assert.rejects(() => taskApi.add(addition));
  }
  response = { task: tasks[0] };
  assert.deepEqual(plain(await taskApi.edit(7, draft)), tasks[0]);
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), draft);
  await assert.rejects(() => taskApi.edit(8, draft));
  await assert.rejects(() => taskApi.edit(7, { ...draft, name: "different" }));
  response = { deleted: false };
  await assert.rejects(() => taskApi.delete(7));
  const failed = load("lib/task-api.ts", async () => new Response("", { status: 401 }));
  await assert.rejects(() => failed.taskApi.list(), error => error instanceof failed.TaskApiError && error.status === 401);
  assert.ok(TaskApiError);
});

test("task request timeout aborts uncertain saving and always clears its timer", async () => {
  let abort, cleared = 0;
  const { taskApi } = load("lib/task-api.ts", async (_url, options) => {
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("timeout")));
      abort();
    });
  }, new Map(), {
    setTimeout(callback, delay) { assert.equal(delay, 20000); abort = callback; return 1; },
    clearTimeout(id) { assert.equal(id, 1); cleared++; },
  });
  await assert.rejects(() => taskApi.add(addition), /timeout/);
  assert.equal(cleared, 1);
});

test("initial loading, failed load, empty success and failed freshness are distinct", async () => {
  const first = deferred(); let list = () => first.promise;
  const h = setup({ list: () => list() });
  const initial = h.controller.refresh();
  assert.equal(h.state().loading, true); assert.equal(h.state().tasks, null);
  first.reject(new Error("offline")); await initial;
  assert.equal(h.state().loading, false); assert.equal(h.state().tasks, null);
  assert.match(h.state().error, /Could not load/);
  list = async () => []; await h.controller.refresh();
  assert.deepEqual(h.state().tasks, []); assert.equal(h.state().error, "");
  list = async () => { throw new Error("offline"); }; await h.controller.refresh();
  assert.deepEqual(h.state().tasks, []); assert.match(h.state().error, /last confirmed/);
});

test("addition retry reuses snapshot, publishes POST batch order and deduplicates without GET", async () => {
  let lists = 0, fail = true; const bodies = [];
  const h = setup({ list: async () => { lists++; return [tasks[0]]; }, add: async value => {
    bodies.push(plain(value)); if (fail) throw new Error("lost response"); return tasks;
  } });
  await h.controller.refresh();
  await assert.rejects(() => h.controller.add(addition));
  assert.deepEqual(h.state().tasks, [tasks[0]]); assert.equal(h.state().unresolvedAddition, true);
  await assert.rejects(() => h.controller.edit(7, draft));
  await assert.rejects(() => h.controller.delete(7));
  await assert.rejects(() => h.controller.add({ ...addition, requestId: "different" }));
  fail = false; await h.controller.add(addition);
  assert.deepEqual(h.state().tasks, tasks); assert.equal(h.state().unresolvedAddition, false);
  assert.deepEqual(bodies[0], bodies[1]); assert.equal(lists, 1);
});

test("stale GET cannot overwrite mutation; overlapping writes are rejected and focus refresh is deferred", async () => {
  const oldRead = deferred(), write = deferred(); let lists = 0;
  const h = setup({ list: async () => { lists++; return lists === 2 ? oldRead.promise : tasks; }, add: () => write.promise });
  await h.controller.refresh();
  const stale = h.controller.refresh();
  const saving = h.controller.add(addition);
  await assert.rejects(() => h.controller.add(addition));
  await h.controller.refresh(); assert.equal(lists, 2);
  write.resolve(tasks); await saving; await tick();
  assert.equal(lists, 3);
  oldRead.resolve([]); await stale;
  assert.deepEqual(h.state().tasks, tasks);
});

test("disposal ignores old-account results and rejects subsequent operations", async () => {
  const read = deferred(); let published = 0;
  const { createDurableTasks } = load("lib/durable-tasks.ts");
  const controller = createDurableTasks(() => { published++; }, { list: () => read.promise });
  const pending = controller.refresh(); const before = published;
  controller.dispose(); read.resolve(tasks); await pending;
  assert.equal(published, before);
  await assert.rejects(() => controller.add(addition));
  const write = deferred(); const h = setup({ list: async () => [], add: () => write.promise });
  await h.controller.refresh(); const saving = h.controller.add(addition);
  h.controller.dispose(); const state = h.state(); write.resolve(tasks); await saving;
  assert.deepEqual(h.state(), state);
});

test("identity invalidation blocks old Capture callbacks before controller disposal", async () => {
  let current = true, calls = 0, publications = 0;
  const { createDurableTasks } = load("lib/durable-tasks.ts");
  const controller = createDurableTasks(() => { publications++; }, {
    list: async () => [], add: async () => { calls++; return tasks; },
  }, () => current);
  await controller.refresh();
  const before = publications;
  current = false;
  await assert.rejects(() => controller.add(addition));
  await controller.refresh();
  assert.equal(calls, 0); assert.equal(publications, before);
});

test("401 hides confirmed tasks and stops mutations; 400 releases invalid addition", async () => {
  const cache = new Map(); const { TaskApiError } = load("lib/task-api.ts", undefined, cache);
  const { createDurableTasks } = load("lib/durable-tasks.ts", undefined, cache);
  let state, status = 400;
  const controller = createDurableTasks(value => { state = value; }, {
    list: async () => tasks,
    add: async () => { throw new TaskApiError(status, "failure"); },
  });
  await controller.refresh(); await assert.rejects(() => controller.add(addition));
  assert.equal(state.unresolvedAddition, false);
  status = 401; await assert.rejects(() => controller.add(addition));
  assert.equal(state.unauthorized, true); assert.equal(state.tasks, null);
  await assert.rejects(() => controller.add(addition));
});

test("edit/delete publish only confirmations and reconcile absent tasks proportionally", async () => {
  const cache = new Map(); const { TaskApiError } = load("lib/task-api.ts", undefined, cache);
  const { createDurableTasks } = load("lib/durable-tasks.ts", undefined, cache);
  let state, current = tasks, failure = false;
  const controller = createDurableTasks(value => { state = plain(value); }, {
    list: async () => current,
    edit: async () => { if (failure) throw new TaskApiError(404, "missing"); return { ...tasks[0], name: "Corrected" }; },
    delete: async () => { throw new TaskApiError(404, "missing"); },
  });
  await controller.refresh(); await controller.edit(7, { ...draft, name: "Corrected" });
  assert.equal(state.tasks[0].name, "Corrected"); assert.equal(state.tasks[0].originalCapture, original);
  failure = true; current = [];
  await assert.rejects(() => controller.edit(7, draft)); await tick();
  assert.deepEqual(state.tasks, []);
  await controller.delete(7); assert.deepEqual(state.tasks, []);
  current = tasks;
  await assert.rejects(() => controller.delete(7));
});

test("production task/context paths contain no prototype storage, sample reset or browser task IDs", () => {
  for (const file of ["app/page.tsx", "components/task-workspace.tsx", "components/tasks-section.tsx", "lib/durable-tasks.ts"]) {
    assert.doesNotMatch(fs.readFileSync(path.resolve(__dirname, "..", file), "utf8"), /localStorage|sampleTasks|Date\.now\(|ResetSample/);
  }
});
