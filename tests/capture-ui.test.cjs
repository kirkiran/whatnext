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
      module: loaded, exports: loaded.exports, Response, AbortController, setTimeout, clearTimeout, crypto: require("node:crypto").webcrypto,
      fetch: () => { throw new Error("Live fetch forbidden"); },
      ...globals,
      require(name) {
        if (name === "react") return hooks;
        if (name === "@clerk/nextjs" && globals.clerk) return globals.clerk;
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

test("successful request saves exact submitted text before clearing and blocks immediate duplicate submit", async () => {
  let resolve;
  let calls = 0;
  const saves = [];
  const h = captureHarness(async (_url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body), { capture: original });
    return new Promise((done) => { resolve = done; });
  }, (addition) => {
    assert.equal(find(h.render(), "textarea").props.value, original);
    saves.push(addition);
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
  assert.equal(saves[0].originalCapture, original);
  assert.equal(find(h.render(), "textarea").props.value, "");
  assert.equal(find(h.render(), "Button").props.children, "Capture");
  assert.match(JSON.stringify(h.render()), /Added 2 tasks/);
});

test("clarification, HTTP/network/invalid batch and durable save errors retain input and save no partial tasks", async () => {
  for (const mode of ["clarify", "http", "network", "invalid", "save"]) {
    let saves = 0;
    const h = captureHarness(async () => {
      if (mode === "network") throw new Error("offline");
      if (mode === "http") return new Response("error", { status: 502 });
      if (mode === "clarify") return Response.json({ status: "clarify", tasks: [], message: "Please rephrase the intended action." });
      if (mode === "invalid") return Response.json(success([draft, { ...draft, duration: 0 }]));
      return Response.json(success());
    }, () => {
      if (mode === "save") throw new Error("save unavailable");
      saves++;
    });
    await h.submit();
    assert.equal(saves, 0);
    assert.equal(find(h.render(), "textarea").props.value, original);
    assert.equal(find(h.render(), "Button").props.disabled, false);
    assert.match(JSON.stringify(h.render()), mode === "clarify" ? /Please rephrase/ : /Try again|Retry save/);
  }
});

test("clarification appears once above the input label; success and errors remain below the button", async () => {
  const question = "What would you like to do with the reports?";
  let outcome = "clarify";
  const h = captureHarness(async () => {
    if (outcome === "error") return new Response("error", { status: 502 });
    return Response.json(outcome === "clarify"
      ? { status: "clarify", tasks: [], message: question }
      : success());
  }, () => {});
  await h.submit();
  const children = find(h.render(), "form").props.children.filter(Boolean);
  const status = children.find((child) => child.props.id === "capture-status");
  assert.equal(children[0], status);
  assert.equal(children[1].type, "label");
  assert.equal(find(status, "h3").props.children, "Needs clarification");
  assert.equal(find(status, "p").props.children, question);
  assert.match(status.props.className, /bg-status-warning-surface/);
  assert.equal(children.filter((child) => child.props.id === "capture-status").length, 1);
  assert.equal(find(h.render(), "textarea").props.value, original);
  for (outcome of ["error", "success"]) {
    await h.submit();
    const nextChildren = find(h.render(), "form").props.children.filter(Boolean);
    const statusIndex = nextChildren.findIndex((child) => child.props.id === "capture-status");
    assert.ok(statusIndex > nextChildren.findIndex((child) => child.type === "Button"));
    assert.equal(nextChildren[statusIndex].type, "p");
    assert.equal(find(h.render(), "h3"), undefined);
  }
});

test("manual add freezes an uncertain draft and UUID, keeps form open, and retries before closing", async () => {
  const additions = [];
  let fail = true;
  let resolve;
  const h = harness("components/tasks-section.tsx");
  const render = () => h.render("TasksSection", {
    tasks: [], busy: false, unresolvedAddition: false,
    async onAdd(addition) { additions.push(plain(addition)); if (fail) throw new Error("lost response"); await new Promise(done => { resolve = done; }); },
  });
  find(render(), "Button").props.onClick();
  find(render(), "TaskForm").props.onChange({ target: { name: "name", value: "Manual task" } });
  await find(render(), "TaskForm").props.onSubmit(submit);
  assert.equal(find(render(), "TaskForm").props.formValues.name, "Manual task");
  assert.equal(find(render(), "TaskForm").props.retry, true);
  assert.equal(find(render(), "TaskForm").props.locked, true);
  fail = false;
  const retry = find(render(), "TaskForm").props.onSubmit(submit);
  await find(render(), "TaskForm").props.onSubmit(submit);
  assert.equal(additions.length, 2);
  assert.deepEqual(additions[0], additions[1]);
  assert.equal(additions[0].tasks[0].id, undefined);
  assert.ok(find(render(), "TaskForm"));
  resolve(); await retry;
  assert.equal(find(render(), "TaskForm"), undefined);
});

test("edit/delete await persistence and recoverable errors keep input and task visible", async () => {
  const tasks = [{ ...draft, id: 7, originalCapture: original }];
  let failure = true, resolve, deleted = false;
  const h = harness("components/tasks-section.tsx");
  const render = () => h.render("TasksSection", {
    tasks, busy: false, unresolvedAddition: false,
    async onEditTask(id, values) {
      assert.equal(id, 7); assert.equal(values.originalCapture, undefined);
      if (failure) throw new Error("offline");
      await new Promise(done => { resolve = done; });
      tasks[0] = { ...tasks[0], ...values };
    },
    async onDeleteTask() { if (failure) throw new Error("offline"); deleted = true; },
  });
  find(render(), "TaskList").props.onEdit(tasks[0], { currentTarget: {} });
  find(render(), "TaskForm").props.onChange({ target: { name: "name", value: "Corrected task" } });
  await find(render(), "TaskForm").props.onSubmit(submit);
  assert.equal(find(render(), "TaskForm").props.formValues.name, "Corrected task");
  assert.equal(tasks[0].name, draft.name);
  failure = false;
  const save = find(render(), "TaskForm").props.onSubmit(submit);
  assert.ok(find(render(), "TaskForm"));
  resolve(); await save;
  assert.equal(find(render(), "TaskForm"), undefined);
  assert.equal(tasks[0].originalCapture, original);
  failure = true;
  await find(render(), "TaskList").props.onDelete(7);
  assert.equal(deleted, false);
  assert.equal(find(render(), "TaskList").props.tasks.length, 1);
  failure = false;
  await find(render(), "TaskList").props.onDelete(7);
  assert.equal(deleted, true);
});

test("Capture waits for durable save and retries the same interpreted batch without another OpenAI call", async () => {
  let interpretations = 0, failure = true, resolve;
  const additions = [];
  const h = captureHarness(async () => { interpretations++; return Response.json(success([draft, { ...draft, name: "Buy milk" }])); }, async addition => {
    additions.push(plain(addition));
    if (failure) throw new Error("lost response");
    await new Promise(done => { resolve = done; });
  });
  await h.submit();
  assert.equal(find(h.render(), "textarea").props.value, original);
  assert.equal(find(h.render(), "textarea").props.disabled, true);
  assert.equal(find(h.render(), "Button").props.children, "Retry save");
  assert.doesNotMatch(JSON.stringify(h.render()), /Added 2 tasks/);
  failure = false;
  const save = h.submit();
  assert.equal(find(h.render(), "Button").props.children, "Saving…");
  assert.equal(find(h.render(), "textarea").props.value, original);
  assert.equal(interpretations, 1);
  assert.deepEqual(additions[0], additions[1]);
  resolve(); await save;
  assert.equal(find(h.render(), "textarea").props.value, "");
  assert.match(JSON.stringify(h.render()), /Added 2 tasks/);
});

test("original wording is subordinate disclosure only for captured tasks", () => {
  const h = harness("components/task-list.tsx");
  const props = { editingTaskId: null, isFormOpen: false, onDelete() {}, onEdit() {} };
  assert.equal(find(h.render("TaskList", { ...props, tasks: [{ ...draft, id: 1 }] }), "details"), undefined);
  const details = find(h.render("TaskList", { ...props, tasks: [{ ...draft, id: 1, originalCapture: original }] }), "details");
  assert.equal(find(details, "p").props.children, original);
});

test("workspace distinguishes loading/failure/empty and never accesses legacy browser storage", async () => {
  let resolve;
  const focus = new Map();
  const h = harness("components/task-workspace.tsx", {
    window: { addEventListener: (name, callback) => focus.set(name, callback), removeEventListener() {},
      localStorage: new Proxy({}, { get() { assert.fail("Legacy storage accessed"); } }) },
    fetch: () => new Promise(done => { resolve = done; }),
  });
  const render = () => h.render("TaskWorkspace", { isCurrentUser: () => true });
  assert.match(JSON.stringify(render()), /Loading tasks and recommendations/);
  assert.equal(find(render(), "RecommendationSection"), undefined);
  assert.equal(find(render(), "TasksSection"), undefined);
  h.effects();
  resolve(new Response("", { status: 503 }));
  await new Promise(done => setImmediate(done));
  assert.match(JSON.stringify(render()), /Could not load tasks/);
  assert.equal(find(render(), "TasksSection"), undefined);
  find(render(), "Button").props.onClick();
  resolve(Response.json({ tasks: [] }));
  await new Promise(done => setImmediate(done));
  assert.deepEqual(plain(find(render(), "TasksSection").props.tasks), []);
  assert.ok(find(render(), "RecommendationSection"));
  assert.ok(focus.has("focus"));
});

test("account change remounts the workspace and invalidates old callbacks before effect cleanup", () => {
  let userId = "user_A";
  const h = harness("app/page.tsx", { clerk: { useAuth: () => ({ isLoaded: true, userId }) } });
  const first = find(h.render("default"), "AccountWorkspace");
  assert.equal(first.key, "user_A"); assert.equal(first.props.isCurrentUser(), true);
  userId = "user_B";
  const second = find(h.render("default"), "AccountWorkspace");
  assert.equal(second.key, "user_B"); assert.equal(first.props.isCurrentUser(), false);
  userId = null;
  assert.equal(find(h.render("default"), "AccountWorkspace"), undefined);
  assert.equal(second.props.isCurrentUser(), false);
});
function accountHarness(fetch, signOut = async () => {}, confirm = () => true) {
  const h = harness("components/account-workspace.tsx", {
    fetch, window: { confirm }, clerk: { useClerk: () => ({ signOut }) },
  });
  let current = true;
  const render = () => h.render("AccountWorkspace", { isCurrentUser: () => current });
  const action = () => find(render(), "AppHeader").props.accountAction;
  return { render, action, switchAccount: () => { current = false; } };
}

test("account deletion confirmation cancellation leaves the workspace unchanged", async () => {
  let calls = 0;
  const h = accountHarness(async () => { calls++; }, async () => assert.fail("Unexpected sign-out"), message => {
    assert.equal(message, "Permanently delete your EegEnu account and all stored tasks? This cannot be undone.");
    return false;
  });
  await h.action().props.onClick();
  assert.equal(calls, 0);
  assert.ok(find(h.render(), "TaskWorkspace"));
});

test("account deletion blocks duplicate submissions and current workspace saves, then signs out on full confirmation", async () => {
  let resolve, calls = 0;
  const signOutCalls = [];
  const h = accountHarness(async (url, options) => {
    calls++; assert.equal(url, "/api/account"); assert.equal(options.method, "DELETE");
    assert.deepEqual(JSON.parse(options.body), { confirmed: true });
    return new Promise(done => { resolve = done; });
  }, async options => signOutCalls.push(options));
  const oldWorkspace = find(h.render(), "TaskWorkspace");
  const action = h.action();
  const pending = action.props.onClick();
  await action.props.onClick();
  assert.equal(calls, 1);
  assert.equal(oldWorkspace.props.isCurrentUser(), false);
  assert.equal(find(h.render(), "TaskWorkspace"), undefined);
  assert.equal(h.action().props.isLoading, true);
  resolve(Response.json({ dataDeleted: true, deleted: true }));
  await pending;
  assert.deepEqual(plain(signOutCalls), [{ redirectUrl: "/sign-in" }]);
  assert.match(JSON.stringify(h.render()), /account and stored tasks were deleted/);
  assert.equal(find(h.render(), "TaskWorkspace"), undefined);
  assert.equal(h.action().props.disabled, true);
});

test("confirmed account deletion remains successful when browser sign-out fails", async () => {
  const h = accountHarness(async () => Response.json({ dataDeleted: true, deleted: true }), async () => { throw new Error("sign-out unavailable"); });
  await h.action().props.onClick();
  assert.match(JSON.stringify(h.render()), /account and stored tasks were deleted/);
  assert.doesNotMatch(JSON.stringify(h.render()), /Could not confirm/);
  assert.equal(find(h.render(), "TaskWorkspace"), undefined);
  assert.ok(find(h.render(), "default")); // mocked next/link export
});

test("partial account deletion hides removed data and permits retry without premature sign-out", async () => {
  let attempts = 0, signedOut = 0;
  const h = accountHarness(async () => {
    attempts++;
    return attempts === 1 ? Response.json({ dataDeleted: true, error: "failure" }, { status: 503 })
      : Response.json({ dataDeleted: true, deleted: true });
  }, async () => { signedOut++; });
  const oldWorkspace = find(h.render(), "TaskWorkspace");
  await h.action().props.onClick();
  assert.equal(signedOut, 0);
  assert.equal(find(h.render(), "TaskWorkspace"), undefined);
  assert.equal(oldWorkspace.props.isCurrentUser(), false);
  assert.match(JSON.stringify(h.render()), /task data was removed/);
  assert.equal(h.action().props.disabled, false);
  await h.action().props.onClick();
  assert.equal(attempts, 2); assert.equal(signedOut, 1);
});

test("unconfirmed database deletion and network failures do not announce success or sign out", async () => {
  for (const mode of ["database", "network", "malformed"]) {
    const h = accountHarness(async () => {
      if (mode === "network") throw new Error("offline");
      if (mode === "malformed") return Response.json({ deleted: true });
      return Response.json({ error: "failure" }, { status: 503 });
    }, async () => assert.fail("Premature sign-out"));
    await h.action().props.onClick();
    assert.match(JSON.stringify(h.render()), /Could not confirm/);
    assert.doesNotMatch(JSON.stringify(h.render()), /account and stored tasks were deleted/);
    assert.ok(find(h.render(), "TaskWorkspace"));
  }
});

test("old-account deletion responses cannot sign out a new account", async () => {
  let resolve;
  const h = accountHarness(() => new Promise(done => { resolve = done; }), async () => assert.fail("Signed out a different account"));
  const pending = h.action().props.onClick();
  h.switchAccount(); resolve(Response.json({ dataDeleted: true, deleted: true }));
  await pending;
});
