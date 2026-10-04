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
    module, exports: module.exports, Response, URL,
    process: { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" } },
    require(name) {
      if (name === "server-only") return {};
      if (name === "@clerk/nextjs/server") return {
        auth: options.auth ?? (async () => ({ userId: "user_A", getToken: async () => "token_A" })),
        clerkClient: options.clerkClient ?? (() => assert.fail("Unexpected Clerk deletion")),
      };
      if (name === "@supabase/supabase-js") return { createClient: options.createClient ?? (() => assert.fail("Unexpected database access")) };
      if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, options, cache);
      if (name.startsWith(".")) return load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), `${name}.ts`)), options, cache);
      assert.fail(`Unexpected import ${name}`);
    },
  }, { filename });
  cache.set(file, module.exports);
  return module.exports;
}
const request = (body = { confirmed: true }, origin = "http://localhost", contentType = "application/json") => new Request("http://localhost/api/account", {
  method: "DELETE", headers: { Origin: origin, "Content-Type": contentType }, body: JSON.stringify(body),
});
function setup({ deletionError = null, verificationError = null, remaining = null, clerkFailure = false } = {}) {
  const events = [];
  const query = {
    delete() { events.push("database-delete"); return this; },
    select(columns) { assert.equal(columns, "user_id"); events.push("database-verify"); return this; },
    eq(column, userId) { assert.equal(column, "user_id"); assert.equal(userId, "user_A"); return this; },
    then(resolve) { return Promise.resolve({ error: deletionError }).then(resolve); },
    maybeSingle: async () => ({ data: remaining, error: verificationError }),
  };
  const { DELETE } = load("app/api/account/route.ts", {
    createClient(_url, _key, options) {
      assert.equal(options.auth.persistSession, false);
      return { from(table) { assert.equal(table, "application_accounts"); return query; } };
    },
    async clerkClient() {
      events.push("clerk-client");
      return { users: { async deleteUser(userId) {
        assert.equal(userId, "user_A"); events.push("clerk-delete");
        if (clerkFailure) throw new Error("Private provider details");
      } } };
    },
  });
  return { DELETE, events };
}

test("account deletion requires authentication before input parsing or service access", async () => {
  const { DELETE } = load("app/api/account/route.ts", { auth: async () => ({ userId: null }) });
  const response = await DELETE({ json() { assert.fail("Unauthenticated input read"); } });
  assert.equal(response.status, 401);
});

test("account deletion requires exact confirmation and rejects caller IDs and foreign origins", async () => {
  const { DELETE } = load("app/api/account/route.ts");
  for (const body of [{}, { confirmed: false }, { confirmed: "true" }, { confirmed: true, userId: "user_B" }, null, []]) {
    assert.equal((await DELETE(request(body))).status, 400);
  }
  assert.equal((await DELETE(request({ confirmed: true }, "https://foreign.example"))).status, 400);
  assert.equal((await DELETE(request({ confirmed: true }, "http://localhost", "text/plain"))).status, 400);
});

test("authenticated root deletion and absence verification precede deletion of the same Clerk identity", async () => {
  const { DELETE, events } = setup();
  const response = await DELETE(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { dataDeleted: true, deleted: true });
  assert.deepEqual(events, ["database-delete", "database-verify", "clerk-client", "clerk-delete"]);
});

test("failed or unconfirmed database deletion prevents any Clerk deletion", async () => {
  for (const mode of [{ deletionError: { message: "Private database details" } },
    { verificationError: { message: "Private verification details" } }, { remaining: { user_id: "user_A" } }]) {
    const { DELETE, events } = setup(mode);
    const response = await DELETE(request());
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.dataDeleted, undefined);
    assert.match(body.error, /Account deletion was not attempted/);
    assert.doesNotMatch(body.error, /Private/);
    assert.ok(!events.includes("clerk-client"));
  }
});

test("Clerk failure reports confirmed data cleanup; retry succeeds with the root already absent", async () => {
  const failing = setup({ clerkFailure: true });
  const response = await failing.DELETE(request());
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.dataDeleted, true); assert.equal(body.deleted, undefined);
  assert.match(body.error, /task data was removed/);
  assert.doesNotMatch(body.error, /Private/);
  const retry = setup({ remaining: null });
  assert.equal((await retry.DELETE(request())).status, 200);
  assert.ok(retry.events.includes("clerk-delete"));
});
