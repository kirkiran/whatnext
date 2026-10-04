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
    module, exports: module.exports, Response, URL, process: { env: options.env ?? {} },
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
