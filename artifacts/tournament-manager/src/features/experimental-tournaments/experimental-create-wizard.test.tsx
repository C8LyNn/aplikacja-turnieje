import type React from "react";
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
// The real server catalog produces the mocked API responses, so these tests also pin the contract.
import {
  parsePresetPreviewRequest,
  parseWizardAnswers,
  previewPreset,
  recommendPresets,
} from "../../../../api-server/src/domain/tournament/tournament-presets";
import { AI_CONFIG_EXAMPLES, validateAiTournamentConfigText } from "../../../../api-server/src/domain/tournament/ai-tournament-config";
import CreateTournamentExperimental from "@/pages/experimental/tournaments/create-tournament-experimental";
import CreateTournamentExperimentalAdvanced from "@/pages/experimental/tournaments/create-tournament-experimental-advanced";
import {
  ADVANCED_HANDOFF_KEY,
  buildAdvancedHandoff,
  buildCreatePayload,
  clampCount,
  readAdvancedHandoff,
  reconcilePresetAfterAnswers,
  requestParams,
  sanitizeDraft,
  WIZARD_DRAFT_KEY,
  type PresetPreview,
  type PresetRecommendation,
} from "./experimental-create-wizard-model";
import { rosterHealth } from "./experimental-v4-model";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

interface Call { url: string; body: unknown }

function installFetch(options: { createStatus?: number } = {}) {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    if (url.includes("/api/healthz")) return json({ status: "ok" });
    if (url.includes("/api/tournaments/presets/recommend")) return json(recommendPresets(parseWizardAnswers(body)));
    if (url.includes("/api/tournaments/presets/preview")) {
      try {
        return json(previewPreset(parsePresetPreviewRequest(body)));
      } catch (error) {
        const e = error as { code: string; message: string; param?: string };
        return json({ code: e.code, error: e.message, param: e.param }, 422);
      }
    }
    if (url.includes("/api/tournaments/ai-config/validate")) {
      const result = validateAiTournamentConfigText((body as { text: string }).text);
      return json(result, result.valid ? 200 : 422);
    }
    if (url.endsWith("/api/tournaments") && init?.method === "POST") {
      if (options.createStatus && options.createStatus !== 201) return json({ error: "Serwer odrzucił" }, options.createStatus);
      return json({ id: 77, name: (body as { name: string }).name, status: "draft", organizerToken: "token-77" }, 201);
    }
    return json({ error: `unexpected ${url}` }, 404);
  }) as typeof fetch;
  return calls;
}

function renderAt(path: string, Component: () => React.ReactElement) {
  window.localStorage.setItem("tm_role", "organizer");
  const location = memoryLocation({ path, record: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  const view = render(
    <QueryClientProvider client={client}>
      <Router hook={location.hook}>
        <AuthProvider>
          <Component />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
  return { ...view, location, client };
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

// ── model ───────────────────────────────────────────────────────────────────

test("draft sanitizer drops unknown fields, passwords and invalid values", () => {
  const draft = sanitizeDraft({
    step: 3, maxVisitedStep: 9, presetId: "nope", organizerPassword: "secret-value",
    answers: { kind: "cup", participantCount: 999, priority: "accurate", participantType: "teams" },
    params: { groupCount: 4, hack: 1, swissRounds: 2.5 },
    name: "Puchar", visibility: "public_everywhere",
  });
  assert.equal(draft.step, 1, "without a preset the wizard cannot sit past the format step");
  assert.equal(draft.presetId, null);
  assert.equal(draft.answers.kind, "tournament");
  assert.equal(draft.answers.participantType, "teams");
  assert.equal(draft.answers.participantCount, 128);
  assert.equal(draft.answers.priority, "accurate");
  assert.deepEqual(draft.params, { groupCount: 4 });
  assert.equal(draft.visibility, "public_online");
  assert.ok(!JSON.stringify(draft).includes("secret-value"));
  assert.equal(clampCount("1"), 2);
  assert.equal(clampCount("abc"), 8);
});

test("payload: single-stage presets stay flexible, multi-stage presets send the fixed plan", () => {
  const single = previewPreset({ presetId: "swiss", params: { participantCount: 9, swissRounds: 3 } }) as unknown as PresetPreview;
  const payload = buildCreatePayload(single, { name: "  Puchar  ", description: "", visibility: "public_online" }, { organizerPassword: "password-123", supportPassword: " ", viewerPassword: "ignored-here" });
  assert.equal(payload.name, "Puchar");
  assert.equal(payload.format, "swiss");
  assert.equal(payload.swissRounds, 3);
  assert.equal(payload.maxPlayers, 9);
  assert.equal("stagePlan" in payload, false);
  assert.equal(payload.supportPassword, undefined);
  assert.equal(payload.viewerPassword, undefined);

  const multi = previewPreset({ presetId: "groups_playoff", params: { participantCount: 16 } }) as unknown as PresetPreview;
  const multiPayload = buildCreatePayload(multi, { name: "Grupy", description: "Opis", visibility: "private_online" }, { organizerPassword: "password-123", supportPassword: "", viewerPassword: "viewer-pass" });
  assert.equal(multiPayload.stagePlan?.stages.length, 2);
  assert.equal(multiPayload.viewerPassword, "viewer-pass");
  assert.equal(multiPayload.description, "Opis");
});

test("requestParams keeps only tunable keys of the preset and the answered count", () => {
  assert.deepEqual(
    requestParams("single_elimination", { kind: "tournament", participantType: "players", participantCount: 12, grouping: "any", priority: "short" }, { bestOf: 3, groupCount: 4 }),
    { participantCount: 12, bestOf: 3 },
  );
});

test("reconcile keeps an available choice and otherwise falls back to the recommendation", () => {
  const list = recommendPresets(parseWizardAnswers({ participantCount: 40 })).recommendations as unknown as PresetRecommendation[];
  assert.equal(reconcilePresetAfterAnswers("swiss", list), "swiss");
  assert.equal(reconcilePresetAfterAnswers("round_robin", list), list.find((item) => item.recommended)!.presetId, "round robin is unavailable for 40");
});

test("roster health enforces the exact count of a fixed plan", () => {
  const players = Array.from({ length: 15 }, (_, index) => ({ name: `P${index}`, seed: null }));
  const short = rosterHealth(players, 16, 16);
  assert.equal(short.ready, false);
  assert.ok(short.issues.some((issue) => issue.label.includes("brakuje 1")));
  assert.equal(rosterHealth([...players, { name: "P15", seed: null }], 16, 16).ready, true);
  assert.equal(rosterHealth(players.slice(0, 3), 16).ready, true, "flexible tournaments only need 2");
});

// ── component ───────────────────────────────────────────────────────────────

test("beginner flow: defaults → recommendation → tune → validation → create with the previewed plan", async () => {
  const calls = installFetch();
  const { location } = renderAt("/experimental/tournaments/new", CreateTournamentExperimental);

  assert.ok(screen.getByRole("heading", { name: "Jakie rozgrywki organizujesz?" }));
  fireEvent.click(screen.getByLabelText(/Tak, z grupami/));
  fireEvent.click(screen.getByRole("button", { name: "16" }));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));

  await screen.findByRole("heading", { name: "Wybierz format" });
  const recommended = await screen.findByText("Polecany");
  assert.ok(recommended.closest("label")?.textContent?.includes("Grupy i play-off"));
  const recommendCall = calls.find((call) => call.url.includes("/recommend"))!;
  assert.deepEqual(recommendCall.body, { kind: "tournament", participantType: "players", participantCount: 16, grouping: "yes", priority: "short" });
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("Dokładnie 16 uczestników")));

  fireEvent.click(screen.getByRole("button", { name: /Dalej: dopasuj/ }));
  await screen.findByRole("heading", { name: "Dopasuj szczegóły" });
  const groupCount = await screen.findByRole("radiogroup", { name: "Liczba grup" });
  fireEvent.click(Array.from(groupCount.querySelectorAll("button")).find((button) => button.textContent === "2")!);
  await waitFor(() => {
    const last = calls.filter((call) => call.url.includes("/preview")).at(-1)!;
    assert.deepEqual((last.body as { params: unknown }).params, { participantCount: 16, groupCount: 2 });
  });
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("2 grupy po 8")));
  const keysOf = (value: unknown): string[] => value && typeof value === "object" ? Object.entries(value).flatMap(([key, inner]) => [key, ...keysOf(inner)]) : [];
  assert.ok(calls.filter((call) => call.url.includes("/presets/")).every((call) => keysOf(call.body).every((key) => !/name|password/i.test(key))), "preset requests never carry name or passwords");

  fireEvent.click(screen.getByRole("button", { name: /Dalej: nazwa/ }));
  await screen.findByRole("heading", { name: "Nazwij turniej i zabezpiecz go" });
  await waitFor(() => assert.equal((screen.getByRole("button", { name: /Utwórz turniej/ }) as HTMLButtonElement).disabled, false));
  fireEvent.click(screen.getByRole("button", { name: /Utwórz turniej/ }));
  await screen.findByText("Podaj nazwę turnieju.");
  assert.equal(calls.some((call) => call.url.endsWith("/api/tournaments")), false, "invalid form does not submit");

  fireEvent.change(screen.getByLabelText(/Nazwa turnieju/), { target: { value: "Wiosenny Puchar" } });
  fireEvent.change(screen.getByLabelText(/Hasło organizatora/), { target: { value: "organizer-pass-1" } });
  assert.ok(!(window.sessionStorage.getItem(WIZARD_DRAFT_KEY) ?? "").includes("organizer-pass-1"), "password never reaches the draft");
  fireEvent.click(screen.getByRole("button", { name: /Utwórz turniej/ }));

  await waitFor(() => assert.ok(location.history.includes("/experimental/tournaments/77?tab=players"), JSON.stringify(location.history)));
  const create = calls.find((call) => call.url.endsWith("/api/tournaments"))!.body as Record<string, any>;
  assert.equal(create.name, "Wiosenny Puchar");
  assert.equal(create.organizerPassword, "organizer-pass-1");
  assert.equal(create.maxPlayers, 16);
  assert.equal(create.stagePlan.stages[0].groupCount, 2);
  assert.equal(create.stagePlan.stages[1].participantCount, 4);
  assert.equal(window.sessionStorage.getItem(WIZARD_DRAFT_KEY), null, "draft cleared after success");
});

test("going back keeps answers; a new answer refreshes recommendations", async () => {
  const calls = installFetch();
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByLabelText(/Liga/));
  fireEvent.click(screen.getByRole("button", { name: "8" }));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));
  await screen.findByText("Polecany");
  assert.ok(screen.getByText("Polecany").closest("label")?.textContent?.includes("Każdy z każdym"));
  fireEvent.click(screen.getByRole("button", { name: /Wstecz/ }));
  assert.equal((screen.getByLabelText(/Liga/) as HTMLInputElement).checked, true);
  fireEvent.click(screen.getByLabelText(/Krótko/));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));
  await waitFor(() => assert.equal(calls.filter((call) => call.url.includes("/recommend")).length, 2));
});

test("league answer explains current limits instead of pretending schedules exist", async () => {
  installFetch();
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByLabelText(/Liga/));
  const leagueNote = screen.getByText(/daty i godziny kolejek, dywizje i awanse jeszcze nie są dostępne/);
  assert.match(leagueNote.textContent ?? "", /mecz i rewanż/, "home and away is offered, not denied");
  assert.match(leagueNote.textContent ?? "", /bez remisów/);
  fireEvent.click(screen.getByLabelText(/Drużyny/));
  assert.ok(screen.getByText(/Każda drużyna ma własny skład/));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));
  await screen.findByText("Polecany");
  fireEvent.click(screen.getByText("Dlaczego nie widzę innych formatów?"));
  assert.ok(screen.getByText(/Liga z terminarzem i datami kolejek/));
  assert.equal(screen.queryByText(/Liga: mecz i rewanż/), null, "home and away is a real option now, not a planned one");
});

test("league home and away: the legs switch doubles the table and requires a full roster", async () => {
  const calls = installFetch();
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByLabelText(/Liga/));
  fireEvent.click(screen.getByRole("button", { name: "8" }));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));
  await screen.findByText("Polecany");
  fireEvent.click(screen.getByRole("button", { name: /Dalej: dopasuj/ }));
  const legs = await screen.findByRole("radiogroup", { name: "Mecz i rewanż" });
  fireEvent.click(Array.from(legs.querySelectorAll("button")).find((button) => button.textContent === "Mecz i rewanż")!);
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("Dokładnie 8")));
  assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("56"));
  const last = calls.filter((call) => call.url.includes("/preview")).at(-1)!;
  assert.equal((last.body as { params: { legs: number } }).params.legs, 2);
});

test("create error is shown and the wizard stays usable", async () => {
  installFetch({ createStatus: 422 });
  window.sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify({ step: 3, maxVisitedStep: 3, presetId: "single_elimination", answers: { participantCount: 8 }, name: "Puchar" }));
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  await screen.findByRole("heading", { name: "Nazwij turniej i zabezpiecz go" });
  fireEvent.change(screen.getByLabelText(/Hasło organizatora/), { target: { value: "organizer-pass-1" } });
  await waitFor(() => assert.equal((screen.getByRole("button", { name: /Utwórz turniej/ }) as HTMLButtonElement).disabled, false));
  fireEvent.click(screen.getByRole("button", { name: /Utwórz turniej/ }));
  const alert = await waitFor(() => { const found = screen.getAllByRole("alert").find((node) => node.textContent && node.textContent.length > 3); assert.ok(found); return found!; });
  assert.ok(alert.textContent!.length > 3);
  assert.equal((screen.getByRole("button", { name: /Utwórz turniej/ }) as HTMLButtonElement).disabled, false);
});

test("advanced mode receives the tuned plan once", async () => {
  installFetch();
  const preview = previewPreset({ presetId: "groups_playoff", params: { participantCount: 12, groupCount: 3 } }) as unknown as PresetPreview;
  window.sessionStorage.setItem(ADVANCED_HANDOFF_KEY, JSON.stringify(buildAdvancedHandoff(preview, { name: "Z kreatora", description: "", visibility: "public_online" })));
  assert.equal(readAdvancedHandoff(window.sessionStorage)?.presetId, "groups_playoff");
  renderAt("/experimental/tournaments/new/advanced", CreateTournamentExperimentalAdvanced);
  assert.equal((screen.getByLabelText(/Nazwa turnieju/) as HTMLInputElement).value, "Z kreatora");
  assert.ok(screen.getByText(/Wybrano:/).textContent?.includes("Grupy i play-off"));
  await waitFor(() => assert.equal(window.sessionStorage.getItem(ADVANCED_HANDOFF_KEY), null));
});

test("wizard button opens advanced mode with the current selection", async () => {
  installFetch();
  window.sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify({ step: 2, maxVisitedStep: 2, presetId: "swiss", answers: { participantCount: 10 }, params: { swissRounds: 3 } }));
  const { location } = renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("System szwajcarski")));
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("15"), "10 players: 5 matches per round × 3 rounds"));
  fireEvent.click(screen.getByRole("button", { name: /Edytuj w trybie zaawansowanym/ }));
  assert.ok(location.history.includes("/experimental/tournaments/new/advanced"));
  const handoff = JSON.parse(window.sessionStorage.getItem(ADVANCED_HANDOFF_KEY)!);
  assert.equal(handoff.creation.swissRounds, 3);
  assert.equal(handoff.creation.format, "swiss");
});

test("format step shows the recommendation plus two alternatives, the rest on demand", async () => {
  installFetch();
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByRole("button", { name: "16" }));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));
  await screen.findByText("Polecany");
  assert.equal(document.querySelectorAll(".experimental-wizard-preset").length, 3);
  fireEvent.click(screen.getByRole("button", { name: /Pokaż pozostałe formaty \(4\)/ }));
  assert.equal(document.querySelectorAll(".experimental-wizard-preset").length, 7);
});


// ── V5-B: AI import ─────────────────────────────────────────────────────────

test("AI import: forbidden fields are listed with paths and nothing is created", async () => {
  const calls = installFetch();
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByRole("button", { name: /Masz gotowy plan od AI/ }));
  assert.ok(screen.getByRole("heading", { name: "Wczytaj plan przygotowany przez AI" }));
  const spec = screen.getByRole("link", { name: /Specyfikacja dla AI/ }) as HTMLAnchorElement;
  assert.equal(spec.getAttribute("href"), "/api/tournaments/ai-spec.md");
  assert.ok(spec.hasAttribute("download"));
  const bad = { ...AI_CONFIG_EXAMPLES[0].config, name: "Puchar od AI", organizerPassword: "from-ai" };
  fireEvent.change(screen.getByLabelText("Plik JSON od AI"), { target: { value: JSON.stringify(bad) } });
  fireEvent.click(screen.getByRole("button", { name: /Sprawdź plik/ }));
  await screen.findByText(/Plik wymaga poprawek \(2\)/);
  assert.ok(screen.getByText("organizerPassword"));
  assert.equal(screen.queryByRole("button", { name: /Użyj tej konfiguracji/ }), null);
  assert.equal(calls.some((call) => call.url.endsWith("/api/tournaments")), false);
});

test("AI import: a valid preset file lands in Tune, stays editable and never sets the name", async () => {
  const calls = installFetch();
  const { location } = renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByRole("button", { name: /Plik od AI/ }));
  fireEvent.change(screen.getByLabelText("Plik JSON od AI"), { target: { value: JSON.stringify(AI_CONFIG_EXAMPLES[0].config) } });
  fireEvent.click(screen.getByRole("button", { name: /Sprawdź plik/ }));
  await screen.findByText("Plik jest poprawny");
  assert.ok(screen.getByText(/tylko do przeczytania/));
  assert.ok(screen.getByText(AI_CONFIG_EXAMPLES[0].config.notes as string));
  fireEvent.click(screen.getByRole("button", { name: /Użyj tej konfiguracji/ }));
  await screen.findByRole("heading", { name: "Dopasuj szczegóły" });
  assert.ok(screen.getByText(/Ustawienia wczytane z pliku AI/));
  await waitFor(() => assert.ok(screen.getByLabelText("Podgląd rozgrywek").textContent?.includes("4 grupy po 4")));
  const playoffBo = screen.getByRole("radiogroup", { name: "Długość meczu w play-off" });
  assert.equal(playoffBo.querySelector('[aria-checked="true"]')?.textContent, "Do 2 wygranych");
  await waitFor(() => assert.equal((screen.getByRole("button", { name: /Dalej: nazwa/ }) as HTMLButtonElement).disabled, false));
  fireEvent.click(screen.getByRole("button", { name: /Dalej: nazwa/ }));
  await screen.findByRole("heading", { name: "Nazwij turniej i zabezpiecz go" });
  assert.equal((screen.getByLabelText(/Nazwa turnieju/) as HTMLInputElement).value, "", "AI file cannot name the tournament");
  fireEvent.change(screen.getByLabelText(/Nazwa turnieju/), { target: { value: "Mój turniej" } });
  fireEvent.change(screen.getByLabelText(/Hasło organizatora/), { target: { value: "organizer-pass-1" } });
  await waitFor(() => assert.equal((screen.getByRole("button", { name: /Utwórz turniej/ }) as HTMLButtonElement).disabled, false));
  fireEvent.click(screen.getByRole("button", { name: /Utwórz turniej/ }));
  await waitFor(() => assert.ok(location.history.includes("/experimental/tournaments/77?tab=players")));
  const create = calls.find((call) => call.url.endsWith("/api/tournaments"))!.body as Record<string, any>;
  assert.equal(create.name, "Mój turniej");
  assert.equal(create.stagePlan.stages[1].bestOf, 3);
  assert.equal(create.stagePlan.stages[0].groupCount, 4);
});

test("AI import: a custom stage plan opens the advanced editor with the plan", async () => {
  installFetch();
  const { location } = renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByRole("button", { name: /Plik od AI/ }));
  fireEvent.change(screen.getByLabelText("Plik JSON od AI"), { target: { value: JSON.stringify(AI_CONFIG_EXAMPLES[3].config) } });
  fireEvent.click(screen.getByRole("button", { name: /Sprawdź plik/ }));
  await screen.findByText("Plik jest poprawny");
  assert.ok(screen.getByText(/Rundy szwajcarskie → Grupy → Finały/));
  fireEvent.click(screen.getByRole("button", { name: /Użyj tej konfiguracji/ }));
  assert.ok(location.history.includes("/experimental/tournaments/new/advanced"));
  const handoff = readAdvancedHandoff(window.sessionStorage)!;
  assert.equal(handoff.presetId, "custom");
  assert.deepEqual(handoff.creation.stagePlan?.stages.map((stage) => stage.participantCount), [32, 16, 8]);
});

test("AI import: malformed JSON gets a helpful message", async () => {
  installFetch();
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByRole("button", { name: /Plik od AI/ }));
  fireEvent.change(screen.getByLabelText("Plik JSON od AI"), { target: { value: "Oto Twój plik: { schemaVersion: 1 }" } });
  fireEvent.click(screen.getByRole("button", { name: /Sprawdź plik/ }));
  await screen.findByText(/To nie jest poprawny JSON/);
  fireEvent.click(screen.getByRole("button", { name: "Zamknij import" }));
  assert.ok(screen.getByRole("heading", { name: "Jakie rozgrywki organizujesz?" }));
});

test("contract: wizard tunable params match the server catalog", async () => {
  const { PRESET_IDS, PRESET_TUNABLE_PARAMS } = await import("../../../../api-server/src/domain/tournament/tournament-presets");
  const answers = { kind: "tournament" as const, participantType: "players" as const, participantCount: 16, grouping: "any" as const, priority: "short" as const };
  const all = { bestOf: 3, playoffBestOf: 5, swissRounds: 4, groupCount: 4, qualifiersPerGroup: 2, advancingCount: 8, legs: 2, allowDraws: 0, pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };
  for (const id of PRESET_IDS) {
    const keys = Object.keys(requestParams(id, answers, all)).filter((key) => key !== "participantCount").sort();
    assert.deepEqual(keys, [...PRESET_TUNABLE_PARAMS[id]].sort(), id);
  }
});

test("teams: payload carries participant type and roster limits; players never do", async () => {
  const preview = previewPreset({ presetId: "single_elimination", params: { participantCount: 8 } }) as unknown as PresetPreview;
  const secrets = { organizerPassword: "password-123", supportPassword: "", viewerPassword: "" };
  const teams = buildCreatePayload(preview, { name: "Liga drużyn", description: "", visibility: "public_online", participantType: "teams", rosterMin: 3, rosterMax: 5 }, secrets);
  assert.equal(teams.participantType, "teams");
  assert.equal(teams.teamRosterMin, 3);
  assert.equal(teams.teamRosterMax, 5);
  const inverted = buildCreatePayload(preview, { name: "X", description: "", visibility: "public_online", participantType: "teams", rosterMin: 5, rosterMax: 3 }, secrets);
  assert.equal(inverted.teamRosterMax, undefined, "an impossible maximum is dropped instead of failing on the server");
  const players = buildCreatePayload(preview, { name: "Y", description: "", visibility: "public_online", participantType: "players", rosterMin: 3, rosterMax: 5 }, secrets);
  assert.equal("participantType" in players, false);
  assert.equal("teamRosterMin" in players, false);
});

test("answers that cannot be honoured are explained in plain words (V5.1)", async () => {
  installFetch();
  renderAt("/experimental/tournaments/new", CreateTournamentExperimental);
  fireEvent.click(screen.getByLabelText(/Liga/));
  fireEvent.click(screen.getByLabelText(/Krótko/));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));
  const note = await screen.findByText(/Jeśli ma być krótko, wybierz „System szwajcarski”/);
  assert.match(note.textContent ?? "", /28 meczów/);
  assert.equal(note.closest("[role=note]") !== null, true);
  // Match length is described without jargon in the format preview.
  assert.ok(screen.getAllByText(/jedna gra na mecz/).length > 0);
  assert.equal(screen.queryByText(/· BO1/), null);
});
