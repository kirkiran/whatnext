const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Compile only the modules under test in memory; no build artifacts or live fetch.
function loadModule(relativePath, globals = {}, cache = new Map()) {
  if (cache.has(relativePath)) return cache.get(relativePath);
  const filename = path.resolve(__dirname, "..", relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports, Response, AbortController, setTimeout, clearTimeout,
    process: { env: {} },
    fetch: () => { throw new Error("Live fetch forbidden in tests"); },
    require: (name) => {
      if (name === "server-only") return {};
      if (name === "@clerk/nextjs/server") return { auth: globals.clerkAuth ?? (async () => ({ userId: "user_test", getToken: async () => "test-token" })) };
      assert.ok(name.startsWith("@/"));
      return loadModule(`${name.slice(2)}.ts`, globals, cache);
    },
    ...globals,
  }, { filename });
  cache.set(relativePath, loadedModule.exports);
  return loadedModule.exports;
}

const capture = loadModule("lib/capture.ts");
const draft = {
  name: "Email invoice to client", duration: 15, urgency: "medium",
  importance: "medium", focusRequired: "medium", contextTag: "flexible",
  readiness: "ready", canBeDoneInParts: "no",
};
const success = (tasks = [draft]) => ({ status: "success", tasks, message: null });
const clarify = { status: "clarify", tasks: [], message: "What would you like to do with the studies and school reports?" };
const envelope = (result) => ({
  status: "completed",
  output: [
    { type: "reasoning", summary: [] },
    { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(result) }] },
  ],
});
const plain = (value) => JSON.parse(JSON.stringify(value));
const request = (body) => new Request("http://localhost/api/capture", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

test("Capture rejects missing or failed authentication before reading input or calling OpenAI", async () => {
  for (const [clerkAuth, status] of [
    [async () => ({ userId: null }), 401],
    [async () => { throw new Error("Provider failure with private details"); }, 503],
  ]) {
    const { POST } = loadModule("app/api/capture/route.ts", {
      clerkAuth,
      process: { env: { OPENAI_API_KEY: "test-key" } },
      fetch: () => { assert.fail("Unauthenticated OpenAI call"); },
    });
    const response = await POST({ json: () => { assert.fail("Input read before auth"); } });
    assert.equal(response.status, status);
    assert.doesNotMatch(JSON.stringify(await response.json()), /private details/);
  }
});

test("request requires only nonblank bounded capture and preserves original text", () => {
  assert.equal(capture.parseCaptureRequest({ capture: "  Email invoice\n" }), "  Email invoice\n");
  for (const value of [null, [], {}, { capture: " " }, { capture: 1 },
    { capture: "x".repeat(4001) }, { capture: "task", context: {} }]) {
    assert.throws(() => capture.parseCaptureRequest(value));
  }
  assert.equal(capture.parseCaptureRequest({ capture: "x".repeat(4000) }).length, 4000);
});

test("accepts complete single/batch drafts and clarification without changing explicit metadata", () => {
  const explicit = { ...draft, duration: 90, urgency: "high", importance: "low", focusRequired: "high",
    contextTag: "outside", readiness: "blocked", canBeDoneInParts: "yes" };
  for (const value of [success(), success([draft, explicit]), clarify]) {
    assert.deepEqual(plain(capture.parseCaptureResult(value)), value);
    assert.deepEqual(plain(capture.parseCaptureResponse(envelope(value))), value);
  }
});

test("rejects invalid names, durations, enums, omissions and additional task fields", () => {
  for (const name of ["", "  ", null, 1, "x".repeat(501)]) {
    assert.throws(() => capture.parseCaptureResult(success([{ ...draft, name }])));
  }
  for (const duration of [0, -1, NaN, Infinity, -Infinity, "15", null, undefined]) {
    assert.throws(() => capture.parseCaptureResult(success([{ ...draft, duration }])));
  }
  for (const field of Object.keys(draft)) {
    const missing = { ...draft };
    delete missing[field];
    assert.throws(() => capture.parseCaptureResult(success([missing])));
  }
  for (const field of ["urgency", "importance", "focusRequired", "contextTag", "readiness", "canBeDoneInParts"]) {
    for (const value of [null, undefined, "unknown", "HIGH", true]) {
      assert.throws(() => capture.parseCaptureResult(success([{ ...draft, [field]: value }])));
    }
  }
  assert.throws(() => capture.parseCaptureResult(success([{ ...draft, id: 1 }])));
});

test("rejects inconsistent or oversized result and does not accept a partial valid batch", () => {
  for (const value of [success([]), success(Array(21).fill(draft)),
    { ...success(), message: "done" }, { ...clarify, tasks: [draft] },
    { ...clarify, message: " " }, { ...clarify, message: "x".repeat(301) },
    { ...success(), extra: true }, { ...success(), status: "other" },
    success([draft, { ...draft, duration: 0 }])]) {
    assert.throws(() => capture.parseCaptureResult(value));
  }
});

test("rejects incomplete, refused, malformed and unexpected raw Responses output", () => {
  const invalid = [null, { output_text: JSON.stringify(success()) },
    { ...envelope(success()), status: "incomplete" },
    { status: "completed", output: [] },
    { status: "completed", output: [{ type: "function_call" }] }];
  for (const content of [[{ type: "refusal", refusal: "Cannot comply" }],
    [{ type: "output_text", text: "not JSON" }],
    [{ type: "output_text", text: "{}" }], [],
    [{ type: "output_text", text: JSON.stringify(success()) }, { type: "refusal" }]]) {
    const value = envelope(success());
    value.output[1].content = content;
    invalid.push(value);
  }
  for (const value of invalid) assert.throws(() => capture.parseCaptureResponse(value));
});

test("route sends strict schema, configured model, capture only; returns both outcomes", async () => {
  for (const result of [success([draft, { ...draft, name: "Call Mom" }]), clarify]) {
    let calls = 0;
    const { POST } = loadModule("app/api/capture/route.ts", {
      process: { env: { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "test-model" } },
      fetch: async (url, options) => {
        calls++;
        assert.equal(url, "https://api.openai.com/v1/responses");
        assert.equal(options.headers.Authorization, "Bearer test-key");
        const body = JSON.parse(options.body);
        assert.equal(body.model, "test-model");
        assert.ok(body.instructions.includes("A time span describing an event, appointment, trip, reservation, or calendar block is not the time required to arrange it."));
        assert.ok(body.instructions.includes("explicitly describes time spent performing the task: preserve that duration. Explicit task-effort estimates take precedence over system estimates."));
        assert.equal(body.text.format.strict, true);
        assert.equal(body.text.format.schema.additionalProperties, false);
        assert.equal(body.text.format.schema.properties.tasks.items.properties.duration.minimum, 1);
        assert.equal(body.store, false);
        assert.deepEqual(body.input, [{ role: "user", content: [{ type: "input_text", text: "Original capture" }] }]);
        return Response.json(envelope(result));
      },
    });
    const response = await POST(request({ capture: "Original capture" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), result);
    assert.equal(calls, 1);
  }
});

test("route rejects bad input and missing key without fetching", async () => {
  let calls = 0;
  const { POST } = loadModule("app/api/capture/route.ts", {
    fetch: () => { calls++; throw new Error("Must not fetch"); },
  });
  assert.equal((await POST(request({ capture: " " }))).status, 400);
  assert.equal((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status, 400);
  assert.equal((await POST(request({ capture: "Email invoice" }))).status, 503);
  assert.equal(calls, 0);
});

test("route returns recoverable error without tasks for provider and validation failures", async () => {
  const refused = envelope(success());
  refused.output[1].content = [{ type: "refusal", refusal: "No" }];
  for (const fetch of [
    async () => { throw new Error("network failure"); },
    async () => new Response("upstream error", { status: 429 }),
    async () => new Response("not JSON"),
    async () => Response.json(refused),
    async () => Response.json({ ...envelope(success()), status: "incomplete" }),
    async () => Response.json(envelope(success([{ ...draft, duration: 0 }]))),
  ]) {
    const { POST } = loadModule("app/api/capture/route.ts", {
      process: { env: { OPENAI_API_KEY: "test-key" } }, fetch,
    });
    const response = await POST(request({ capture: "Email invoice" }));
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.deepEqual(Object.keys(body), ["error"]);
    assert.match(body.error, /Nothing was added/);
  }
});

test("route timeout aborts request and clears timer, with default configured model", async () => {
  let expire;
  let cleared = false;
  const { POST } = loadModule("app/api/capture/route.ts", {
    process: { env: { OPENAI_API_KEY: "test-key" } },
    setTimeout: (callback, ms) => { assert.equal(ms, 30000); expire = callback; return 42; },
    clearTimeout: (id) => { assert.equal(id, 42); cleared = true; },
    fetch: async (_url, options) => {
      assert.equal(JSON.parse(options.body).model, "gpt-5");
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
        expire();
      });
    },
  });
  const response = await POST(request({ capture: "Email invoice" }));
  assert.equal(response.status, 504);
  assert.ok(cleared);
  assert.deepEqual(Object.keys(await response.json()), ["error"]);
});
