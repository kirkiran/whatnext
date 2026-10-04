const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

// Render the real pages/components without provider access or live requests.
function load(file, mocks = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const filename = path.resolve(__dirname, "..", file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, URL,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === "next/link") return { default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (name === "@clerk/nextjs") return {
        SignIn: () => React.createElement("div", null, "Sign in"),
        SignUp: () => React.createElement("div", null, "Sign up"),
        useAuth: () => ({ isLoaded: true, userId: "user_test" }),
      };
      if (name.startsWith("@/")) {
        const relative = name.slice(2);
        const extension = fs.existsSync(path.resolve(__dirname, "..", `${relative}.tsx`)) ? ".tsx" : ".ts";
        return load(`${relative}${extension}`, mocks, cache);
      }
      if (name.startsWith(".")) {
        const relative = path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), `${name}.ts`));
        return load(relative, mocks, cache);
      }
      return require(name);
    },
  }, { filename });
  cache.set(file, module.exports);
  return module.exports;
}

function render(file, name = "default", props = {}, mocks = {}) {
  return renderToStaticMarkup(React.createElement(load(file, mocks)[name], props));
}

test("legal pages render titles, effective date, operator and contact without authentication", () => {
  for (const [route, title] of [["privacy", "Privacy Policy"], ["terms", "Terms of Use"]]) {
    const file = `app/${route}/page.tsx`;
    const html = render(file, "default", {}, {
      "@clerk/nextjs": new Proxy({}, { get() { assert.fail("Legal page accessed Clerk"); } }),
    });
    assert.match(html, new RegExp(`<h1[^>]*>${title}</h1>`));
    assert.match(html, /Effective date: October 4, 2026/);
    assert.match(html, /Kiran Suryakant Shahapur/);
    assert.match(html, /href="mailto:contact@eegenu.com"/);
    assert.equal(load(file).metadata.title, `${title} | EegEnu`);
  }
});

test("privacy preserves material content, telemetry and retention disclosures", () => {
  const html = render("app/privacy/page.tsx");
  assert.match(html, /full text you submitted.*every resulting task/);
  assert.match(html, /linked to your account, not anonymous/);
  assert.match(html, /browser memory/);
  assert.match(html, /store:false/);
  assert.match(html, /does not mean zero retention/);
  assert.match(html, /not an automated purge or a fixed retention period/);
  assert.match(html, /does not instantly erase provider backups or logs/);
  for (const provider of ["Clerk", "Supabase", "OpenAI", "Vercel", "Cloudflare"]) assert.ok(html.includes(provider));
});

test("auth surfaces and authenticated workspace render visible policy links", () => {
  const mocks = { "@/components/account-workspace": { AccountWorkspace: () => React.createElement("div", null, "Workspace") } };
  for (const file of ["app/sign-in/[[...sign-in]]/page.tsx", "app/sign-up/[[...sign-up]]/page.tsx", "app/page.tsx"]) {
    const html = render(file, "default", {}, mocks);
    assert.match(html, /aria-label="Legal"/);
    assert.match(html, /href="\/privacy"[^>]*>Privacy<\/a>/);
    assert.match(html, /href="\/terms"[^>]*>Terms<\/a>/);
  }
});

test("Capture disclosure is adjacent to input, accessible as help and links to privacy", () => {
  const html = render("components/capture-form.tsx", "CaptureForm", { ready: true, onSave: async () => {} });
  assert.match(html, /aria-describedby="capture-help capture-status"/);
  assert.match(html, /<\/textarea><p id="capture-help"[^>]*>Capture sends your text to OpenAI for AI interpretation/);
  assert.match(html, /id="capture-help"[^>]*>[\s\S]*?href="\/privacy"/);
});

test("middleware permits signed-out policy routes while protecting the workspace", async () => {
  const { default: middleware } = load("middleware.ts", {
    "@clerk/nextjs/server": {
      clerkMiddleware: (callback) => callback,
      createRouteMatcher: (patterns) => (request) => patterns.some((pattern) => new RegExp(`^${pattern}$`).test(new URL(request.url).pathname)),
    },
  });
  let protections = 0;
  const auth = { protect: async () => { protections++; } };
  for (const route of ["/privacy", "/terms"]) {
    await middleware(auth, { url: `https://app.eegenu.com${route}` });
    assert.equal(protections, 0);
  }
  await middleware(auth, { url: "https://app.eegenu.com/" });
  assert.equal(protections, 1);
});
