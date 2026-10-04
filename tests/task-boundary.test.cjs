const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, options = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const filename = path.resolve(__dirname, "..", file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, Response, URL, AbortController, setTimeout, clearTimeout, process: { env: options.env ?? {} },
    require(name) {
      if (name === "server-only") return {};
      if (name === "@clerk/nextjs/server") return { auth: options.auth ?? (async () => ({ userId: "user_A", getToken: async () => "token_A" })) };
      if (name === "@supabase/supabase-js") return { createClient: options.createClient ?? (() => { assert.fail("Unexpected database access"); }) };
      if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, options, cache);
      if (name.startsWith(".")) return load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), `${name}.ts`)), options, cache);
      assert.fail(`Unexpected import ${name}`);
    },
  }, { filename });
  cache.set(file, module.exports);
  return module.exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const draft = { name: "Email invoice", duration: 15.5, urgency: "medium", importance: "high",
  focusRequired: "low", contextTag: "flexible", readiness: "ready", canBeDoneInParts: "yes" };
const requestId = "1f74921f-177a-4ed3-b215-43773d631c3e";
const row = { id: 1, name: draft.name, duration: draft.duration, urgency: draft.urgency, importance: draft.importance,
  focus_required: draft.focusRequired, context_tag: draft.contextTag, readiness: draft.readiness,
  can_be_done_in_parts: draft.canBeDoneInParts, original_capture: "  Email invoice\n", user_id: "user_A" };
const env = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" };
const request = (method, body, origin = "http://localhost") => new Request("http://localhost/api/tasks/1", {
  method, headers: { "Content-Type": "application/json", Origin: origin },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

test("task addition validates a bounded complete batch and rejects ownership/provenance spoofing", () => {
  const parser = load("lib/task-storage.ts");
  const addition = { requestId, tasks: [draft, { ...draft, name: "Call Mom" }], originalCapture: "  Original\n" };
  assert.deepEqual(plain(parser.parseTaskAddition(addition)), addition);
  for (const invalid of [ { ...addition, user_id: "user_B" }, { ...addition, requestId: "bad" },
    { ...addition, tasks: [] }, { ...addition, tasks: Array(21).fill(draft) },
    { ...addition, tasks: [draft, { ...draft, duration: 0 }] },
    { ...addition, tasks: [{ ...draft, user_id: "user_B" }] }, { ...addition, originalCapture: " " }]) {
    assert.throws(() => parser.parseTaskAddition(invalid));
  }
  assert.deepEqual(plain(parser.taskFromRow(row)), { ...draft, id: 1, originalCapture: row.original_capture });
  assert.throws(() => parser.parseTaskDraft({ ...draft, originalCapture: "replace source" }));
  assert.throws(() => parser.parseTaskId("9007199254740992"));
});

test("database client uses native Clerk token and publishable key without storing a Supabase session", async () => {
  let called = false;
  const { createUserDatabase } = load("lib/server/supabase.ts", { env, createClient(url, key, options) {
    assert.equal(url, env.SUPABASE_URL);
    assert.equal(key, env.SUPABASE_PUBLISHABLE_KEY);
    assert.deepEqual(plain(options.auth), { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    called = true;
    return options;
  } });
  const result = await createUserDatabase({ userId: "user_A", getToken: async () => "native_token" });
  assert.equal(await result.accessToken(), "native_token");
  assert.ok(called);
  await assert.rejects(() => createUserDatabase({ userId: "user_A", getToken: async () => null }));
  const forbidden = load("lib/server/supabase.ts", { env: { ...env, SUPABASE_PUBLISHABLE_KEY: "sb_secret_forbidden" } });
  await assert.rejects(() => forbidden.createUserDatabase({ userId: "user_A", getToken: async () => "token" }));
});

test("all durable task handlers reject unauthenticated callers before database access or input parsing", async () => {
  const options = { auth: async () => ({ userId: null }) };
  const root = load("app/api/tasks/route.ts", options);
  const item = load("app/api/tasks/[id]/route.ts", options);
  for (const call of [() => root.GET(), () => root.POST({ json: () => assert.fail("Read input") }),
    () => item.PATCH(null, null), () => item.DELETE(null, null)]) {
    assert.equal((await call()).status, 401);
  }
});

test("task authentication and token failures fail safely without database access", async () => {
  for (const auth of [async () => { throw new Error("Private provider details"); },
    async () => ({ userId: "user_A", getToken: async () => null }),
    async () => ({ userId: "user_A", getToken: async () => { throw new Error("Private token details"); } })]) {
    const { GET, POST } = load("app/api/tasks/route.ts", { env, auth });
    for (const response of [await GET(), await POST(request("POST", { requestId, tasks: [draft] }))]) {
      assert.equal(response.status, 503);
      assert.doesNotMatch(JSON.stringify(await response.json()), /Private/);
    }
  }
});

test("middleware protects the private home route and preserves public auth pages and API JSON handling", async () => {
  let calls = 0;
  const filename = path.resolve(__dirname, "..", "middleware.ts");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, URL, require() {
    return { clerkMiddleware: (callback) => callback, createRouteMatcher: () => (request) => new URL(request.url).pathname === "/" };
  } });
  const auth = { protect: async (options) => { calls++; assert.equal(options.unauthenticatedUrl, "http://localhost/sign-in"); } };
  for (const pathname of ["/", "/sign-in", "/sign-up", "/api/capture", "/api/tasks"]) {
    await module.exports.default(auth, { url: `http://localhost${pathname}` });
  }
  assert.equal(calls, 1);
});

test("addition sends one atomic RPC with a stable UUID, no owner field, and reports only confirmed persistence", async () => {
  const calls = [];
  const options = { env, createClient: () => ({ rpc: async (name, params) => {
    calls.push({ name, params: plain(params) });
    return { data: [row], error: null };
  } }) };
  const { POST } = load("app/api/tasks/route.ts", options);
  const body = { requestId, tasks: [draft], originalCapture: row.original_capture };
  for (let retry = 0; retry < 2; retry++) {
    const response = await POST(request("POST", body));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { tasks: [{ ...draft, id: 1, originalCapture: row.original_capture }] });
  }
  assert.deepEqual(calls[0], calls[1]);
  assert.deepEqual(calls[0], { name: "add_task_batch", params: { p_request_id: requestId, p_tasks: [draft], p_original_capture: row.original_capture } });
  assert.equal((await POST(request("POST", { ...body, user_id: "user_B" }))).status, 400);
  assert.equal((await POST(request("POST", body, "https://other.example"))).status, 400);
  for (const result of [{ data: null, error: { message: "private database details" } }, { data: [], error: null }]) {
    const failing = load("app/api/tasks/route.ts", { env, createClient: () => ({ rpc: async () => result }) });
    const response = await failing.POST(request("POST", body));
    assert.equal(response.status, 503);
    assert.doesNotMatch(JSON.stringify(await response.json()), /private database details|"tasks"/);
  }
});

test("list/edit/delete preserve task metadata, avoid owner writes and return indistinguishable not-found outcomes", async () => {
  const writes = [];
  let result = { data: [row], error: null };
  const query = {
    select() { return this; }, order() { return this; }, eq(field, id) { assert.equal(field, "id"); assert.equal(id, 1); return this; },
    update(columns) { writes.push(plain(columns)); return this; }, delete() { return this; },
    maybeSingle: async () => result, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  const options = { env, createClient: () => ({ from(table) { assert.equal(table, "tasks"); return query; } }) };
  const root = load("app/api/tasks/route.ts", options);
  const item = load("app/api/tasks/[id]/route.ts", options);
  assert.equal((await root.GET()).status, 200);
  result = { data: row, error: null };
  const context = { params: Promise.resolve({ id: "1" }) };
  assert.equal((await item.PATCH(request("PATCH", draft), context)).status, 200);
  assert.deepEqual(writes[0], { name: draft.name, duration: draft.duration, urgency: draft.urgency, importance: draft.importance,
    focus_required: draft.focusRequired, context_tag: draft.contextTag, readiness: draft.readiness, can_be_done_in_parts: draft.canBeDoneInParts });
  result = { data: null, error: null };
  assert.equal((await item.PATCH(request("PATCH", draft), context)).status, 404);
  assert.equal((await item.DELETE(request("DELETE"), context)).status, 404);
  result = { data: { id: 1 }, error: null };
  assert.deepEqual(await (await item.DELETE(request("DELETE"), context)).json(), { deleted: true });
  result = { data: null, error: { message: "private failure" } };
  assert.equal((await root.GET()).status, 503);
  assert.equal((await item.PATCH(request("PATCH", draft), context)).status, 503);
  assert.equal((await item.DELETE(request("DELETE"), context)).status, 503);
});

test("durable analytics uses confirmed results, allowlisted metadata and the existing addition UUID", async () => {
  const events = [], order = [];
  let originalCapture = null;
  const database = {
    rpc: async () => { order.push("durable"); return { data: [{ ...row, original_capture: originalCapture }], error: null }; },
    from(table) {
      if (table === "application_accounts") return { upsert(owner) {
        assert.deepEqual(plain(owner), { user_id: "user_A" });
        return { abortSignal: async () => ({ error: null }) };
      } };
      assert.equal(table, "experiment_events");
      return { insert(rows) { order.push("analytics"); events.push(plain(rows)); return { abortSignal: async () => ({ error: null }) }; } };
    },
  };
  const { POST } = load("app/api/tasks/route.ts", { env, createClient: () => database });
  const body = { requestId, tasks: [draft] };
  assert.equal((await POST(request("POST", body))).status, 200);
  assert.deepEqual(events[0], [{ event_name: "task_added", source: "manual", task_count: 1, addition_request_id: requestId }]);
  originalCapture = row.original_capture;
  const capture = { ...body, originalCapture };
  for (let i = 0; i < 2; i++) assert.equal((await POST(request("POST", capture))).status, 200);
  assert.deepEqual(events[1], [
    { event_name: "task_added", source: "capture", task_count: 1, addition_request_id: requestId },
    { event_name: "capture_succeeded", task_count: 1, addition_request_id: requestId },
  ]);
  assert.deepEqual(events[1], events[2]); // SQL uniqueness handles the repeated insert.
  assert.deepEqual(order, ["durable", "analytics", "durable", "analytics", "durable", "analytics"]);
  database.rpc = async () => ({ data: [], error: null });
  assert.equal((await POST(request("POST", capture))).status, 503);
  assert.equal(events.length, 3);
});

test("analytics database errors never fail confirmed add/edit/delete, and 404s emit nothing", async () => {
  const attempted = [];
  let mutation = { data: row, error: null };
  const query = { update() { return this; }, delete() { return this; }, eq() { return this; }, select() { return this; },
    maybeSingle: async () => mutation };
  const database = {
    rpc: async () => ({ data: [row], error: null }),
    from(table) {
      if (table === "tasks") return query;
      if (table === "application_accounts") return { upsert() { return { abortSignal: async () => ({ error: null }) }; } };
      return { insert(events) {
        attempted.push(plain(events));
        return { abortSignal: async () => { throw new Error("Analytics unavailable"); } };
      } };
    },
  };
  const options = { env, createClient: () => database };
  const root = load("app/api/tasks/route.ts", options);
  const item = load("app/api/tasks/[id]/route.ts", options);
  const context = { params: Promise.resolve({ id: "1" }) };
  assert.equal((await root.POST(request("POST", { requestId, tasks: [draft], originalCapture: row.original_capture }))).status, 200);
  assert.equal((await item.PATCH(request("PATCH", draft), context)).status, 200);
  mutation = { data: { id: 1 }, error: null };
  assert.equal((await item.DELETE(request("DELETE"), context)).status, 200);
  assert.deepEqual(attempted.slice(1), [[{ event_name: "task_edited" }], [{ event_name: "task_deleted" }]]);
  mutation = { data: null, error: null };
  assert.equal((await item.PATCH(request("PATCH", draft), context)).status, 404);
  assert.equal((await item.DELETE(request("DELETE"), context)).status, 404);
  assert.equal(attempted.length, 3);
  database.from = () => { throw new Error("Root unavailable"); };
  assert.equal((await root.POST(request("POST", { requestId, tasks: [draft], originalCapture: row.original_capture }))).status, 200);
});

test("experiment contract rejects private fields and invalid metadata; browser endpoint excludes durable events", async () => {
  const { parseExperimentEvent } = load("lib/experiment-events.ts");
  const valid = [ { name: "task_added", source: "manual", task_count: 1 }, { name: "task_added", source: "capture", task_count: 20 },
    { name: "capture_succeeded", task_count: 2 }, { name: "capture_failed", stage: "interpretation" },
    { name: "capture_failed", stage: "persistence" }, ...["capture_submitted", "capture_clarification_requested", "context_interacted", "recommendation_surfaced", "task_edited", "task_deleted"].map(name => ({ name })) ];
  for (const event of valid) {
    assert.deepEqual(plain(parseExperimentEvent(event)), event);
    for (const key of ["task", "name_text", "capture", "original_capture", "context", "recommendation", "explanation", "email", "payload", "user_id", "created_at"]) {
      assert.throws(() => parseExperimentEvent({ ...event, [key]: "private" }));
    }
  }
  for (const invalid of [null, [], { name: ["capture_submitted"] }, { name: "page_view" }, { name: "capture_failed" },
    { name: "capture_failed", stage: ["interpretation"] }, { name: "capture_failed", stage: "database" },
    { name: "task_added", source: "unknown", task_count: 1 }, { name: "capture_succeeded", task_count: 0 },
    { name: "capture_succeeded", task_count: 21 }, { name: "capture_succeeded", task_count: 1.5 },
    { name: "capture_succeeded", task_count: "2" }]) assert.throws(() => parseExperimentEvent(invalid));
  const authRequired = load("app/api/experiment-events/route.ts", { auth: async () => ({ userId: null }) });
  assert.equal((await authRequired.POST({ json() { assert.fail("Unauthenticated input"); } })).status, 401);
  const endpoint = load("app/api/experiment-events/route.ts");
  for (const event of valid.filter(e => ["task_added", "capture_succeeded", "task_edited", "task_deleted"].includes(e.name))) {
    assert.equal((await endpoint.POST(request("POST", event))).status, 400);
  }
  assert.equal((await endpoint.POST(request("POST", { name: "capture_submitted" }, "https://foreign.example"))).status, 400);
  assert.equal((await endpoint.POST(request("POST", { name: "capture_submitted", userId: "user_B" }))).status, 400);
});

test("browser analytics endpoint attaches authenticated root only and accepts unavailable telemetry without product errors", async () => {
  const calls = [];
  const database = { from(table) {
    return { upsert(owner) { calls.push({ table, owner: plain(owner) }); return { abortSignal: async () => ({ error: null }) }; },
      insert(events) { calls.push({ table, events: plain(events) }); return { abortSignal: async () => ({ error: { message: "private" } }) }; } };
  } };
  const { POST } = load("app/api/experiment-events/route.ts", { env, createClient: () => database });
  const response = await POST(request("POST", { name: "capture_failed", stage: "interpretation" }));
  assert.equal(response.status, 202);
  assert.deepEqual(calls, [ { table: "application_accounts", owner: { user_id: "user_A" } },
    { table: "experiment_events", events: [{ event_name: "capture_failed", stage: "interpretation" }] } ]);
  assert.deepEqual(await response.json(), { accepted: true });
  const unavailable = load("app/api/experiment-events/route.ts");
  assert.equal((await unavailable.POST(request("POST", { name: "context_interacted" }))).status, 202);
});
