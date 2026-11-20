// QW-08 · Classic look: one Classic-only stylesheet (static, no blur, readable small text, enough contrast),
// the Classic marker on Classic surfaces only, and a Classic bracket header that is a plain row, not an overlay.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { Layout } from "@/components/layout";
import TournamentBracket from "@/pages/tournament-bracket";

const here = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(here, "classic.css"), "utf8");
const index = readFileSync(path.join(here, "index.css"), "utf8");
const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; window.localStorage.clear(); window.sessionStorage.clear(); });

test("QW-08: the Classic stylesheet is loaded after the Modern ones and every rule is scoped to Classic", () => {
  const imports = [...index.matchAll(/@import "\.\/([^"]+)";/g)].map((m) => m[1]);
  assert.ok(imports.indexOf("classic.css") > imports.indexOf("experimental-v511.css"), "loaded last, so it wins equal-specificity rules");
  const selectors = css.replace(/\/\*[\s\S]*?\*\//g, "").split("}").map((block) => block.split("{")[0].trim()).filter(Boolean);
  assert.ok(selectors.length >= 5);
  for (const selector of selectors) {
    for (const part of selector.split(/,(?![^(]*\))/)) assert.match(part.trim(), /^\[data-ui="classic"\] /, `scoped: ${part.trim()}`);
  }
  const flat = css.replace(/\s+/g, " ");
  assert.match(flat, /:is\(\.animate-pulse, \.animate-ping, \.animate-bounce\) \{ animation: none; \}/, "no endless motion");
  assert.doesNotMatch(flat, /animate-spin/, "loading spinners keep turning");
  assert.match(flat, /backdrop-filter: none/);
  assert.match(flat, /:not\(\.experimental-bracket-canvas \*\) \{ font-size: 0\.75rem;/, "small text ≥ 12 px outside the zoomable bracket");
});

function renderLayout(path: string) {
  const location = memoryLocation({ path });
  globalThis.fetch = (async () => new Response("[]", { headers: { "content-type": "application/json" } })) as typeof fetch;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider><Layout><p>treść</p></Layout></AuthProvider></Router></QueryClientProvider>);
}

test("QW-08: Classic pages carry the Classic marker; Modern pages do not", () => {
  const classic = renderLayout("/tournaments/1");
  assert.equal(classic.container.querySelector("[data-ui]")?.getAttribute("data-ui"), "classic");
  cleanup();
  const modern = renderLayout("/experimental/tournaments/1");
  assert.equal(modern.container.querySelector('[data-ui="classic"]'), null);
});

function mountBracket(pathname: string) {
  const tournament = { id: 1, name: "Bardzo długa nazwa turnieju klubowego", format: "double_elimination", status: "active", activeStageId: 1, currentRound: 1, totalRounds: 4, visibility: "public_online" };
  const stages = [{ id: 1, tournamentId: 1, position: 1, name: "Etap 1", format: "double_elimination", status: "active", currentRound: 1, totalRounds: 4, participantCount: 4, bestOf: 1, winnerId: null }];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.endsWith("/stages") ? stages : url.endsWith("/tournaments/1") ? tournament : url.endsWith("/bracket") ? { tournament, rounds: [] } : url.endsWith("/double-elimination") ? null : [];
    return new Response(JSON.stringify(body), { status: body === null ? 404 : 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const location = memoryLocation({ path: pathname });
  return render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider><TournamentBracket /></AuthProvider></Router></QueryClientProvider>);
}

test("QW-08: the Classic bracket header is a plain row with a readable title and Polish format name", async () => {
  const { container } = mountBracket("/tournaments/1/bracket");
  const title = await screen.findByRole("heading", { level: 1, name: "Bardzo długa nazwa turnieju klubowego" });
  assert.equal(container.firstElementChild?.getAttribute("data-ui"), "classic");
  assert.doesNotMatch(title.className, /text-transparent|bg-clip-text|font-deadlock/, "plain text, no gradient display font");
  const nav = screen.getByRole("link", { name: /Wróć do turnieju/ }).parentElement!;
  assert.doesNotMatch(nav.className, /\babsolute\b/, "navigation no longer floats over the title");
  await waitFor(() => assert.match(title.nextElementSibling!.textContent!, /Podwójna eliminacja/));
  const subtitle = title.nextElementSibling!.textContent!;
  assert.equal(subtitle.startsWith("Etap 1 · Podwójna eliminacja"), true, subtitle);
  assert.doesNotMatch(subtitle, /DOUBLE_ELIMINATION|Etap 1 — Etap 1/);
});

test("QW-08: the Modern bracket keeps its own presentation", async () => {
  const { container } = mountBracket("/experimental/tournaments/1/bracket");
  const title = await screen.findByRole("heading", { level: 1 });
  assert.equal(container.querySelector('[data-ui="classic"]'), null);
  assert.match(title.className, /font-deadlock/);
  assert.match(screen.getByRole("link", { name: /Wróć do turnieju/ }).parentElement!.className, /\babsolute\b/);
});
