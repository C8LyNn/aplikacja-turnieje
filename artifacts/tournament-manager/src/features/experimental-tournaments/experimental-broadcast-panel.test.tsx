import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import type { Match, TournamentStage } from "@workspace/api-client-react";
import { ExperimentalBroadcastPanel } from "./experimental-broadcast-panel";
import { organizerDetailTab, organizerMoreItems } from "@/components/tournament-organizer-navigation";
import { deriveOrganizerCapabilities } from "@/lib/organizer-capabilities";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
beforeEach(() => { try { window.localStorage.clear(); } catch { /* storage unavailable in this runner */ } });
afterEach(() => { cleanup(); clients.splice(0).forEach((c) => c.clear()); globalThis.fetch = originalFetch; });

const stage = (id: number, position: number, format: string, status: string, name: string) =>
  ({ id, tournamentId: 5, stageKey: `s${id}`, position, name, format, status, participantCount: 8, bestOf: 1 }) as unknown as TournamentStage;
const match = (id: number, stageId: number, round: number, n: number, p1: string, p2: string, status = "pending") =>
  ({ id, revision: 1, tournamentId: 5, stageId, round, matchNumber: n, bestOf: 1, status, player1Id: id * 10, player2Id: id * 10 + 1, player1Name: p1, player2Name: p2 }) as unknown as Match;
const stages = [stage(1, 1, "group_stage", "active", "Faza grupowa"), stage(2, 2, "single_elimination", "planned", "Play-off")];
const matches = [match(11, 1, 1, 1, "Ada", "Bartek", "in_progress"), match(12, 1, 1, 2, "Celina", "Darek"),
  match(21, 2, 1, 1, "Ada", "Celina"), match(22, 2, 1, 2, "Bartek", "Darek"), match(23, 2, 2, 1, "?", "?")];

function renderPanel({ visibility = "public_online", featuredMatchId = null as number | null, canFeature = true } = {}) {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push({ method: init?.method ?? "GET", url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const body = url.endsWith("/standings") ? { stageId: 1, tables: [{ label: "Grupa A", rows: [] }, { label: "Grupa B", rows: [] }] } : { id: 5 };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const view = render(
    <QueryClientProvider client={client}>
      <Router hook={memoryLocation({ path: "/experimental/tournaments/5?tab=broadcast" }).hook}>
        <ExperimentalBroadcastPanel tournament={{ id: 5, name: "Puchar", visibility, featuredMatchId, activeStageId: 1 }} matches={matches} stages={stages} canFeature={canFeature} />
      </Router>
    </QueryClientProvider>,
  );
  return { calls, view };
}
const address = () => (screen.getByLabelText("Adres nakładki") as HTMLInputElement).value;
const legends = () => [...document.querySelectorAll("legend")].map((l) => l.textContent?.replace(/^\d/, "").trim());

test("six steps in the order a first-time OBS user needs them; advanced settings start folded", () => {
  renderPanel({ featuredMatchId: 11 });
  assert.deepEqual(legends(), ["Nakładka", "Wygląd", "Mecz", "Podgląd", "Adres do OBS", "Dodaj do OBS"]);
  assert.equal((screen.getByTestId("broadcast-advanced") as HTMLDetailsElement).open, false);
  assert.match(screen.getByTestId("broadcast-featured").textContent ?? "", /Ada – Bartek · na żywo/);
  assert.equal(screen.queryByRole("combobox", { name: "Mecz" }), null, "the fixed-match list appears only when chosen");
  assert.match(address(), /\/overlay\.html\?t=5$/);
});

test("the address follows the choices; the preview shows the same address and scene; no credential is ever in it", async () => {
  const user = userEvent.setup();
  renderPanel({ featuredMatchId: 11 });
  await user.click(screen.getByRole("radio", { name: /Sport/ }));
  await user.click(screen.getByRole("radio", { name: /Zapowiedź/ }));
  assert.match(address(), /t=5&widok=zapowiedz&styl=sport$/);
  await user.click(screen.getByRole("radio", { name: /Zawsze ten sam mecz/ }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Mecz" }), "12");
  assert.match(address(), /mecz=12/);
  const frame = screen.getByTitle("Podgląd nakładki");
  assert.equal(frame.getAttribute("src"), address());
  assert.equal(frame.getAttribute("tabindex"), "-1", "the preview is not a keyboard stop");
  assert.doesNotMatch(address(), /token|haslo|password/i);
  await user.selectOptions(screen.getByRole("combobox", { name: "Tło podglądu" }), "ciemna");
  assert.equal(frame.parentElement?.getAttribute("data-scene"), "ciemna");
  assert.ok(screen.getByText(/szerokość 1920/));
  await user.selectOptions(screen.getByRole("combobox", { name: "Rozdzielczość w OBS" }), "1440p");
  assert.ok(screen.getByText(/szerokość 2560/));
  assert.equal(frame.getAttribute("width"), "2560");
});

test("'Na ekranie' changes only on an explicit click; 'Następny mecz' puts the next pending match on screen", async () => {
  const user = userEvent.setup();
  const { calls } = renderPanel({ featuredMatchId: 11 });
  await user.selectOptions(screen.getByRole("combobox", { name: "Zmień mecz na ekranie" }), "21");
  assert.equal(calls.filter((c) => c.method === "PATCH").length, 0, "choosing in the list changes nothing on air");
  await user.click(screen.getByRole("button", { name: /Pokaż na ekranie/ }));
  await waitFor(() => assert.equal(calls.filter((c) => c.method === "PATCH").length, 1));
  assert.deepEqual(calls.find((c) => c.method === "PATCH")!.body, { featuredMatchId: 21 });
  cleanup();
  const second = renderPanel({ featuredMatchId: 11 });
  await user.click(screen.getByRole("button", { name: /Następny mecz/ }));
  await waitFor(() => assert.equal(second.calls.filter((c) => c.method === "PATCH").length, 1));
  assert.deepEqual(second.calls.find((c) => c.method === "PATCH")!.body, { featuredMatchId: 12 }, "next in the queue after the one on screen");
});

test("without a match on screen the panel says what the overlay will show; without write access nothing can be put on screen", () => {
  renderPanel({ featuredMatchId: null });
  assert.ok(screen.getByText(/Żaden mecz nie jest „Na ekranie” — nakładka pokaże komunikat/));
  assert.match(screen.getByTestId("broadcast-on-screen").textContent ?? "", /Na ekranie:\s*żaden mecz/);
  cleanup();
  renderPanel({ visibility: "private_online", canFeature: false });
  assert.match(screen.getByText(/Ten turniej nie jest publiczny/).textContent ?? "", /nigdy nie używa hasła ani tokenu/);
  assert.equal(screen.queryByRole("button", { name: /Pokaż na ekranie|Następny mecz|Usuń z ekranu/ }), null);
});

test("copying confirms clearly and points to the OBS step; a blocked clipboard selects the address instead", async () => {
  const user = userEvent.setup();
  renderPanel({ featuredMatchId: 11 });
  const writes: string[] = [];
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { writes.push(text); } } });
  await user.click(screen.getByRole("button", { name: /Kopiuj adres/ }));
  assert.match((await screen.findByTestId("broadcast-copied")).textContent ?? "", /Adres jest w schowku\. Teraz wklej go w OBS/);
  assert.deepEqual(writes, [address()]);
  assert.ok(screen.getByRole("button", { name: /Skopiowano/ }));
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } });
  await user.click(screen.getByRole("button", { name: /Skopiowano|Kopiuj adres/ }));
  assert.ok(await screen.findByText(/Schowek jest niedostępny — adres jest zaznaczony/));
});

test("choices are kept when the organizer leaves the panel and comes back; 'Przywróć domyślne' resets only the look settings", async () => {
  const user = userEvent.setup();
  renderPanel({ featuredMatchId: 11 });
  await user.click(screen.getByRole("radio", { name: /Futuristic/ }));
  await user.click(screen.getByText("Ustawienia zaawansowane"));
  await user.selectOptions(screen.getByRole("combobox", { name: "Animacje" }), "0");
  await user.selectOptions(screen.getByRole("combobox", { name: "Tekst" }), "1.5");
  const before = address();
  assert.match(before, /styl=futuristic&ruch=0&tekst=1.5/);
  cleanup();
  renderPanel({ featuredMatchId: 11 });
  assert.equal(address(), before, "the same overlay after coming back");
  await user.click(screen.getByText(/Ustawienia zaawansowane/));
  await user.click(screen.getByRole("button", { name: /Przywróć domyślne/ }));
  assert.match(address(), /\?t=5&styl=futuristic$/, "look settings reset, the chosen set stays");
});

test("structure: current stage by default, a group can be chosen from the engine's tables, a bracket round for a cup", async () => {
  const user = userEvent.setup();
  renderPanel();
  await user.click(screen.getByRole("radio", { name: /Tabela i drabinka/ }));
  assert.match(address(), /widok=struktura$/);
  assert.ok(screen.getByRole("option", { name: "Bieżący etap (Faza grupowa)" }));
  const scope = await screen.findByRole("combobox", { name: "Zakres" });
  await user.selectOptions(scope, "Grupa B");
  assert.match(address(), /widok=struktura&grupa=Grupa\+B$/);
  await user.selectOptions(screen.getByRole("combobox", { name: "Etap" }), "2");
  assert.ok(screen.getByText(/Ten etap jeszcze się nie zaczął/));
  await user.selectOptions(screen.getByRole("combobox", { name: "Zakres" }), "Finał");
  assert.match(address(), /etap=2&runda=2$/);
});

test("a 127.0.0.1 / localhost address is explained as working on this computer only", () => {
  renderPanel();
  const local = ["127.0.0.1", "localhost", "[::1]", "::1"].includes(window.location.hostname);
  assert.equal(!!screen.queryByTestId("broadcast-local-note"), local);
});

test("navigation: 'Transmisja' is an optional Experimental area under 'Więcej'; Stable keeps its menu", () => {
  const organizer = deriveOrganizerCapabilities({ role: "organizer", tournament: { hasHostCode: false, hasOrganizerPassword: true }, hasOrganizerToken: true, hasSupportSession: false });
  assert.ok(organizerMoreItems(5, organizer, { broadcast: true }).some((item) => item.area === "broadcast" && item.label === "Transmisja"));
  assert.ok(!organizerMoreItems(5, organizer).some((item) => item.area === "broadcast"), "Stable menu unchanged");
  assert.equal(organizerDetailTab("?tab=broadcast", organizer, { experimental: true }), "broadcast");
  assert.equal(organizerDetailTab("?tab=broadcast", organizer), "stages", "Stable falls back to its default tab");
  const viewer = deriveOrganizerCapabilities({ role: null, tournament: { hasHostCode: false, hasOrganizerPassword: true }, hasOrganizerToken: false, hasSupportSession: false });
  assert.notEqual(organizerDetailTab("?tab=broadcast", viewer, { experimental: true }), "broadcast");
});

test("QW-07: 'Aktualny mecz (automatycznie)' writes mecz=auto, needs no match on screen and remembers the choice", async () => {
  const user = userEvent.setup();
  renderPanel({ featuredMatchId: null });
  assert.ok(screen.getByText(/Żaden mecz nie jest „Na ekranie” — nakładka pokaże komunikat/));
  await user.click(screen.getByRole("radio", { name: /Aktualny mecz \(automatycznie\)/ }));
  assert.match(address(), /\/overlay\.html\?t=5&mecz=auto$/);
  assert.equal(screen.queryByText(/Żaden mecz nie jest „Na ekranie” — nakładka pokaże komunikat/), null, "auto does not depend on the match on screen");
  assert.equal(screen.queryByRole("combobox", { name: "Mecz" }), null);
  assert.equal(screen.getByTitle("Podgląd nakładki").getAttribute("src"), address());
  // the three choices exclude each other
  await user.click(screen.getByRole("radio", { name: /Zawsze ten sam mecz/ }));
  assert.match(address(), /mecz=11$/);
  assert.equal((screen.getByRole("radio", { name: /Aktualny mecz/ }) as HTMLInputElement).checked, false);
  await user.click(screen.getByRole("radio", { name: /Aktualny mecz/ }));
  cleanup();
  renderPanel({ featuredMatchId: null });
  assert.match(address(), /mecz=auto$/, "remembered for this tournament in this browser");
  await user.click(screen.getByRole("radio", { name: /Mecz „Na ekranie” \(zalecane\)/ }));
  assert.match(address(), /\/overlay\.html\?t=5$/, "the V5.9 default address is unchanged");
});
