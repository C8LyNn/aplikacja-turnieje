import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TournamentStagesPanel } from "./tournament-stages-panel";

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
  canManage?: boolean;
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
  const location = memoryLocation({ path: "/tournaments/1?tab=stages" });
  render(<QueryClientProvider client={client}><Router hook={location.hook}>
    <TournamentStagesPanel tournamentId={1} tournamentStatus={options.draft ? "draft" : "active"} matches={[]} canManage={options.canManage ?? true} />
  </Router></QueryClientProvider>);
  return userEvent.setup();
}
async function selectFinals(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /Etap 2.*Finały/ }));
}

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
    releaseWrite();
    await waitFor(() => assert.equal(refreshStarted, true));
    await screen.findByText("Trwa operacja i odświeżanie stanu…");
    assert.ok(screen.getByRole("button", { name: operation === "approve" ? "Zatwierdzanie i odświeżanie…" : "Ponów sprawdzenie stanu" }).matches(":disabled"));
    releaseRead();
    await waitFor(() => assert.equal(screen.queryByText("Trwa operacja i odświeżanie stanu…") === null, true));
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
    await waitFor(() => assert.equal(screen.queryByText("Trwa operacja i odświeżanie stanu…") === null, true));
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
  assert.match(screen.getByText(/Uczestnicy według serwera/).textContent ?? "", /2 \/ 4/);
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
