// QW-03b · Classic "Szybki wybór": the Classic creator offers the Modern presets, with estimates from the server,
// and a chosen preset creates exactly the tournament the Modern wizard creates for the same choice.
import type React from "react";
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
import { parsePresetPreviewRequest, parseWizardAnswers, previewPreset, recommendPresets } from "../../../api-server/src/domain/tournament/tournament-presets";
import CreateTournament from "./create-tournament";
import CreateTournamentExperimental from "@/pages/experimental/tournaments/create-tournament-experimental";
import { PRESET_LABELS, WIZARD_DRAFT_KEY, type PresetId, type PresetPreview } from "@/features/experimental-tournaments/experimental-create-wizard-model";
import { estimateText, QUICK_PRESETS } from "@/lib/classic-quick-presets";

const originalFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
interface Call { url: string; method: string; body: any }

function installFetch() {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method: init?.method ?? "GET", body });
    if (url.includes("/api/healthz")) return json({ status: "ok" });
    try {
      if (url.includes("/api/tournaments/presets/recommend")) return json(recommendPresets(parseWizardAnswers(body)));
      if (url.includes("/api/tournaments/presets/preview")) return json(previewPreset(parsePresetPreviewRequest(body)));
    } catch (error) {
      const e = error as { code: string; message: string; param?: string };
      return json({ code: e.code, error: e.message, param: e.param }, 422);
    }
    if (url.endsWith("/api/tournaments") && init?.method === "POST") {
      return json({ id: 77, name: body.name, format: body.format, status: "draft", defaultBestOf: 1, organizerToken: "token-77", createdAt: "2026-01-01T00:00:00.000Z" }, 201);
    }
    return json({ error: `unexpected ${url}` }, 404);
  }) as typeof fetch;
  return calls;
}

function renderAt(path: string, Component: () => React.ReactElement | null) {
  window.localStorage.setItem("tm_role", "organizer");
  const location = memoryLocation({ path, record: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const view = render(
    <QueryClientProvider client={client}>
      <Router hook={location.hook}>
        <AuthProvider><Component /></AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
  return { ...view, location, client };
}

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  window.localStorage.clear();
});

const createCall = (calls: Call[]) => calls.find((call) => call.url.endsWith("/api/tournaments") && call.method === "POST");
/** Draw keys are fresh per create by design; everything else must be identical. */
const normalize = (payload: any) => JSON.parse(JSON.stringify(payload).replace(/"draw-[0-9a-z-]+"/g, '"draw"'));
const card = (presetId: PresetId) => document.querySelector<HTMLElement>(`[data-testid="quick-preset"][data-preset="${presetId}"]`)!;

async function chooseQuick(count: string, presetId: PresetId) {
  fireEvent.change(screen.getByLabelText("Liczba uczestników"), { target: { value: count } });
  fireEvent.click(within(card(presetId)).getByRole("radio"));
  await waitFor(() => assert.ok(!screen.getByTestId("quick-preset-summary").textContent?.includes("liczę układ"), "preview ready"));
}

function fillAndSubmit(name = "Parytet") {
  fireEvent.change(screen.getByLabelText("Nazwa turnieju *"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Hasło organizatora *"), { target: { value: "organizer-pass-1" } });
  fireEvent.click(screen.getByRole("button", { name: "Utwórz turniej" }));
}

test("QW-03b: nothing is fetched until a count is given; the five presets are offered", async () => {
  const calls = installFetch();
  renderAt("/tournaments/new", CreateTournament);
  const section = screen.getByTestId("classic-quick-presets");
  assert.deepEqual(
    within(section).getAllByTestId("quick-preset").map((node) => node.querySelector(".font-medium")?.textContent),
    ["Szybki puchar", "Dwie szanse", "Każdy z każdym", "Szwajcarski", "Grupy i play-off"],
  );
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.equal(calls.filter((call) => call.url.includes("/presets/")).length, 0, "no preset request on page load");
  assert.ok(screen.getByLabelText("Turniej wieloetapowy"), "the manual format section stays as it was");
});

test("QW-03b: each card shows the server's estimate for the given count", async () => {
  const calls = installFetch();
  renderAt("/tournaments/new", CreateTournament);
  fireEvent.change(screen.getByLabelText("Liczba uczestników"), { target: { value: "12" } });
  await waitFor(() => assert.equal(screen.getAllByTestId("quick-preset-estimate").length, 5));
  const expected = recommendPresets(parseWizardAnswers({ participantCount: 12, priority: "short" })).recommendations;
  for (const item of QUICK_PRESETS) {
    const server = expected.find((entry) => entry.presetId === item.presetId)!;
    assert.equal(within(card(item.presetId)).getByTestId("quick-preset-estimate").textContent, estimateText(server.preview as unknown as PresetPreview));
  }
  assert.equal(within(card("single_elimination")).getByTestId("quick-preset-estimate").textContent, "≈ 11 meczów · 4 rundy");
  assert.equal(calls.filter((call) => call.url.includes("/presets/recommend")).length, 1, "one request for all five cards");
});

test("QW-03b: too few participants for groups — the card says why and cannot be picked", async () => {
  installFetch();
  renderAt("/tournaments/new", CreateTournament);
  fireEvent.change(screen.getByLabelText("Liczba uczestników"), { target: { value: "3" } });
  await waitFor(() => assert.ok(within(card("groups_playoff")).queryByTestId("quick-preset-estimate")));
  assert.match(within(card("groups_playoff")).getByTestId("quick-preset-estimate").textContent!, /Dostępne dla \d+–\d+ uczestników/);
  assert.equal((within(card("groups_playoff")).getByRole("radio") as HTMLInputElement).disabled, true);
  fireEvent.change(screen.getByLabelText("Liczba uczestników"), { target: { value: "500" } });
  assert.ok(screen.getByText("Podaj liczbę od 2 do 128."));
});

for (const item of QUICK_PRESETS) {
  test(`QW-03b: "${item.label}" creates exactly what the Modern wizard creates for the same choice`, async () => {
    const modernCalls = installFetch();
    window.sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify({ step: 3, maxVisitedStep: 3, presetId: item.presetId, answers: { participantCount: 12 }, name: "Parytet" }));
    renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
    await screen.findByRole("heading", { name: "Nazwij turniej i zabezpiecz go" });
    await waitFor(() => {
      const panel = screen.getByLabelText("Podgląd rozgrywek");
      assert.ok(panel.textContent?.includes(PRESET_LABELS[item.presetId]) && panel.textContent.includes("Mecze") && panel.getAttribute("aria-busy") !== "true", "Modern preview ready");
    });
    // The wizard's own preview request starts after a short debounce; create only once it has been answered.
    await waitFor(() => assert.ok(modernCalls.some((call) => call.url.includes("/presets/preview"))));
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.change(screen.getByLabelText(/Hasło organizatora/), { target: { value: "organizer-pass-1" } });
    await waitFor(() => assert.equal((screen.getByRole("button", { name: /Utwórz turniej/ }) as HTMLButtonElement).disabled, false));
    fireEvent.click(screen.getByRole("button", { name: /Utwórz turniej/ }));
    await waitFor(() => assert.ok(createCall(modernCalls)));
    const modernPreview = modernCalls.filter((call) => call.url.includes("/presets/preview")).at(-1)!.body;
    const modern = createCall(modernCalls)!.body;
    cleanup();
    window.sessionStorage.clear();

    const classicCalls = installFetch();
    const { location } = renderAt("/tournaments/new", CreateTournament);
    await chooseQuick("12", item.presetId);
    assert.equal(screen.queryByLabelText("Turniej wieloetapowy"), null, "the manual format section is replaced by the preset");
    fillAndSubmit();
    await waitFor(() => assert.ok(createCall(classicCalls)));
    assert.deepEqual(classicCalls.filter((call) => call.url.includes("/presets/preview")).at(-1)!.body, modernPreview, "same preview request");
    assert.deepEqual(normalize(createCall(classicCalls)!.body), normalize(modern), "same create payload");
    await waitFor(() => assert.ok(location.history.includes("/tournaments/77")));
  });
}

test("QW-03b: best of 3 goes into the preview and the created tournament; the summary lists the stages", async () => {
  const calls = installFetch();
  renderAt("/tournaments/new", CreateTournament);
  await chooseQuick("16", "groups_playoff");
  const summary = screen.getByTestId("quick-preset-summary");
  assert.ok(within(summary).getByRole("list", { name: "Układ etapów" }).querySelectorAll("li").length >= 2, "groups and play-off listed");
  fireEvent.click(within(summary).getByRole("button", { name: "BO3" }));
  await waitFor(() => assert.ok(calls.some((call) => call.url.includes("/presets/preview") && call.body.params.bestOf === 3)));
  await waitFor(() => assert.ok(!screen.getByTestId("quick-preset-summary").textContent?.includes("liczę układ")));
  fillAndSubmit("BO3 grupy");
  await waitFor(() => assert.ok(createCall(calls)));
  const body = createCall(calls)!.body;
  assert.equal(body.defaultBestOf, 3);
  assert.equal(body.stagePlan.stages[0].bestOf, 3);
  assert.match(body.stagePlan.stages[0].randomSeed ?? "draw-x", /^draw-/);
});

test("QW-03b: a preset that no longer fits blocks creating with a clear message", async () => {
  const calls = installFetch();
  renderAt("/tournaments/new", CreateTournament);
  await chooseQuick("12", "groups_playoff");
  fireEvent.change(screen.getByLabelText("Liczba uczestników"), { target: { value: "3" } });
  await screen.findByTestId("quick-preset-error");
  fillAndSubmit();
  await screen.findByText(/Układ z „Szybkiego wyboru” nie jest jeszcze gotowy/);
  assert.equal(createCall(calls), undefined);
});

test("QW-03b: \"Ustaw format ręcznie\" returns to the manual form, which creates as before", async () => {
  const calls = installFetch();
  renderAt("/tournaments/new", CreateTournament);
  await chooseQuick("8", "swiss");
  fireEvent.click(screen.getByRole("button", { name: "Ustaw format ręcznie" }));
  assert.ok(screen.getByLabelText("Turniej wieloetapowy"));
  assert.equal(screen.queryByTestId("quick-preset-summary"), null);
  fillAndSubmit("Ręczny");
  await waitFor(() => assert.ok(createCall(calls)));
  const body = createCall(calls)!.body;
  assert.equal(body.format, "single_elimination", "the manual default, not the preset");
  assert.equal(body.stagePlan, undefined);
});
