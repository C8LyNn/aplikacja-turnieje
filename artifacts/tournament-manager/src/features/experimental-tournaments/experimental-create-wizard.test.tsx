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
  assert.ok(screen.getByText(/Daty kolejek i rewanże jeszcze nie są dostępne/));
  fireEvent.click(screen.getByLabelText(/Drużyny/));
  assert.ok(screen.getByText(/Składy zawodników dodamy w kolejnej wersji/));
  fireEvent.click(screen.getByRole("button", { name: /Pokaż propozycje/ }));
  await screen.findByText("Polecany");
  fireEvent.click(screen.getByText("Dlaczego nie widzę innych formatów?"));
  assert.ok(screen.getByText(/Liga: mecz i rewanż/));
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
