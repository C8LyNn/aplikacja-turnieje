/**
 * Dependency-free Chrome DevTools Protocol smoke test for the embedded
 * Animated Effects editor. Runs against built static files, never API or DB.
 *
 * Usage:
 *   node artifacts/animated-effects/scripts/browser-smoke.mjs
 *
 * Requires Node 22+ and Chrome/Chromium. Screenshots and a JSON summary are
 * written to AE_BROWSER_QA_OUTPUT (default: .cache/animated-effects-browser-qa).
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "../../..");
const publicRoot = path.resolve(rootDir, "artifacts/tournament-manager/dist/public");
const outputDir = path.resolve(rootDir, process.env.AE_BROWSER_QA_OUTPUT || ".cache/animated-effects-browser-qa");
const timeoutMs = Number(process.env.AE_BROWSER_QA_TIMEOUT_MS || "25000");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    const test = spawnSync(candidate, ["--version"], { encoding: "utf8", timeout: 5000 });
    if (test.status === 0) return candidate;
  }
  throw new Error("Chrome/Chromium not found. Set CHROME_BIN.");
}

function staticServer() {
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff2": "font/woff2",
    ".webp": "image/webp",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
  };
  const requests = [];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    requests.push(pathname);
    if (!pathname.startsWith("/stream/animated-effects/") ||
        pathname.includes("\\") || pathname.includes("\0")) {
      response.writeHead(404);
      response.end("Not found (backend deliberately disabled)");
      return;
    }
    const filename = path.resolve(publicRoot, "." + pathname);
    if (!filename.startsWith(publicRoot + path.sep)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    try {
      const bytes = await readFile(filename);
      response.writeHead(200, {
        "content-type": mime[path.extname(filename)] || "application/octet-stream",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  return { server, requests };
}

async function connectCdp(port) {
  let tabs;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:" + port + "/json/list");
      tabs = await response.json();
      if (tabs.some((entry) => entry.type === "page")) break;
    } catch {}
    await sleep(100);
  }
  const target = tabs?.find((entry) => entry.type === "page");
  assert.ok(target, "CDP page target not created");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let seq = 0;
  const pending = new Map();
  const handlers = new Set();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== undefined) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      clearTimeout(waiter.timer);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result || {});
    } else {
      for (const handler of handlers) handler(message);
    }
  });
  socket.addEventListener("close", () => {
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error("CDP connection closed"));
    }
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timed out: " + method));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { send, on: (fn) => handlers.add(fn), close: () => socket.close() };
}

async function run() {
  await mkdir(outputDir, { recursive: true });
  const report = {
    runAt: new Date().toISOString(),
    chrome: findChrome(),
    cases: [],
    exceptions: [],
    consoleErrors: [],
    externalRequests: [],
    localRequests: [],
  };
  const record = (name, details = {}) => {
    report.cases.push({ name, result: "PASS", ...details });
    console.log("PASS", name);
  };
  const fail = (name, error) => {
    report.cases.push({ name, result: "FAIL", message: String(error) });
    throw error;
  };

  let server;
  let chrome;
  let client;
  let userData;
  let port;
  try {
    const staticAssets = staticServer();
    server = staticAssets.server;
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const webPort = server.address().port;
    const origin = "http://127.0.0.1:" + webPort;
    const editorUrl = origin + "/stream/animated-effects/index.html";
    userData = await mkdtemp(path.join(tmpdir(), "ae-chrome-"));
    chrome = spawn(findChrome(), [
      "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
      "--disable-background-networking", "--no-first-run",
      "--no-default-browser-check", "--disable-extensions",
      "--remote-allow-origins=*", "--remote-debugging-port=0",
      "--user-data-dir=" + userData, "--window-size=1280,900", "about:blank",
    ], { stdio: "ignore" });

    for (let i = 0; i < 100; i++) {
      if (chrome.exitCode !== null) throw new Error("Chrome exited before DevTools was ready");
      try {
        const data = await readFile(path.join(userData, "DevToolsActivePort"), "utf8");
        port = Number(data.split("\n")[0]);
        if (port) break;
      } catch {}
      await sleep(100);
    }
    assert.ok(port, "Chrome did not start DevTools");
    client = await connectCdp(port);
    const { send } = client;
    let mainFrameId;
    const contexts = new Map();

    client.on((message) => {
      if (message.method === "Runtime.exceptionThrown") {
        const error = message.params?.exceptionDetails;
        report.exceptions.push(error?.exception?.description || error?.text || "Runtime exception");
      }
      if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
        report.consoleErrors.push(message.params.args?.map((arg) => arg.value || arg.description).join(" ") || "console.error");
      }
      if (message.method === "Runtime.executionContextCreated") {
        const c = message.params?.context;
        if (c?.auxData?.frameId) contexts.set(c.id, c.auxData);
      }
      if (message.method === "Runtime.executionContextDestroyed") contexts.delete(message.params.executionContextId);
      if (message.method === "Runtime.executionContextsCleared") contexts.clear();
      if (message.method === "Network.requestWillBeSent") {
        const url = message.params?.request?.url;
        if (typeof url !== "string") return;
        if (url.startsWith(origin + "/")) report.localRequests.push(url);
        else if (/^https?:/.test(url)) report.externalRequests.push(url);
      }
    });
    await Promise.all([
      send("Page.enable"),
      send("Runtime.enable"),
      send("Network.enable"),
      send("Log.enable"),
    ]);
    const navigation = await send("Page.navigate", { url: editorUrl });
    mainFrameId = navigation.frameId;

    const evalJs = async (expression, contextId) => {
      const result = await send("Runtime.evaluate", {
        expression, awaitPromise: true, returnByValue: true,
        ...(contextId === undefined ? {} : { contextId }),
      });
      if (result.exceptionDetails) {
        const exc = result.exceptionDetails;
        throw new Error("Browser expression failed: " + (exc.exception?.description || exc.text));
      }
      return result.result?.value;
    };
    const wait = async (description, expr, contextId, maxMs = timeoutMs) => {
      const until = Date.now() + maxMs;
      let lastError;
      while (Date.now() < until) {
        try {
          const value = await evalJs(expr, contextId);
          if (value) return value;
        } catch (error) { lastError = error; }
        await sleep(150);
      }
      throw new Error(description + " timed out" + (lastError ? ": " + lastError : ""));
    };
    const act = (expression) => evalJs(expression);
    const frameState = async () => {
      for (const [id, info] of contexts) {
        if (!info.isDefault || info.frameId === mainFrameId) continue;
        try {
          const state = await evalJs("({root:!!document.getElementById('animated-effects-root'),count:document.getElementById('animated-effects-root')?.children.length||0,blocked:(()=>{try{return !window.parent.document}catch(e){return e.name==='SecurityError'}})()})", id);
          if (state?.root) return { ...state, contextId: id };
        } catch {}
      }
      return null;
    };

    try {
      await wait("Editor startup", "document.readyState==='complete'&&!!document.querySelector('.ae-app-shell')&&!!document.querySelector('#layer-count')");
      const layers = await act("document.querySelector('#layer-count')?.textContent.trim()");
      assert.ok(Number(layers) >= 1, "Default effect layer missing");
      record("editor loads with a default effect", { layers: Number(layers) });

      await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
      await act("document.querySelector('#export-stream-elements').click()");
      await wait("Export modal", "document.querySelector('#stream-elements-export')?.open===true");
      await wait("Sandbox preview ready", "!document.querySelector('[data-simulator-reset]').disabled");
      const exportLengths = await act("Object.fromEntries(['html','css','javascript'].map(k=>[k,document.querySelector('[data-export=\"'+k+'\"]').value.length]))");
      assert.ok(exportLengths.html > 10 && exportLengths.css > 10 && exportLengths.javascript > 500);
      record("export generates non-empty standalone HTML/CSS/JS", exportLengths);

      const startupFrame = await wait("Widget sandbox", "!!document.querySelector('[data-simulator-frame] iframe[sandbox=\"allow-scripts\"]')");
      assert.ok(startupFrame);
      const startupContext = await frameState();
      assert.ok(startupContext?.blocked, "Sandbox iframe can read parent document");
      assert.ok(startupContext.count >= 1, "Always-on widget did not start");
      record("true sandbox isolated from editor and always-on renderer starts");

      await act("(()=>{const mode=document.querySelector('[data-trigger-mode]'); mode.value='chat-command'; mode.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await wait("Chat preview ready", "!document.querySelector('[data-simulator-reset]').disabled&&document.querySelector('[data-simulator-event] option')?.textContent.includes('Czat')");
      let chatContext;
      const chatDeadline = Date.now() + 10000;
      while (Date.now() < chatDeadline && !chatContext) {
        chatContext = await frameState();
        if (!chatContext?.root || !chatContext.blocked) chatContext = null;
        if (!chatContext) await sleep(100);
      }
      assert.ok(chatContext, "No isolated chat runtime context");
      assert.equal(chatContext.count, 0, "Event-driven widget should start transparent");
      await act("document.querySelector('[data-simulator-fire]').click()");
      await wait("Chat event starts scene", "document.querySelector('[data-simulator-status]')?.textContent.includes('Aktywna animacja')");
      const afterChat = await frameState();
      assert.ok(afterChat?.count >= 1, "Chat command did not activate an effect");
      record("chat command starts sandbox widget");

      await act("(()=>{const toggle=document.querySelector('[data-multi-routes]');toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await wait("Multi-rule card", "document.querySelectorAll('[data-route-id]').length===1");
      await act("(()=>{const input=document.querySelector('[data-route-command]');input.value='!fire';input.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await act("document.querySelector('[data-add-route]').click()");
      await wait("Second rule", "document.querySelectorAll('[data-route-id]').length===2");
      await act("(()=>{const cards=document.querySelectorAll('[data-route-id]');const mode=cards[1].querySelector('[data-route-mode]');mode.value='raid';mode.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await wait("Two simulator routes", "document.querySelectorAll('[data-simulator-event] option').length===2&&!document.querySelector('[data-simulator-reset]').disabled");
      const scripts = await act("document.querySelector('[data-export=\"javascript\"]').value");
      assert.match(scripts, /"chatCommand":"!fire"/);
      assert.match(scripts, /"mode":"raid"/);
      const opts = await act("Array.from(document.querySelector('[data-simulator-event]').options,x=>x.textContent)");
      assert.ok(opts.some((x) => x.includes("!fire")) && opts.some((x) => x.includes("Raid")));
      record("two rules export selected layers and event selectors", { eventNames: opts });

      await act("(()=>{const input=document.querySelector('[data-profile-name]');input.value='Browser QA';document.querySelector('[data-profile-save]').click();})()");
      await wait("Profile saved", "document.querySelector('[data-profile-status]')?.textContent.startsWith('Zapisano zestaw')");
      const profiles = await act("JSON.parse(localStorage.getItem('animated-effects:se-profiles:v1')||'[]').map(p=>({name:p.name,mode:p.trigger.mode,routes:p.routes?.length,effects:p.scene.effects.length}))");
      assert.ok(profiles.some((profile) => profile.routes === 2 && profile.effects >= 1), "Saved profile is incomplete");
      record("profile persists whole scene and both routing rules", { profiles });

      for (const [width, height] of [[1280, 900], [768, 950], [390, 844]]) {
        await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 390 });
        await sleep(350);
        const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        const file = "animated-effects-" + width + ".png";
        await writeFile(path.join(outputDir, file), Buffer.from(screenshot.data, "base64"));
        const geometry = await act("({bodyWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,dialogOpen:document.querySelector('#stream-elements-export').open})");
        assert.ok(geometry.dialogOpen, "Dialog closed on resize");
        record("screenshot and responsive smoke: " + width + "px", { screenshot: file, geometry });
      }
      await act("document.querySelector('[data-export-close]').click()");
      await wait("Simulator cleanup", "document.querySelector('[data-simulator-frame] iframe')===null");
      record("closing export modal destroys sandbox iframe");
      assert.deepEqual(report.exceptions, [], "Uncaught browser exceptions");
      assert.deepEqual(report.consoleErrors, [], "Browser console.error calls");
      assert.deepEqual(report.externalRequests, [], "External network request during isolated test");
      assert.ok(!report.localRequests.some((url) => url.includes("/api/")), "Unexpected backend call");
      record("no JS exceptions, console errors, remote dependencies or backend calls");
    } catch (error) {
      fail("browser smoke suite", error);
    }
  } catch (error) {
    console.error("FAIL", error.stack || String(error));
    report.fatal = error.stack || String(error);
    process.exitCode = 1;
  } finally {
    if (client) client.close();
    if (chrome) {
      chrome.kill("SIGTERM");
      await sleep(200);
      if (chrome.exitCode === null) chrome.kill("SIGKILL");
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    if (userData) await rm(userData, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
    await writeFile(path.join(outputDir, "results.json"), JSON.stringify(report, null, 2));
    console.log("QA report:", path.join(outputDir, "results.json"));
  }
}
await run();
