import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, mkdir } from "node:fs/promises";
import { createServer as httpServer, type Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { before, after, test } from "node:test";
import { build, createServer, preview, type ViteDevServer, type PreviewServer } from "vite";
import { readReactRoutePaths } from "../scripts/spa-http-routing";
import { createHttpAppWithoutDatabase } from "../../api-server/test/helpers/http-app-without-db";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = process.env.A30_HTTP_OUTPUT_DIR;
if (!output || !path.isAbsolute(output) || !output.startsWith("/tmp/")) {
  throw new Error("Set A30_HTTP_OUTPUT_DIR to an isolated /tmp output directory.");
}
const outDir = path.join(output, "web");
const configFile = path.join(root, "vite.config.ts");
const routePaths = readReactRoutePaths(path.join(root, "src/App.tsx"));
const targets: Array<{ name: string; url: string }> = [];
let dev: ViteDevServer | undefined;
let built: PreviewServer | undefined;
let api: Server | undefined;
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

before(async () => {
  await mkdir(output, { recursive: true });
  api = httpServer(await createHttpAppWithoutDatabase());
  await new Promise<void>(resolve => api!.listen(0, "127.0.0.1", resolve));
  const address = api.address();
  assert.ok(address && typeof address !== "string");
  process.env.API_PROXY_TARGET = `http://127.0.0.1:${address.port}`;
  const shared = {
    configFile, configLoader: "runner" as const, root, envFile: false as const, cacheDir: path.join(output, "vite-cache"),
    logLevel: "warn" as const, optimizeDeps: { noDiscovery: true, include: [] },
  };
  // NODE_ENV=test must not silently turn the production bundle into a
  // development React bundle. Restore it before testing the dev server.
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await build({ ...shared, build: { outDir, emptyOutDir: true } });
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
  dev = await createServer({
    ...shared,
    server: { host: "127.0.0.1", port: 0, strictPort: false, hmr: false, watch: null },
  });
  await dev.listen();
  const devAddress = dev.httpServer!.address();
  assert.ok(devAddress && typeof devAddress !== "string");
  built = await preview({
    ...shared, build: { outDir },
    preview: { host: "127.0.0.1", port: 0, strictPort: false },
  });
  const builtAddress = built.httpServer.address();
  assert.ok(builtAddress && typeof builtAddress !== "string");
  targets.push(
    { name: "actual Vite development", url: `http://127.0.0.1:${devAddress.port}` },
    { name: "actual Vite build preview", url: `http://127.0.0.1:${builtAddress.port}` },
  );
  console.info(`HTTP matrix: ${routePaths.length} JSX routes; actual app middleware with a stub data router; no database.`);
}, { timeout: 60000 });

after(async () => {
  await dev?.close();
  if (built) await new Promise<void>((resolve, reject) => built!.httpServer.close(error => error ? reject(error) : resolve()));
  if (api) await new Promise<void>((resolve, reject) => api!.close(error => error ? reject(error) : resolve()));
});

// Every literal path in the real React router, not a hand-selected subset.
for (const route of routePaths) {
  const pathname = route.replace(/:id\b/g, "7");
  for (const method of ["GET", "HEAD"]) {
    test(`${method} React deep link ${pathname} remains SPA on dev and build preview`, async () => {
      for (const target of targets) {
        const response = await fetch(target.url + pathname + "?a30=deep-link", { method, headers: { Accept: "text/html" } });
        assert.equal(response.status, 200, target.name);
        assert.match(response.headers.get("content-type") ?? "", /text\/html/);
        const body = await response.text();
        if (method === "HEAD") assert.equal(body, "");
        else assert.match(body, /id="root"/);
      }
    });
  }
}

const files = [
  ["/portfolio/index.html", "text/html"],
  ["/portfolio/projects/index.html", "text/html"],
  ["/stream/animated-effects/index.html", "text/html"],
  ["/prototypes/minigames/evolution/index.html", "text/html"],
  ["/prototypes/minigames/core-clash/index.html", "text/html"],
  ["/prototypes/minigames/core-clash-v149-5/index.html", "text/html"],
  ["/prototypes/minigames/core-clash-unity/index.html", "text/html"],
  ["/prototypes/randomizers/wheel/index.html", "text/html"],
  ["/prototypes/randomizers/pinball/index.html", "text/html"],
  ["/prototypes/randomizers/cards/index.html", "text/html"],
  ["/prototypes/minigames/core-clash-unity/Build/WebGL.loader.js", "javascript"],
  ["/prototypes/minigames/core-clash-unity/Build/WebGL.framework.js", "javascript"],
  ["/prototypes/minigames/core-clash-unity/Build/WebGL.wasm", "application/wasm"],
  ["/prototypes/minigames/core-clash-unity/Build/WebGL.data", "application/octet-stream"],
] as const;
for (const [pathname, mime] of files) {
  for (const method of ["GET", "HEAD"]) {
    test(`${method} existing ${pathname} retains MIME and exact bytes`, async () => {
      const expected = await readFile(path.join(root, "public", pathname));
      for (const target of targets) {
        const response = await fetch(target.url + pathname, { method });
        assert.equal(response.status, 200, target.name);
        assert.ok((response.headers.get("content-type") ?? "").includes(mime), `${target.name}: ${response.headers.get("content-type")}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (method === "HEAD") assert.equal(bytes.length, 0);
        else assert.equal(sha256(bytes), sha256(expected), target.name);
      }
    });
  }
}
for (const [pathname] of files.filter(([name]) => name.endsWith("/index.html"))) {
  for (const entry of [pathname.slice(0, -10), pathname.slice(0, -11)]) {
  for (const method of ["GET", "HEAD"]) {
    test(`${method} standalone directory ${entry} is not the parent SPA`, async () => {
      const expected = await readFile(path.join(root, "public", pathname));
      for (const target of targets) {
        const response = await fetch(target.url + entry + "?a30=entry", { method });
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type") ?? "", /text\/html/);
        const bytes = new Uint8Array(await response.arrayBuffer());
        assert.equal(method === "HEAD" ? bytes.length : sha256(bytes), method === "HEAD" ? 0 : sha256(expected), target.name);
      }
    });
  }
  }
}

for (const method of ["GET", "HEAD"]) {
  test(`${method} explicit main index.html remains available`, async () => {
    for (const target of targets) {
      const response = await fetch(target.url + "/index.html", { method });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", /text\/html/);
      if (method === "HEAD") assert.equal(await response.text(), "");
      else assert.match(await response.text(), /id="root"/);
    }
  });
  test(`${method} encoded missing JS filename never becomes a dynamic SPA id`, async () => {
    for (const target of targets) {
      const response = await fetch(target.url + "/tournaments/a30-missing%2Ejs", { method, headers: { Accept: "text/html" } });
      assert.equal(response.status, 404);
      assert.doesNotMatch(await response.text(), /id="root"/);
    }
  });
}

for (const suffix of ["js", "css", "wasm", "data", "unityweb", "gz", "br", "map", "woff", "woff2", "ttf", "otf", "eot", "png", "json"]) {
  for (const prefix of ["/assets/", "/prototypes/minigames/core-clash-unity/Build/", "/tournaments/"]) {
    for (const method of ["GET", "HEAD"]) {
      const pathname = `${prefix}a30-missing.${suffix}`;
      test(`${method} missing ${pathname} is HTTP 404 even with HTML Accept`, async () => {
        for (const target of targets) {
          const response = await fetch(target.url + pathname + "?v=1", { method, headers: { Accept: "text/html" } });
          assert.equal(response.status, 404, target.name);
          assert.doesNotMatch(response.headers.get("content-type") ?? "", /text\/html/);
          const body = await response.text();
          assert.doesNotMatch(body, /id="root"/);
          if (method === "HEAD") assert.equal(body, "");
        }
      });
    }
  }
}
for (const pathname of ["/a30-no-route", "/tournaments/7/a30-no-route", "/portfolio/a30-missing", "/assets/a30-missing", "/prototypes/minigames/core-clash-unity/a30-missing"]) {
  for (const method of ["GET", "HEAD", "POST"]) {
    test(`${method} unknown extensionless ${pathname} is HTTP 404`, async () => {
      for (const target of targets) {
        const response = await fetch(target.url + pathname, { method, headers: { Accept: "*/*" } });
        assert.equal(response.status, 404, target.name);
        assert.doesNotMatch(await response.text(), /id="root"/);
      }
    });
  }
}
for (const pathname of ["/api", "/api/a30-missing", "/api/a30-missing.js"]) {
  for (const method of ["GET", "HEAD", "POST"]) {
    test(`${method} ${pathname} is JSON HTTP 404, not SPA`, async () => {
      for (const target of targets) {
        const response = await fetch(target.url + pathname, { method });
        assert.equal(response.status, 404, target.name);
        assert.match(response.headers.get("content-type") ?? "", /application\/json/);
        if (method === "HEAD") assert.equal(await response.text(), "");
        else assert.deepEqual(await response.json(), { error: "API route not found", code: "API_NOT_FOUND" });
      }
    });
  }
}
test("existing mounted API route remains proxied to actual createApp middleware", async () => {
  for (const target of targets) {
    const response = await fetch(target.url + "/api/a30-existing");
    assert.equal(response.status, 200, target.name);
    assert.deepEqual(await response.json(), { fixture: true });
  }
});
test("built JS and CSS retain bytes and MIME rather than SPA", async () => {
  for (const name of await readdir(path.join(outDir, "assets"))) {
    if (!/\.(?:js|css)$/.test(name)) continue;
    const response = await fetch(targets[1].url + "/assets/" + name);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", name.endsWith(".js") ? /javascript/ : /text\/css/);
    assert.equal(sha256(new Uint8Array(await response.arrayBuffer())), sha256(await readFile(path.join(outDir, "assets", name))));
  }
});
test("production external static wildcard remains explicitly unmodified and unverified", async () => {
  const artifact = await readFile(path.join(root, ".replit-artifact/artifact.toml"), "utf8");
  assert.match(artifact, /serve = "static"/);
  assert.match(artifact, /from = "\/\*"\s+to = "\/index.html"/);
});
