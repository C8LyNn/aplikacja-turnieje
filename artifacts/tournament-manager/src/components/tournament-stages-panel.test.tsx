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

function setup(options: {
  stages: ReturnType<typeof stage>[];
  readiness?: ReturnType<typeof ready>;
  basket?: boolean;
  draft?: boolean;
  intercept?: (path: string, init?: RequestInit) => Promise<Response | undefined>;
}) {
  globalThis.fetch = async (input, init) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost").pathname;
    const intercepted = await options.intercept?.(path, init);
    if (intercepted) return intercepted;
    if (path.endsWith("/stages")) return json(options.stages);
    if (path.endsWith("/stage-baskets")) return json({ flowAuthority: options.basket ? "basket_v1" : "legacy", baskets: [], routes: [], validation: { valid: true, problems: [] } });
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
    <TournamentStagesPanel tournamentId={1} tournamentStatus={options.draft ? "draft" : "active"} matches={[]} canManage />
  </Router></QueryClientProvider>);
  return userEvent.setup();
}
async function selectFinals(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /Etap 2.*Finały/ }));
}

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
