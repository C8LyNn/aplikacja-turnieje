// QW-01 · the format preview must never cover the form, its validation messages or the create/cancel actions.
// Root cause (V5.11): `position: sticky` sat on the preview card itself; in the advanced editor the readiness list
// and "Utwórz turniej" are the card's siblings in the same column, so they slid under the sticky card. The fix makes
// only the whole side column sticky and ends it above the wizard's own sticky action bar (measured height).
import type React from "react";
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
import { parsePresetPreviewRequest, parseWizardAnswers, previewPreset, recommendPresets } from "../../../../api-server/src/domain/tournament/tournament-presets";
import CreateTournamentExperimental from "@/pages/experimental/tournaments/create-tournament-experimental";
import CreateTournamentExperimentalAdvanced from "@/pages/experimental/tournaments/create-tournament-experimental-advanced";
import { syncActionBarHeight } from "./experimental-create-wizard";

const here = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.resolve(here, "..", "..", "experimental-design-system.css"), "utf8");
const originalFetch = globalThis.fetch;
const originalResizeObserver = globalThis.ResizeObserver;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function installFetch() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.includes("/api/healthz")) return json({ status: "ok" });
    if (url.includes("/api/tournaments/presets/recommend")) return json(recommendPresets(parseWizardAnswers(body)));
    if (url.includes("/api/tournaments/presets/preview")) return json(previewPreset(parsePresetPreviewRequest(body)));
    return json({ error: `unexpected ${url}` }, 404);
  }) as typeof fetch;
}
function renderAt(pathname: string, Component: () => React.ReactElement) {
  window.localStorage.setItem("tm_role", "organizer");
  const location = memoryLocation({ path: pathname, record: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <Router hook={location.hook}>
        <AuthProvider><Component /></AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  window.localStorage.clear();
  globalThis.fetch = originalFetch;
  globalThis.ResizeObserver = originalResizeObserver;
});

function fakeBar(height: number) {
  const bar = document.createElement("div");
  bar.getBoundingClientRect = () => ({ height, width: 100, top: 0, left: 0, right: 100, bottom: height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return bar;
}

test("QW-01: the action bar height is published on the wizard root and follows resizes", () => {
  let observed: Element | null = null;
  let notify: (() => void) | null = null;
  let disconnected = false;
  globalThis.ResizeObserver = class {
    constructor(callback: () => void) { notify = callback; }
    observe(target: Element) { observed = target; }
    unobserve() {}
    disconnect() { disconnected = true; }
  } as unknown as typeof ResizeObserver;
  const root = document.createElement("div");
  let height = 68.4;
  const bar = fakeBar(0);
  bar.getBoundingClientRect = () => ({ height } as DOMRect);
  const cleanupFn = syncActionBarHeight(root, bar);
  assert.equal(root.style.getPropertyValue("--x-wizard-actions-h"), "69px", "rounded up so the column never touches the bar");
  assert.equal(observed, bar);
  height = 112; // the bar wrapped to two lines
  notify!();
  assert.equal(root.style.getPropertyValue("--x-wizard-actions-h"), "112px");
  cleanupFn!();
  assert.equal(disconnected, true);
});

test("QW-01: without ResizeObserver the height is still set once; missing elements are a no-op", () => {
  globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
  const root = document.createElement("div");
  assert.equal(syncActionBarHeight(root, fakeBar(73)), undefined);
  assert.equal(root.style.getPropertyValue("--x-wizard-actions-h"), "73px");
  assert.equal(syncActionBarHeight(null, fakeBar(73)), undefined);
  assert.equal(syncActionBarHeight(root, null), undefined);
});

test("QW-01: CSS makes the side column sticky, never the preview card inside a column with siblings", () => {
  const flat = css.replace(/\s+/g, " ");
  assert.ok(!/\) \.experimental-wizard-preview \{ position: sticky/.test(flat), "the preview card itself must not be sticky any more");
  const sticky = flat.match(/\.experimental-wizard-body > :is\(\.experimental-wizard-preview, \.experimental-advanced-side\) \{([^}]*)\}/);
  assert.ok(sticky, "sticky rule targets the direct side column of the wizard body");
  assert.match(sticky![1], /position: sticky/);
  assert.match(sticky![1], /max-height: calc\(100dvh - 2rem - var\(--x-wizard-bar-space, 0px\)\)/, "the column ends above the action bar");
  assert.match(flat, /\.experimental-wizard:has\(> \.experimental-wizard-actions\) \{ --x-wizard-bar-space: var\(--x-wizard-actions-h, 5rem\); \}/);
  assert.match(flat, /\.experimental-advanced-side > \.experimental-advanced-ready \{ flex: none; \}/, "readiness and the create button always stay whole");
  assert.match(flat, /@media \(min-width: 1024px\) and \(max-height: 600px\) \{[^@]*position: static/, "short screens scroll the column with the page");
});

test("QW-01: the simple wizard publishes the measured bar height on its root", async () => {
  installFetch();
  const { container } = renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  await screen.findByRole("button", { name: "Pokaż propozycje" });
  const root = container.querySelector<HTMLElement>(".experimental-wizard");
  assert.ok(root);
  assert.ok(container.querySelector(".experimental-wizard > .experimental-wizard-actions"), "the bar is a direct child, as the :has() rule expects");
  assert.match(root!.style.getPropertyValue("--x-wizard-actions-h"), /^\d+px$/);
});

test("QW-01: advanced editor keeps the preview and the readiness card as siblings of one side column", async () => {
  installFetch();
  const { container } = renderAt("/experimental/tournaments/new/advanced", CreateTournamentExperimentalAdvanced);
  await waitFor(() => assert.ok(container.querySelector(".experimental-advanced-side > .experimental-wizard-preview h3")));
  const side = container.querySelector(".experimental-wizard-body > .experimental-advanced-side");
  assert.ok(side, "the side column is a direct child of the wizard body (the sticky element)");
  const children = [...side!.children].map((el) => el.className.split(" ")[0]);
  assert.deepEqual(children, ["experimental-wizard-preview", "experimental-advanced-ready"]);
  const ready = side!.querySelector(".experimental-advanced-ready")!;
  assert.ok(ready.querySelector("button.experimental-wizard-primary"), "the create button lives in the readiness card");
  assert.ok([...ready.querySelectorAll("a")].some((a) => a.textContent === "Anuluj"));
});
