import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TournamentStagesPanel } from "./tournament-stages-panel";
import { OrganizerNextStep } from "./organizer-next-step";
import { deriveOrganizerNextStep } from "@/lib/organizer-next-step";
import type { Match, TournamentStage, StageStartReadiness } from "@workspace/api-client-react";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.clear(); globalThis.fetch = originalFetch; });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const stage = (id: number, status = "planned") => ({ id, tournamentId: 1, stageKey: `stage-${id}`, name: id === 1 ? "Eliminacje" : "Finały", position: id,
  status, format: "single_elimination", participantCount: 4, bestOf: 3, entrySeedingPolicy: "preserve", placementPolicy: "standard", groups: [] });
const ready = (value = true) => ({ ready: value, reasonCode: value ? "READY" : "STAGE_PARTICIPANTS_INCONSISTENT",
  message: value ? "Etap gotowy." : "Brakuje uczestników i seedów.", participantCount: value ? 4 : 2, requiredParticipantCount: 4,
  missingSeeds: value ? [] : [3, 4], blockingMatches: 0, blockingGroups: 0, format: "single_elimination", basketValidation: { valid: true, problems: [] as { message: string }[] } });
const basketConfig = () => ({ tournamentId: 1, legacyDefaulted: false, flowAuthority: "basket_v1", baskets: [
  { id: "out-1", stageId: 1, type: "output", ordinal: 1, order: 1, qualifierCount: 2, participantIds: [], colorId: null },
  { id: "in-2", stageId: 2, type: "input", ordinal: 1, order: 1, qualifierCount: null, participantIds: [], colorId: null },
], routes: [{ id: "route-1", sourceBasketId: "out-1", targetBasketId: "in-2" }], validation: { valid: true, problems: [] } });

function setup(options: {
  stages: ReturnType<typeof stage>[];
  readiness?: ReturnType<typeof ready>;
  basket?: boolean;
  draft?: boolean;
  completed?: boolean;
  canManage?: boolean;
  path?: string;
  nextStep?: boolean;
  intercept?: (path: string, init?: RequestInit) => Promise<Response | undefined>;
}) {
  globalThis.fetch = async (input, init) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost").pathname;
    const intercepted = await options.intercept?.(path, init);
    if (intercepted) return intercepted;
    if (path.endsWith("/stages")) return json(options.stages);
    if (path.endsWith("/stage-baskets")) return json(options.basket ? basketConfig() : { flowAuthority: "legacy", baskets: [], routes: [], validation: { valid: true, problems: [] } });
    if (path.endsWith("/readiness")) return json(options.readiness ?? ready());
    if (path.endsWith("/qualification-preview")) return json({ qualifiers: [], ranking: [] });
    if (path.endsWith("/basket-qualification-proposal")) return json({ status: "pending", entries: [] });
    const detail = path.match(/\/stages\/(\d+)$/);
    if (detail) return json({ stage: options.stages.find(entry => entry.id === Number(detail[1])), participants: [], ranking: [], qualifiers: [], groups: [] });
    return json({});
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  const location = memoryLocation({ path: options.path ?? "/tournaments/1?tab=stages" });
  const matches = options.stages.filter(stage => stage.status === "active").map(stage => ({
    id: stage.id, stageId: stage.id, status: "completed", round: 1,
  })) as Match[];
  const step = deriveOrganizerNextStep({
    tournament: { id: 1, status: options.draft ? "draft" : "active", currentRound: 1, totalRounds: 1 },
    stages: options.stages as unknown as TournamentStage[], matches, surface: "details",
    capabilities: { canManageLifecycle: true, canStartTournament: true } as Parameters<typeof deriveOrganizerNextStep>[0]["capabilities"],
    plannedStageReadiness: (options.readiness ?? ready()) as StageStartReadiness,
  });
  render(<QueryClientProvider client={client}><Router hook={location.hook} searchHook={location.searchHook}>
    {options.nextStep && <OrganizerNextStep step={step} />}
    <TournamentStagesPanel tournamentId={1} tournamentStatus={options.completed ? "completed" : options.draft ? "draft" : "active"} matches={[]} canManage={options.canManage ?? true} />
  </Router></QueryClientProvider>);
  return userEvent.setup();
}
async function selectFinals(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /Etap 2.*Finały/ }));
}

for (const completed of [false, true]) {
  for (const basket of [false, true]) {
    test(`historical stage has no next-stage instructions when all stages ended (tournamentCompleted=${completed}, baskets=${basket})`, async () => {
      setup({ completed, basket, stages: [stage(1, "completed"), stage(2, "completed")], path: "/tournaments/1?tab=stages&stage=1" });
      await screen.findByRole("heading", { name: "Eliminacje" });
      assert.ok(screen.getByText("Wszystkie etapy są zakończone. Przeglądasz historię turnieju."));
      assert.equal(screen.queryByText("Brak aktywnego etapu"), null);
      assert.equal(screen.queryByText(/Wybierz kolejny planowany etap/), null);
      assert.equal(screen.queryByRole("button", { name: /Rozpocznij etap|Zatwierdź kwalifikację|Wykonaj routing/ }), null);
      assert.ok(screen.getByRole("heading", { name: "Zamrożony ranking" }));
      assert.ok(screen.getByRole("heading", { name: "Mecze etapu" }));
    });
  }
}

for (const source of ["upper", "lower"] as const) {
  for (const scenario of ["first start", "next start", "complete"] as const) {
    test(`${source} CTA: ${scenario} uses the target stage confirmation and locks write plus refetch`, async () => {
      const completing = scenario === "complete";
      const next = scenario === "next start";
      const targetId = next ? 2 : 1;
      const stages = next ? [stage(1, "completed"), stage(2)] : [stage(1, completing ? "active" : "planned")];
      let writes = 0;
      let saved = false;
      let refreshing = false;
      let releaseWrite!: () => void;
      let releaseRead!: () => void;
      const writeBarrier = new Promise<void>(resolve => { releaseWrite = resolve; });
      const readBarrier = new Promise<void>(resolve => { releaseRead = resolve; });
      const endpoint = completing ? "/api/tournaments/1/stages/1/complete"
        : next ? "/api/tournaments/1/stages/2/start" : "/api/tournaments/1/start";
      const user = setup({ stages, draft: !completing && !next, nextStep: true, intercept: async (path, init) => {
        if (init?.method === "POST") {
          assert.equal(path, endpoint);
          writes++;
          await writeBarrier;
          stages[targetId - 1] = stage(targetId, completing ? "completed" : "active");
          saved = true;
          return json(stages[targetId - 1]);
        }
        if (saved && path.endsWith("/stages")) {
          refreshing = true;
          await readBarrier;
        }
        return undefined;
      } });
      await screen.findByRole("heading", { name: "Eliminacje" });
      if (source === "lower" && next) await selectFinals(user);
      const label = completing ? "Zakończ etap" : "Rozpocznij etap";
      const button = await screen.findByRole(source === "upper" ? "link" : "button", { name: label });
      await waitFor(() => assert.equal(button.matches(":disabled"), false));
      await user.click(button);
      const dialog = await screen.findByRole("dialog");
      assert.match(within(dialog).getByRole("heading").textContent ?? "", next ? /Finały/ : /Eliminacje/);
      if (source === "upper" && next) {
        assert.ok(document.querySelector('[aria-label="Przebieg etapów turnieju"]')?.textContent?.includes("Eliminacje"));
        // Opening an action must not select its target as an intermediate trigger.
        assert.equal(document.querySelector('button[aria-pressed="true"]')?.textContent?.includes("Eliminacje"), true);
      }
      const confirm = within(dialog).getByRole("button", { name: completing ? "Potwierdź zakończenie etapu" : "Potwierdź rozpoczęcie etapu" });
      await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
      await user.dblClick(confirm);
      assert.equal(writes, 1);
      assert.ok(confirm.matches(":disabled"));
      const pendingText = completing ? "Kończenie etapu i odświeżanie danych…" : "Uruchamianie etapu i odświeżanie danych…";
      assert.ok(screen.getByText(pendingText));
      releaseWrite();
      await waitFor(() => assert.equal(refreshing, true));
      assert.ok(screen.getByText(pendingText));
      if (!completing) assert.ok(confirm.matches(":disabled"));
      else assert.equal(screen.queryByRole("dialog"), null);
      releaseRead();
      await screen.findByText(`Etap „${next ? "Finały" : "Eliminacje"}” ${completing ? "zakończony. Plan nie zawiera kolejnego etapu." : "rozpoczęty."}`);
      await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
      assert.equal(writes, 1);
    });
  }
}

test("upper start CTA can reopen after cancellation with its target already selected", async () => {
  const user = setup({ stages: [stage(1, "completed"), stage(2)], nextStep: true });
  await selectFinals(user);
  for (let attempt = 0; attempt < 2; attempt++) {
    await user.click(screen.getByRole("link", { name: "Rozpocznij etap" }));
    const dialog = await screen.findByRole("dialog");
    assert.match(within(dialog).getByRole("heading").textContent ?? "", /Finały/);
    await user.click(within(dialog).getByRole("button", { name: "Anuluj" }));
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
  }
});

test("upper completion previews and completes the active stage while another stage stays selected", async () => {
  const stages = [stage(1, "active"), stage(2)];
  const previews: string[] = [];
  const user = setup({ stages, nextStep: true, intercept: async path => {
    if (path.endsWith("/qualification-preview")) previews.push(path);
    if (path.endsWith("/complete")) {
      assert.equal(path, "/api/tournaments/1/stages/1/complete");
      stages[0] = stage(1, "completed");
      return json(stages[0]);
    }
    return undefined;
  } });
  await selectFinals(user);
  await user.click(screen.getByRole("link", { name: "Zakończ etap" }));
  const dialog = await screen.findByRole("dialog");
  assert.match(within(dialog).getByRole("heading").textContent ?? "", /Eliminacje/);
  assert.equal(document.querySelector('button[aria-pressed="true"]')?.textContent?.includes("Finały"), true);
  const confirm = within(dialog).getByRole("button", { name: "Potwierdź zakończenie etapu" });
  await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
  await user.click(confirm);
  await screen.findByText(/Etap „Eliminacje” zakończony/);
  assert.deepEqual(previews, ["/api/tournaments/1/stages/1/qualification-preview"]);
});

test("upper start conflict refreshes its explicit target and blocks retry with stale readiness", async () => {
  const readiness = ready();
  let reads = 0;
  let writes = 0;
  const user = setup({ stages: [stage(1, "completed"), stage(2)], nextStep: true, readiness, intercept: async path => {
    if (path === "/api/tournaments/1/stages/2/readiness") reads++;
    if (path.endsWith("/start")) {
      assert.equal(path, "/api/tournaments/1/stages/2/start");
      writes++;
      Object.assign(readiness, ready(false));
      return json({ code: "STAGE_PARTICIPANTS_INCONSISTENT", error: "Skład etapu zmienił się w innym oknie." }, 409);
    }
    return undefined;
  } });
  await screen.findByRole("heading", { name: "Eliminacje" });
  await user.click(screen.getByRole("link", { name: "Rozpocznij etap" }));
  const dialog = await screen.findByRole("dialog");
  const confirm = within(dialog).getByRole("button", { name: "Potwierdź rozpoczęcie etapu" });
  await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
  await user.click(confirm);
  await within(dialog).findByText(/Skład etapu zmienił się/);
  await waitFor(() => assert.equal(within(dialog).getByRole("button", { name: "Anuluj" }).matches(":disabled"), false));
  assert.ok(confirm.matches(":disabled"));
  assert.ok(reads >= 2);
  assert.equal(writes, 1);
  assert.equal(screen.queryByText("Etap „Finały” rozpoczęty."), null);
});

test("upper start reads the target ceremony instead of the selected stage ceremony", async () => {
  let writes = 0;
  const stages = [stage(1, "completed"), { ...stage(2), entrySeedingPolicy: "random", randomRevealOrder: "sequential" }];
  const user = setup({ stages, nextStep: true, intercept: async (path, init) => {
    if (init?.method === "POST") writes++;
    if (path.includes("seeding-ceremony")) {
      assert.ok(path.includes("/stages/2/"));
      return json({ ceremony: null });
    }
    return undefined;
  } });
  await screen.findByRole("heading", { name: "Eliminacje" });
  await user.click(screen.getByRole("link", { name: "Rozpocznij etap" }));
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText("Dokończ ceremonię losowania przed rozpoczęciem etapu.");
  assert.ok(within(dialog).getByRole("button", { name: "Potwierdź rozpoczęcie etapu" }).matches(":disabled"));
  assert.equal(writes, 0);
});

function qualificationFlow(options: {
  initial?: "missing" | "pending" | "approved";
  active?: boolean;
  intercept?: (path: string, init?: RequestInit) => Promise<Response | undefined>;
} = {}) {
  const state = { status: options.initial ?? "pending", routed: false, revision: 1, reads: { proposal: 0, route: 0, readiness: 0 }, writes: { generate: 0, approve: 0, route: 0 } };
  const stages = [stage(1, options.active ? "active" : "completed"), stage(2)];
  const proposal = () => ({ proposalId: 10, tournamentId: 1, stageId: 1, revision: state.revision, rankingFingerprint: "rank-1", status: state.status, createdAt: "2026-09-10T00:00:00Z",
    entries: [{ basketId: "out-1", playerId: 71, placementRank: 1, basketPosition: 1 }] });
  const user = setup({ stages, basket: true, intercept: async (path, init) => {
    const response = await options.intercept?.(path, init);
    if (response) return response;
    if (path.endsWith("/complete")) { stages[0] = stage(1, "completed"); return json(stages[0]); }
    if (path.endsWith("/basket-qualification-proposal/approve")) { state.writes.approve++; state.status = "approved"; return json(proposal()); }
    if (path.endsWith("/basket-qualification-proposal")) {
      if (init?.method === "POST") { state.writes.generate++; state.status = "pending"; state.revision++; return json(proposal()); }
      state.reads.proposal++;
      return state.status === "missing" ? json({ code: "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND", error: "No proposal found for this stage." }, 404) : json(proposal());
    }
    if (path.endsWith("/route/execute")) { state.writes.route++; state.routed = true; return json({ routedPlayerCount: 1 }); }
    if (path.endsWith("/route")) { state.reads.route++; return json({ routeId: "route-1", sourceStageId: 1, sourceBasketId: "out-1", targetStageId: 2, targetBasketId: "in-2", sourceOutputApproved: state.status === "approved", materialized: state.routed, routedPlayerCount: state.routed ? 1 : 0, execution: null }); }
    if (path.endsWith("/readiness")) { state.reads.readiness++; return json(ready(state.routed)); }
    if (path.endsWith("/stages/1")) return json({ stage: stages[0], participants: [{ id: 71, playerId: 71, playerName: "Alicja", wins: 1, losses: 0, draws: 0, points: 3 }], ranking: [], qualifiers: [], groups: [] });
    return undefined;
  } });
  return { user, state };
}

test("completed stage can generate, review, approve and route entirely from the panel to backend READY", async () => {
  const { user, state } = qualificationFlow({ initial: "missing", active: true });
  await user.click(await screen.findByRole("button", { name: "Zakończ etap" }));
  const complete = await screen.findByRole("button", { name: "Potwierdź zakończenie etapu" });
  await waitFor(() => assert.equal(complete.matches(":disabled"), false));
  await user.click(complete);
  await user.click(await screen.findByRole("button", { name: "Przygotuj propozycję kwalifikacji" }));
  const approve = await screen.findByRole("button", { name: "Zatwierdź kwalifikację" });
  await waitFor(() => assert.equal(approve.matches(":disabled"), false));
  assert.match(screen.getByRole("table", { name: "Propozycja kwalifikacji" }).textContent ?? "", /Alicja.*1.*koszyk wyjściowy 1.*1/);
  assert.equal(screen.queryByRole("button", { name: /Wykonaj routing:/ }) === null, true);
  await user.click(approve);
  assert.match(screen.getByRole("dialog").textContent ?? "", /utrwali pokazany skład/);
  await user.click(screen.getByRole("button", { name: "Potwierdź kwalifikację" }));
  const route = await screen.findByRole("button", { name: /Wykonaj routing:/ });
  await waitFor(() => assert.equal(route.matches(":disabled"), false));
  assert.match(screen.getByRole("generic", { name: "Routing route-1" }).textContent ?? "", /Eliminacje: koszyk wyjściowy 1 → Finały: koszyk wejściowy 1/);
  await user.click(route);
  await screen.findByText("Routing wykonany. Przekazano uczestników: 1.");
  await screen.findByText("Etap gotowy do startu.");
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Przejdź do etapu: Finały" }).matches(":disabled"), false));
  assert.deepEqual(state.writes, { generate: 1, approve: 1, route: 1 });
  assert.ok(state.reads.proposal >= 4 && state.reads.route >= 4 && state.reads.readiness >= 4);
  await user.click(screen.getByRole("button", { name: "Przejdź do etapu: Finały" }));
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"), false));
});

for (const operation of ["approve", "route"] as const) {
  test(`${operation} prevents double submit through both write and dependent readiness refetch`, async () => {
    let releaseWrite!: () => void;
    let releaseRead!: () => void;
    const writeBarrier = new Promise<void>(resolve => { releaseWrite = resolve; });
    const readBarrier = new Promise<void>(resolve => { releaseRead = resolve; });
    let writes = 0;
    let saved = false;
    let refreshStarted = false;
    const { user } = qualificationFlow({ initial: operation === "approve" ? "pending" : "approved", intercept: async path => {
      if (path.endsWith(operation === "approve" ? "/approve" : "/execute")) { writes++; await writeBarrier; saved = true; }
      if (saved && path.endsWith("/readiness")) { refreshStarted = true; await readBarrier; }
      return undefined;
    } });
    if (operation === "approve") await user.click(await screen.findByRole("button", { name: "Zatwierdź kwalifikację" }));
    const button = await screen.findByRole("button", { name: operation === "approve" ? "Potwierdź kwalifikację" : /Wykonaj routing:/ });
    await user.dblClick(button);
    assert.equal(writes, 1); assert.ok(button.matches(":disabled"));
    const pendingText = operation === "approve" ? "Zatwierdzanie zakwalifikowanych i odświeżanie stanu…" : "Przekazywanie uczestników i odświeżanie stanu…";
    assert.ok(screen.getByText(pendingText));
    assert.equal(screen.queryByText("Uruchamianie etapu i odświeżanie danych…"), null);
    releaseWrite();
    await waitFor(() => assert.equal(refreshStarted, true));
    await screen.findByText(pendingText);
    assert.ok(screen.getByRole("button", { name: operation === "approve" ? "Zatwierdzanie i odświeżanie…" : "Ponów sprawdzenie stanu" }).matches(":disabled"));
    releaseRead();
    await waitFor(() => assert.equal(screen.queryByText(pendingText) === null, true));
    assert.equal(writes, 1);
    assert.equal(screen.queryByRole("alert") === null, true);
  });

  for (const status of [409, 500]) test(`${operation} ${status} refreshes server state without false success`, async () => {
    let failed = false;
    const { user, state } = qualificationFlow({ initial: operation === "approve" ? "pending" : "approved", intercept: async path => {
      if (path.endsWith(operation === "approve" ? "/approve" : "/execute")) { failed = true; return json({ error: "Operacja odrzucona. Sprawdź aktualny stan." }, status); }
      return undefined;
    } });
    if (operation === "approve") await user.click(await screen.findByRole("button", { name: "Zatwierdź kwalifikację" }));
    await user.click(await screen.findByRole("button", { name: operation === "approve" ? "Potwierdź kwalifikację" : /Wykonaj routing:/ }));
    await screen.findByText(/Operacja odrzucona/);
    await waitFor(() => assert.equal(screen.queryByText("Zapisywanie i odświeżanie stanu…") === null, true));
    assert.ok(failed && state.reads.proposal >= 2 && state.reads.route >= 2 && state.reads.readiness >= 2);
    assert.equal(screen.queryByText("Routing wykonany. Gotowość etapu docelowego została sprawdzona.") === null, true);
    if (operation === "approve") assert.equal(screen.queryByText("Kwalifikacja zatwierdzona.") === null, true);
  });
}

test("successful route with failed readiness refresh shows an unverified state and supports read retry", async () => {
  let failRead = false;
  const { user } = qualificationFlow({ initial: "approved", intercept: async path => {
    if (path.endsWith("/execute")) failRead = true;
    if (path.endsWith("/readiness") && failRead) return json({ error: "Read failed" }, 500);
    return undefined;
  } });
  await user.click(await screen.findByRole("button", { name: /Wykonaj routing:/ }));
  await screen.findByText(/Operacja została przyjęta, ale nie udało się odświeżyć pełnego stanu/);
  assert.equal(screen.queryByText("Routing wykonany. Gotowość etapu docelowego została sprawdzona.") === null, true);
  assert.equal(screen.queryByText("Etap gotowy do startu.") === null, true);
  failRead = false;
  await user.click(screen.getByRole("button", { name: "Ponów sprawdzenie stanu" }));
  await screen.findByText("Etap gotowy do startu.");
});

test("stale proposal can be regenerated and requires a fresh approval review", async () => {
  const { user, state } = qualificationFlow({ intercept: async path => path.endsWith("/approve")
    ? json({ code: "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE" }, 409) : undefined });
  await user.click(await screen.findByRole("button", { name: "Zatwierdź kwalifikację" }));
  await user.click(screen.getByRole("button", { name: "Potwierdź kwalifikację" }));
  await screen.findByText(/Wyniki lub konfiguracja zmieniły się/);
  await waitFor(() => assert.equal(screen.queryByRole("dialog") === null, true));
  await user.click(screen.getByRole("button", { name: "Odśwież propozycję z wyników" }));
  await screen.findByText(/Wersja propozycji: 2/);
  assert.equal(state.writes.generate, 1);
  assert.equal(state.status, "pending");
});

test("a proposal revised while confirmation is open must be reviewed again", async () => {
  const { user, state } = qualificationFlow();
  await user.click(await screen.findByRole("button", { name: "Zatwierdź kwalifikację" }));
  state.revision++;
  await [...clients][0].invalidateQueries({ queryKey: ["/api/tournaments/1/stages/1/basket-qualification-proposal"] });
  await screen.findByText("Propozycja zmieniła się. Zamknij potwierdzenie i sprawdź aktualny skład.");
  const confirm = screen.getByRole("button", { name: "Potwierdź kwalifikację" });
  assert.ok(confirm.matches(":disabled"));
  await user.click(confirm);
  assert.equal(state.writes.approve, 0);
  await user.click(screen.getByRole("button", { name: "Anuluj" }));
  await user.click(screen.getByRole("button", { name: "Zatwierdź kwalifikację" }));
  assert.equal(screen.getByRole("button", { name: "Potwierdź kwalifikację" }).matches(":disabled"), false);
});

test("route conflict reflects an operation completed elsewhere without claiming local success", async () => {
  const { user, state } = qualificationFlow({ initial: "approved", intercept: async path => {
    if (path.endsWith("/execute")) { state.routed = true; return json({ error: "Stan zmienił się w innym oknie." }, 409); }
    return undefined;
  } });
  await user.click(await screen.findByRole("button", { name: /Wykonaj routing:/ }));
  await screen.findByText(/Stan zmienił się w innym oknie/);
  await screen.findByText("Routing wykonany. Przekazano uczestników: 1.");
  await screen.findByText("Etap gotowy do startu.");
  assert.equal(screen.queryByRole("button", { name: /Wykonaj routing:/ }) === null, true);
  assert.equal(screen.queryByText("Routing wykonany. Gotowość etapu docelowego została sprawdzona.") === null, true);
});

test("multiple configured routes remain separate and readiness stays controlled by the server", async () => {
  const config = basketConfig();
  config.baskets.push({ ...config.baskets[0], id: "out-2", ordinal: 2, order: 2 });
  config.routes.push({ id: "route-2", sourceBasketId: "out-2", targetBasketId: "in-2" });
  let secondRouted = false;
  const { user } = qualificationFlow({ initial: "approved", intercept: async path => {
    if (path.endsWith("/stage-baskets")) return json(config);
    if (path.endsWith("/baskets/out-2/route/execute")) { secondRouted = true; return json({ routedPlayerCount: 1 }); }
    if (path.endsWith("/baskets/out-2/route")) return json({ sourceOutputApproved: true, materialized: secondRouted, routedPlayerCount: secondRouted ? 1 : 0 });
    if (path.endsWith("/readiness")) return json(ready(secondRouted));
    return undefined;
  } });
  await user.click(await screen.findByRole("button", { name: "Wykonaj routing: koszyk wyjściowy 1" }));
  const second = await screen.findByRole("button", { name: "Wykonaj routing: koszyk wyjściowy 2" });
  await waitFor(() => assert.equal(second.matches(":disabled"), false));
  assert.equal(screen.queryByText("Etap gotowy do startu.") === null, true);
  await user.click(second);
  await screen.findByText("Etap gotowy do startu.");
  assert.equal(screen.getAllByText("Routing wykonany. Przekazano uczestników: 1.").length, 2);
});

for (const mode of ["legacy", "empty", "viewer"] as const) test(`${mode} does not expose qualification or routing actions`, async () => {
  let proposalReads = 0;
  setup({ stages: [stage(1, "completed"), stage(2)], basket: mode !== "legacy", canManage: mode !== "viewer", intercept: async path => {
    if (path.endsWith("/basket-qualification-proposal")) proposalReads++;
    if (mode === "empty" && path.endsWith("/stage-baskets")) return json({ ...basketConfig(), baskets: [], routes: [] });
    return undefined;
  } });
  await screen.findByRole("generic", { name: "Dalsze kroki po etapie" });
  assert.equal(screen.queryByRole("region", { name: "Kwalifikacja i routing" }) === null, true);
  assert.equal(proposalReads, 0);
});

test("qualification without routes does not require a routing step", async () => {
  const { user } = qualificationFlow({ intercept: async path => path.endsWith("/stage-baskets") ? json({ ...basketConfig(), routes: [] }) : undefined });
  await user.click(await screen.findByRole("button", { name: "Zatwierdź kwalifikację" }));
  assert.doesNotMatch(screen.getByRole("dialog").textContent ?? "", /Routing/);
  await user.click(screen.getByRole("button", { name: "Potwierdź kwalifikację" }));
  await waitFor(() => assert.equal(screen.queryByRole("dialog") === null, true));
  assert.equal(screen.queryByText(/Routing oczekuje/) === null, true);
  assert.equal(screen.queryByRole("button", { name: /Wykonaj routing:/ }) === null, true);
  assert.equal(screen.queryByRole("button", { name: /Przejdź do etapu:/ }) === null, true);
});

test("missing proposal is a valid read state, while another 404 cannot enable generation", async () => {
  let stageMissing = false;
  const { user } = qualificationFlow({ initial: "missing", intercept: async path => stageMissing && path.endsWith("/basket-qualification-proposal") ? json({ code: "STAGE_NOT_FOUND", error: "Etap nie istnieje." }, 404) : undefined });
  await screen.findByRole("button", { name: "Przygotuj propozycję kwalifikacji" });
  await user.click(screen.getByRole("button", { name: "Ponów sprawdzenie stanu" }));
  await screen.findByText("Stan kwalifikacji i routingu odświeżony.");
  assert.equal(screen.queryByRole("alert") === null, true);
  stageMissing = true;
  await user.click(screen.getByRole("button", { name: "Ponów sprawdzenie stanu" }));
  await screen.findByText(/Nie udało się sprawdzić propozycji kwalifikacji/);
  assert.equal(screen.queryByRole("button", { name: "Przygotuj propozycję kwalifikacji" }) === null, true);
});

test("planned stage displays backend blockers, counts and an existing resolution link", async () => {
  const readiness = ready(false);
  readiness.basketValidation = { valid: false, problems: [{ message: "Brakuje przekazania uczestników z koszyka A." }] };
  const user = setup({ stages: [stage(1, "completed"), stage(2)], readiness });
  await selectFinals(user);
  await screen.findByText("Brakujące seedy: 3, 4.");
  assert.ok(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"));
  assert.ok(screen.getByText("Brakuje przekazania uczestników z koszyka A."));
  assert.ok(screen.getByRole("link", { name: "Sprawdź seedy graczy" }));
  assert.ok(screen.getByText("Oczekiwano: 4 · Aktualnie: 2"));
});

test("readiness separates a short stage summary and actions from complete diagnostics", async () => {
  const readiness = ready(false);
  readiness.message = "Pełna diagnoza serwera: uczestnicy pochodzą z niekompletnego wejścia.";
  readiness.basketValidation = { valid: false, problems: [{ message: "Sprawdź dodatkowe przypisanie w koszyku A." }] };
  const user = setup({ stages: [stage(1, "completed"), stage(2)], readiness, nextStep: true });
  await selectFinals(user);
  const panel = screen.getByLabelText("Gotowość etapu");
  await within(panel).findByText("Oczekiwano: 4 · Aktualnie: 2");
  assert.ok(within(panel).getByText("Finały: Liczba uczestników nie odpowiada wymaganiom etapu."));
  const details = within(panel).getByRole("region", { name: "Szczegóły diagnostyczne" });
  assert.ok(within(details).getByText(readiness.message));
  assert.ok(within(details).getByText("Sprawdź dodatkowe przypisanie w koszyku A."));
  assert.ok(within(details).getByText("Brakujące seedy: 3, 4."));
  assert.ok(within(details).getByText("Kod diagnostyczny: STAGE_PARTICIPANTS_INCONSISTENT"));
  for (const name of ["Sprawdź seedy graczy", "Sprawdź koszyki i dopływ uczestników"]) {
    const link = within(panel).getByRole("link", { name });
    assert.ok(link.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING);
  }
  const next = screen.getByRole("region", { name: "Etap wymaga przygotowania" });
  assert.ok(within(next).getByText("Oczekiwano: 4 · Aktualnie: 2"));
  assert.equal(within(next).queryByText(readiness.message), null);
  assert.equal(screen.getAllByText(readiness.message).length, 1);
});

test("basket readiness retains full backend diagnostics below the repair guidance", async () => {
  const readiness = ready(false);
  readiness.reasonCode = "STAGE_BASKET_CONFIGURATION_INVALID";
  readiness.message = "Konfiguracja koszyków etapów jest niespójna.";
  readiness.basketValidation = { valid: false, problems: [{ message: "Etap Finały: źródła dostarczają 2 zamiast 4 uczestników." }] };
  const user = setup({ stages: [stage(1, "completed"), stage(2)], readiness });
  await selectFinals(user);
  const panel = screen.getByLabelText("Gotowość etapu");
  await within(panel).findByText("Finały: Konfiguracja koszyków zawiera błędy.");
  assert.ok(within(panel).getByText("Oczekiwano: 4 · Aktualnie: 2"));
  assert.ok(within(panel).getByRole("link", { name: "Sprawdź koszyki i dopływ uczestników" }));
  const details = within(panel).getByRole("region", { name: "Szczegóły diagnostyczne" });
  assert.ok(within(details).getByText(readiness.basketValidation.problems[0].message));
  assert.ok(within(details).getByText(readiness.message));
});

test("start locks double submit through request and refetch, then presents the active stage", async () => {
  const stages = [stage(1, "completed"), stage(2)];
  let writes = 0;
  let finishWrite: () => void = () => {};
  let finishRead: () => void = () => {};
  let saved = false;
  const readBarrier = new Promise<void>(resolve => { finishRead = resolve; });
  const user = setup({ stages, intercept: async (path, init) => {
    if (path.endsWith("/stages/2/start") && init?.method === "POST") {
      writes++; await new Promise<void>(resolve => { finishWrite = resolve; });
      stages[1] = stage(2, "active"); saved = true; return json(stages[1]);
    }
    if (path.endsWith("/stages") && saved) { await readBarrier; return json(stages); }
    return undefined;
  } });
  await selectFinals(user);
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"), false));
  await user.click(screen.getByRole("button", { name: "Rozpocznij etap" }));
  const confirm = screen.getByRole("button", { name: "Potwierdź rozpoczęcie etapu" });
  await user.dblClick(confirm);
  assert.equal(writes, 1); assert.ok(confirm.matches(":disabled"));
  assert.ok(screen.getByText("Uruchamianie…"));
  finishWrite();
  await waitFor(() => assert.equal(saved, true));
  assert.ok(confirm.matches(":disabled"));
  finishRead();
  await screen.findByText("Etap „Finały” rozpoczęty.");
  assert.ok(screen.getByText("Aktywny etap: Finały"));
  assert.equal(screen.queryByRole("button", { name: "Rozpocznij etap" }) === null, true);
});

test("start conflict refreshes readiness and retains an actionable error without success", async () => {
  const readiness = ready();
  let reads = 0;
  const user = setup({ stages: [stage(1, "completed"), stage(2)], readiness, intercept: async path => {
    if (path.endsWith("/readiness")) reads++;
    if (path.endsWith("/start")) { Object.assign(readiness, ready(false)); return json({ code: "STAGE_PARTICIPANTS_INCONSISTENT", error: "Skład etapu zmienił się w innym oknie." }, 409); }
    return undefined;
  } });
  await selectFinals(user);
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"), false));
  await user.click(screen.getByRole("button", { name: "Rozpocznij etap" }));
  await user.click(screen.getByRole("button", { name: "Potwierdź rozpoczęcie etapu" }));
  await within(screen.getByRole("dialog")).findByText(/Skład etapu zmienił się/);
  await waitFor(() => assert.equal(within(screen.getByRole("dialog")).getByRole("button", { name: "Anuluj" }).matches(":disabled"), false));
  assert.ok(reads >= 2);
  assert.equal(screen.queryByText("Etap „Finały” rozpoczęty.") === null, true);
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Anuluj" }));
  await screen.findByText("Brakujące seedy: 3, 4.");
});

test("next-step start intent opens the same confirmation for the first ready stage", async () => {
  const stages = [stage(1)];
  let writes = 0;
  const user = setup({ draft: true, stages, path: "/tournaments/1?tab=stages&stage=1&action=start", intercept: async (path, init) => {
    if (path.endsWith("/start") && init?.method === "POST") {
      writes++;
      stages[0] = stage(1, "active");
      return json(stages[0]);
    }
    return undefined;
  } });
  const confirm = await screen.findByRole("button", { name: "Potwierdź rozpoczęcie etapu" });
  await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
  await user.click(confirm);
  await screen.findByText("Etap „Eliminacje” rozpoczęty.");
  assert.equal(writes, 1);
});

test("next-step start intent targets the ready second stage even when the first is selected", async () => {
  const stages = [stage(1, "completed"), stage(2)];
  let writes = 0;
  const user = setup({ stages, path: "/tournaments/1?tab=stages&stage=2&action=start", intercept: async (path, init) => {
    if (path.endsWith("/start") && init?.method === "POST") {
      writes++;
      stages[1] = stage(2, "active");
      return json(stages[1]);
    }
    return undefined;
  } });
  const confirm = await screen.findByRole("button", { name: "Potwierdź rozpoczęcie etapu" });
  await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
  assert.match(screen.getByRole("dialog").textContent ?? "", /Finały/);
  await user.dblClick(confirm);
  await screen.findByText("Etap „Finały” rozpoczęty.");
  assert.equal(writes, 1);
});

test("completion explains consequences, prevents double submit and reveals pending qualification", async () => {
  const stages = [stage(1, "active"), stage(2)];
  let writes = 0;
  let finish: () => void = () => {};
  const user = setup({ stages, basket: true, readiness: ready(false), intercept: async path => {
    if (!path.endsWith("/complete")) return undefined;
    writes++; await new Promise<void>(resolve => { finish = resolve; });
    stages[0] = stage(1, "completed"); return json(stages[0]);
  } });
  await user.click(await screen.findByRole("button", { name: "Zakończ etap" }));
  assert.match(screen.getByRole("dialog").textContent ?? "", /Ranking zostanie obliczony i zamrożony/);
  const confirm = await screen.findByRole("button", { name: "Potwierdź zakończenie etapu" });
  await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
  await user.dblClick(confirm);
  assert.equal(writes, 1); assert.ok(confirm.matches(":disabled"));
  finish();
  await screen.findByText(/Etap „Eliminacje” zakończony/);
  await screen.findByText("Propozycja kwalifikacji oczekuje na zatwierdzenie.");
  await selectFinals(user);
  await screen.findByText("Brakujące seedy: 3, 4.");
  assert.ok(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"));
});

test("complete success closes confirmation before refetch and never previews the completed stage", async () => {
  const stages = [stage(1, "active")];
  let saved = false;
  let refreshStarted = false;
  let completedPreviews = 0;
  let releaseRead!: () => void;
  const readBarrier = new Promise<void>(resolve => { releaseRead = resolve; });
  const user = setup({ stages, intercept: async path => {
    if (path.endsWith("/complete")) {
      saved = true;
      stages[0] = stage(1, "completed");
      return json(stages[0]);
    }
    if (saved && path.endsWith("/qualification-preview")) {
      completedPreviews++;
      return json({ code: "STAGE_NOT_ACTIVE" }, 409);
    }
    if (saved && path.endsWith("/stages")) {
      refreshStarted = true;
      await readBarrier;
      return json(stages);
    }
    return undefined;
  } });
  try {
    await user.click(await screen.findByRole("button", { name: "Zakończ etap" }));
    const confirm = screen.getByRole("button", { name: "Potwierdź zakończenie etapu" });
    await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
    await user.click(confirm);
    await waitFor(() => assert.equal(refreshStarted, true));
    assert.equal(completedPreviews, 0, "Success refetched qualification preview for a completed stage");
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
    assert.equal(screen.queryByText(/STAGE_NOT_ACTIVE/), null);
    assert.ok(screen.getByText("Kończenie etapu i odświeżanie danych…"));
    assert.ok(screen.getByRole("button", { name: "Zakończ etap" }).matches(":disabled"));
  } finally {
    releaseRead();
  }
  await screen.findByText(/Etap „Eliminacje” zakończony/);
  assert.equal(completedPreviews, 0);
  assert.equal(screen.queryByRole("dialog"), null);
});

test("real complete STAGE_NOT_ACTIVE failure remains visible without claiming success", async () => {
  let stageReads = 0;
  const user = setup({ stages: [stage(1, "active")], intercept: async path => {
    if (path.endsWith("/stages")) stageReads++;
    if (path.endsWith("/complete")) return json({ code: "STAGE_NOT_ACTIVE" }, 409);
    return undefined;
  } });
  await user.click(await screen.findByRole("button", { name: "Zakończ etap" }));
  const confirm = screen.getByRole("button", { name: "Potwierdź zakończenie etapu" });
  await waitFor(() => assert.equal(confirm.matches(":disabled"), false));
  await user.click(confirm);
  await within(screen.getByRole("dialog")).findByText(/STAGE_NOT_ACTIVE/);
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Anuluj" }).matches(":disabled"), false));
  assert.ok(stageReads >= 2);
  assert.equal(screen.queryByText(/Etap „Eliminacje” zakończony/), null);
});

test("active stage confirmation still loads qualification preview on each opening", async () => {
  let previews = 0;
  const user = setup({ stages: [stage(1, "active")], intercept: async path => {
    if (path.endsWith("/qualification-preview")) previews++;
    return undefined;
  } });
  await screen.findByRole("button", { name: "Zakończ etap" });
  assert.equal(previews, 0);
  for (const expected of [1, 2]) {
    await user.click(screen.getByRole("button", { name: "Zakończ etap" }));
    await waitFor(() => assert.equal(screen.getByRole("button", { name: "Potwierdź zakończenie etapu" }).matches(":disabled"), false));
    assert.equal(previews, expected);
    await user.click(screen.getByRole("button", { name: "Anuluj" }));
    assert.equal(screen.queryByRole("dialog"), null);
  }
});

test("first stage uses the existing tournament start endpoint", async () => {
  const stages = [stage(1)];
  let writes = 0;
  const user = setup({ stages, draft: true, intercept: async path => {
    if (path !== "/api/tournaments/1/start") return undefined;
    writes++; stages[0] = stage(1, "active"); return json({});
  } });
  await screen.findByText("Gotowy do rozpoczęcia");
  await user.click(screen.getByRole("button", { name: "Rozpocznij etap" }));
  await user.click(screen.getByRole("button", { name: "Potwierdź rozpoczęcie etapu" }));
  await screen.findByText("Etap „Eliminacje” rozpoczęty.");
  assert.equal(writes, 1);
});

test("readiness failure keeps start disabled and allows a fresh readiness check", async () => {
  let failed = true;
  const user = setup({ stages: [stage(1)], draft: true, intercept: async path => path.endsWith("/readiness") && failed ? json({}, 503) : undefined });
  await screen.findByRole("button", { name: "Ponów sprawdzenie" });
  assert.ok(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"));
  failed = false;
  await user.click(screen.getByRole("button", { name: "Ponów sprawdzenie" }));
  await screen.findByText("Gotowy do rozpoczęcia");
  assert.equal(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"), false);
});

test("completion preview rejects incomplete results and requires a successful retry", async () => {
  let failed = true;
  const user = setup({ stages: [stage(1, "active")], intercept: async path => path.endsWith("/qualification-preview") && failed ? json({ code: "STAGE_INCOMPLETE" }, 422) : undefined });
  await user.click(await screen.findByRole("button", { name: "Zakończ etap" }));
  await within(screen.getByRole("dialog")).findByText(/Nie wszystkie wymagane mecze/);
  assert.ok(screen.getByRole("button", { name: "Potwierdź zakończenie etapu" }).matches(":disabled"));
  failed = false;
  await user.click(screen.getByRole("button", { name: "Ponów sprawdzenie wyników" }));
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Potwierdź zakończenie etapu" }).matches(":disabled"), false));
});

test("ready roster does not bypass an unfinished sequential seeding ceremony", async () => {
  const stages = [{ ...stage(1), entrySeedingPolicy: "random", randomRevealOrder: "sequential" }];
  setup({ stages, draft: true, intercept: async path => path.includes("seeding-ceremony") ? json({ ceremony: null }) : undefined });
  await screen.findByRole("link", { name: "Przejdź do losowania" });
  assert.ok(screen.getByRole("button", { name: "Rozpocznij etap" }).matches(":disabled"));
  assert.ok(screen.getAllByText("Dokończ ceremonię losowania przed rozpoczęciem etapu.").length > 0);
});
